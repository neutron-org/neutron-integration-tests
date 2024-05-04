import '@neutron-org/neutronjsplus';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { walletWrapper } from '@neutron-org/neutronjsplus';
import { NeutronContract, Wallet } from '@neutron-org/neutronjsplus/dist/types';
import {
  WalletWrapper,
  createWalletWrapper,
} from '@neutron-org/neutronjsplus/dist/wallet_wrapper';
import { TestStateLocalCosmosTestNet } from '../../helpers/cosmos_testnet';

const config = require('../../config.json');

interface ReserveStats {
  readonly total_distributed: string;
  readonly total_reserved: string;
  readonly total_processed_burned_coins: string;
}

describe('Neutron / Treasury', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount1: walletWrapper.WalletWrapper;
  let neutronAccount2: walletWrapper.WalletWrapper;
  let mainDaoWallet: Wallet;
  let securityDaoWallet: Wallet;
  let holder1Wallet: Wallet;
  let holder2Wallet: Wallet;
  let mainDaoAddr: string;
  let securityDaoAddr: string;
  let holder1Addr: string;
  let holder2Addr: string;
  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );
    neutronAccount1 = await createWalletWrapper(
      neutronChain,
      testState.wallets.neutron.demo1,
    );
    neutronAccount2 = await createWalletWrapper(
      neutronChain,
      testState.wallets.neutron.demo2,
    );
    mainDaoWallet = testState.wallets.neutron.demo1;
    securityDaoWallet = testState.wallets.neutron.icq;
    holder1Wallet = testState.wallets.neutron.demo2;
    holder2Wallet = testState.wallets.neutron.rly1;
    mainDaoAddr = mainDaoWallet.address;
    securityDaoAddr = securityDaoWallet.address;
    holder1Addr = holder1Wallet.address;
    holder2Addr = holder2Wallet.address;
  });

  describe('Treasury', () => {
    let dsc: string;
    let reserve: string;
    let treasury: string;
    beforeAll(async () => {
      dsc = await setupDSC(
        neutronAccount1,
        mainDaoAddr.toString(),
        securityDaoAddr.toString(),
      );
      treasury = (await neutronChain.getChainAdmins())[0];
    });

    describe('some corner cases', () => {
      let reserveStats: ReserveStats;
      beforeEach(async () => {
        reserve = await setupReserve(neutronAccount1, {
          mainDaoAddress: mainDaoAddr.toString(),
          securityDaoAddress: securityDaoAddr.toString(),
          distributionRate: '0.0',
          minPeriod: 1,
          distributionContract: dsc,
          treasuryContract: treasury,
          vestingDenominator: '100000000000',
        });

        reserveStats = await normalizeReserveBurnedCoins(
          neutronAccount1,
          reserve,
        );
      });
      test('zero distribution rate', async () => {
        await neutronAccount1.msgSend(reserve, '100000');
        const res = await neutronAccount1.executeContract(reserve, {
          distribute: {},
        });

        expect(res.code).toEqual(0);

        const stats = (await neutronChain.queryContract(reserve, {
          stats: {},
        })) as any;
        expect(parseInt(stats.total_distributed)).toEqual(0);
        expect(parseInt(stats.total_reserved)).toBeGreaterThan(0);
      });
      test('burned coins increment', async () => {
        await neutronAccount1.msgSend(reserve, '100000');
        let burnedCoins = await getBurnedCoinsAmount(neutronChain);
        await neutronAccount1.executeContract(reserve, {
          distribute: {},
        });

        let stats = (await neutronChain.queryContract(reserve, {
          stats: {},
        })) as any;
        expect(stats.total_processed_burned_coins).toEqual(burnedCoins);

        burnedCoins = await getBurnedCoinsAmount(neutronChain);
        await neutronAccount1.executeContract(reserve, {
          distribute: {},
        });
        stats = await neutronChain.queryContract(reserve, { stats: {} });
        expect(stats.total_processed_burned_coins).toEqual(burnedCoins);
      });
      test('drain reserve', async () => {
        await neutronAccount1.simulateFeeBurning(1750);

        await neutronAccount1.msgSend(reserve, '2');

        // First distribution
        await neutronAccount1.executeContract(reserve, {
          distribute: {},
        });

        let reserveBalance = await neutronChain.queryDenomBalance(
          reserve,
          neutronChain.denom,
        );
        expect(reserveBalance).toEqual(1);

        // Second distribution
        await neutronAccount1.executeContract(reserve, {
          distribute: {},
        });
        reserveBalance = await neutronChain.queryDenomBalance(
          reserve,
          neutronChain.denom,
        );
        expect(reserveBalance).toEqual(0);

        // Third distribution
        await expect(
          neutronAccount1.executeContract(reserve, {
            distribute: {},
          }),
        ).rejects.toThrow(/No funds to distribute/);
      });
      test('set shares by unauthorized', async () => {
        await expect(
          neutronAccount2.executeContract(dsc, {
            set_shares: {
              shares: [
                [holder1Addr.toString(), '1'],
                [holder2Addr.toString(), '2'],
              ],
            },
          }),
        ).rejects.toThrow(/Unauthorized/);
      });

      test('burned coins amount u32 safe calculation', async () => {
        await neutronAccount1.msgSend(reserve, '100000');
        // u32::MAX
        await neutronAccount1.simulateFeeBurning(4_294_967_295);

        await neutronAccount1.executeContract(reserve, {
          distribute: {},
        });
        const afterStats = (await neutronChain.queryContract(reserve, {
          stats: {},
        })) as any;

        expect(
          parseInt(afterStats.total_processed_burned_coins) -
            parseInt(reserveStats.total_processed_burned_coins),
        ).toEqual(4_294_967_295);

        const burnedCoins = await getBurnedCoinsAmount(neutronChain);

        await neutronAccount1.executeContract(reserve, {
          distribute: {},
        });

        const stats = (await neutronChain.queryContract(reserve, {
          stats: {},
        })) as any;
        expect(stats.total_processed_burned_coins).toEqual(`${burnedCoins}`);
      });
    });

    describe('happy path', () => {
      let lastTreasuryBalance: number;
      let reserveStats: ReserveStats;
      beforeAll(async () => {
        lastTreasuryBalance = await neutronChain.queryDenomBalance(
          treasury,
          NEUTRON_DENOM,
        );
      });
      test('set shares', async () => {
        reserve = await setupReserve(neutronAccount1, {
          mainDaoAddress: mainDaoAddr.toString(),
          securityDaoAddress: securityDaoAddr.toString(),
          distributionRate: '0.21',
          minPeriod: 1,
          distributionContract: dsc,
          treasuryContract: treasury,
          vestingDenominator: '100000000000',
        });
        await neutronAccount1.executeContract(dsc, {
          set_shares: {
            shares: [
              [holder1Addr.toString(), '1'],
              [holder2Addr.toString(), '2'],
            ],
          },
        });
      });

      test('fund', async () => {
        await neutronChain.waitBlocks(1);
        reserveStats = await normalizeReserveBurnedCoins(
          neutronAccount1,
          reserve,
        );
        const burnedCoinsBefore = await getBurnedCoinsAmount(neutronChain);
        expect(burnedCoinsBefore).not.toBeNull();

        await neutronAccount1.simulateFeeBurning(20_000_000);
        await neutronAccount1.msgSend(reserve, '1000000000');

        const res = await neutronAccount1.executeContract(reserve, {
          distribute: {},
        });
        expect(res.code).toEqual(0);
        await neutronChain.waitBlocks(1);

        const burnedCoinsAfter = await getBurnedCoinsAmount(neutronChain);
        expect(burnedCoinsAfter).not.toBeNull();

        const stats = await neutronChain.queryContract(reserve, {
          stats: {},
        });
        expect(stats).toEqual(
          expect.objectContaining({
            total_distributed: '42014',
            total_reserved: `${158053 + parseInt(reserveStats.total_reserved)}`,
            total_processed_burned_coins: `${
              parseInt(burnedCoinsAfter || '0') -
              parseInt(burnedCoinsBefore || '0') +
              parseInt(reserveStats.total_processed_burned_coins)
            }`,
          }),
        );
      });

      test('verify treasury', async () => {
        await neutronChain.waitBlocks(1);
        const treasuryBalance = await neutronChain.queryDenomBalance(
          treasury,
          NEUTRON_DENOM,
        );
        expect(treasuryBalance - lastTreasuryBalance).toEqual(
          158053 + parseInt(reserveStats.total_reserved),
        );
        lastTreasuryBalance = treasuryBalance;
      });
      test('verify pendings', async () => {
        const pending = await neutronChain.queryContract(dsc, {
          pending: {},
        });
        expect(pending).toEqual([
          [holder1Addr.toString(), '14005'],
          [holder2Addr.toString(), '28009'],
        ]);
      });
      test('claim pending', async () => {
        const balanceBefore = await neutronChain.queryDenomBalance(
          holder1Addr.toString(),
          NEUTRON_DENOM,
        );
        const res = await neutronAccount2.executeContract(dsc, {
          claim: {},
        });
        expect(res.code).toEqual(0);
        const events = res.events;
        const attrs = events.filter((e) => e.type === 'transfer');
        expect(attrs[1].attributes).toEqual([
          {
            key: 'recipient',
            value: holder1Addr.toString(),
          },
          { key: 'sender', value: dsc },
          { key: 'amount', value: `14005${NEUTRON_DENOM}` },
          { key: 'msg_index', value: '0' },
        ]);

        const balanceAfter = await neutronChain.queryDenomBalance(
          holder1Addr.toString(),
          NEUTRON_DENOM,
        );
        expect(balanceAfter - balanceBefore).toEqual(4005);
      });
    });

    describe('update treasury config', () => {
      beforeEach(async () => {
        reserve = await setupReserve(neutronAccount1, {
          mainDaoAddress: mainDaoAddr.toString(),
          securityDaoAddress: securityDaoAddr.toString(),
          distributionRate: '0.23',
          minPeriod: 1000,
          distributionContract: dsc,
          treasuryContract: treasury,
          vestingDenominator: '100000000000',
        });
      });
      test('update reserve config by unauthorized', async () => {
        await expect(
          neutronAccount2.executeContract(reserve, {
            update_config: {
              distributionRate: '0.11',
            },
          }),
        ).rejects.toThrow(/Unauthorized/);
      });
      test('update reserve config by owner', async () => {
        const res = await neutronAccount1.executeContract(reserve, {
          update_config: {
            distribution_rate: '0.11',
            min_period: 500,
            dao: mainDaoAddr.toString(),
            distribution_contract: dsc,
          },
        });
        expect(res.code).toEqual(0);
        const config = await neutronChain.queryContract<{
          distribution_rate: string;
          min_period: number;
          distribution_contract: string;
        }>(reserve, {
          config: {},
        });
        expect(config.distribution_rate).toEqual('0.11');
        expect(config.min_period).toEqual(500);
        expect(config.distribution_contract).toEqual(dsc);
      });
    });
  });

  describe('execution control', () => {
    let dsc: string;
    let treasury: string;
    let reserve: string;
    beforeAll(async () => {
      dsc = await setupDSC(
        neutronAccount1,
        mainDaoAddr.toString(),
        securityDaoAddr.toString(),
      );
      treasury = (await neutronChain.getChainAdmins())[0];
      reserve = await setupReserve(neutronAccount1, {
        mainDaoAddress: mainDaoAddr.toString(),
        securityDaoAddress: securityDaoAddr.toString(),
        distributionRate: '0.21',
        minPeriod: 1000,
        distributionContract: dsc,
        treasuryContract: treasury,
        vestingDenominator: '100000000000',
      });
    });

    test('distribution', async () => {
      await testExecControl(
        neutronAccount1,
        dsc,
        async () => {
          const res = await neutronAccount1.executeContract(dsc, {
            set_shares: {
              shares: [
                [holder1Addr.toString(), '1'],
                [holder2Addr.toString(), '2'],
              ],
            },
          });
          return res.code;
        },
        async () => {
          const shares = await neutronChain.queryContract<[][]>(dsc, {
            shares: {},
          });
          expect(shares).toEqual([
            [holder1Addr.toString(), '1'],
            [holder2Addr.toString(), '2'],
          ]);
        },
      );
    });

    test('reserve', async () => {
      await neutronAccount1.msgSend(reserve, '10000000');
      await testExecControl(
        neutronAccount1,
        reserve,
        async () => {
          const res = await neutronAccount1.executeContract(reserve, {
            distribute: {},
          });
          return res.code;
        },
        async () => {
          const stats = await neutronChain.queryContract(reserve, {
            stats: {},
          });
          expect(stats).toEqual({
            total_distributed: '88284',
            total_reserved: '332120',
            total_processed_burned_coins: '4294967295',
          });
        },
      );
    });
  });
});

const setupDSC = async (
  cm: WalletWrapper,
  mainDaoAddress: string,
  securityDaoAddress: string,
) => {
  const codeId = await cm.storeWasm(NeutronContract.DISTRIBUTION);
  return await cm.instantiateContract(
    codeId,
    {
      main_dao_address: mainDaoAddress,
      security_dao_address: securityDaoAddress,
      denom: NEUTRON_DENOM,
    },
    'dsc',
  );
};

/**
 * normalizeReserveBurnedCoins simulates fee burning via send tx. After normalization amount of burned coins equals to 7500.
 */
const normalizeReserveBurnedCoins = async (
  cm: WalletWrapper,
  reserveAddress: string,
): Promise<ReserveStats> => {
  // Normalize state
  let normalize = true;
  let reserveStats: ReserveStats = {
    total_processed_burned_coins: '0',
    total_reserved: '0',
    total_distributed: '0',
  };
  while (normalize) {
    await cm.msgSend(reserveAddress, '1');
    await cm.executeContract(reserveAddress, {
      distribute: {},
    });
    reserveStats = await cm.chain.queryContract<ReserveStats>(reserveAddress, {
      stats: {},
    });

    const burnedCoins = await getBurnedCoinsAmount(cm.chain);
    expect(burnedCoins).not.toBeNull();
    normalize =
      parseInt(reserveStats.total_processed_burned_coins) + 7500 !==
      parseInt(burnedCoins || '0');
  }

  return reserveStats;
};

const getBurnedCoinsAmount = async (
  cm: CosmosWrapper,
): Promise<string | undefined | null> => {
  const totalBurnedNeutrons = await cm.queryTotalBurnedNeutronsAmount();
  return totalBurnedNeutrons.total_burned_neutrons_amount.coin.amount;
};

const setupReserve = async (
  cm: WalletWrapper,
  opts: {
    mainDaoAddress: string;
    distributionRate: string;
    minPeriod: number;
    distributionContract: string;
    treasuryContract: string;
    securityDaoAddress: string;
    vestingDenominator: string;
  },
) => {
  const codeId = await cm.storeWasm(NeutronContract.RESERVE);
  return await cm.instantiateContract(
    codeId,
    {
      main_dao_address: opts.mainDaoAddress,
      denom: NEUTRON_DENOM,
      distribution_rate: opts.distributionRate,
      min_period: opts.minPeriod,
      distribution_contract: opts.distributionContract,
      treasury_contract: opts.treasuryContract,
      security_dao_address: opts.securityDaoAddress,
      vesting_denominator: opts.vestingDenominator,
    },
    'reserve',
  );
};

/**
 * Tests a pausable contract execution control.
 * @param testingContract is the contract the method tests;
 * @param execAction is an executable action to be called during a pause and after unpausing
 * as the main part of the test. Should return the execution response code;
 * @param actionCheck is called after unpausing to make sure the executable action worked.
 */
async function testExecControl(
  account: WalletWrapper,
  testingContract: string,
  execAction: () => Promise<number | undefined>,
  actionCheck: () => Promise<void>,
) {
  // check contract's pause info before pausing
  let pauseInfo = await account.chain.queryPausedInfo(testingContract);
  expect(pauseInfo).toEqual({ unpaused: {} });
  expect(pauseInfo.paused).toEqual(undefined);

  // pause contract
  let res = await account.executeContract(testingContract, {
    pause: {
      duration: 50,
    },
  });
  expect(res.code).toEqual(0);

  // check contract's pause info after pausing
  pauseInfo = await account.chain.queryPausedInfo(testingContract);
  expect(pauseInfo.unpaused).toEqual(undefined);
  expect(pauseInfo.paused.until_height).toBeGreaterThan(0);

  // execute msgs on paused contract
  await expect(execAction()).rejects.toThrow(/Contract execution is paused/);

  // unpause contract
  res = await account.executeContract(testingContract, {
    unpause: {},
  });
  expect(res.code).toEqual(0);

  // check contract's pause info after unpausing
  pauseInfo = await account.chain.queryPausedInfo(testingContract);
  expect(pauseInfo).toEqual({ unpaused: {} });
  expect(pauseInfo.paused).toEqual(undefined);

  // execute msgs on unpaused contract
  const code = await execAction();
  expect(code).toEqual(0);
  await actionCheck();

  // pause contract again for a short period
  const shortPauseDuration = 5;
  res = await account.executeContract(testingContract, {
    pause: {
      duration: shortPauseDuration,
    },
  });
  expect(res.code).toEqual(0);

  // check contract's pause info after pausing
  pauseInfo = await account.chain.queryPausedInfo(testingContract);
  expect(pauseInfo.unpaused).toEqual(undefined);
  expect(pauseInfo.paused.until_height).toBeGreaterThan(0);

  // wait and check contract's pause info after unpausing
  await account.chain.waitBlocks(shortPauseDuration);
  pauseInfo = await account.chain.queryPausedInfo(testingContract);
  expect(pauseInfo).toEqual({ unpaused: {} });
  expect(pauseInfo.paused).toEqual(undefined);
}
