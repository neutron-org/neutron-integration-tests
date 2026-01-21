import '@neutron-org/neutronjsplus';
import { inject } from 'vitest';
import { Wallet } from '../../helpers/wallet';
import { CONTRACTS } from '../../helpers/constants';
import { LocalState } from '../../helpers/local_state';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import { getNeutronDAOCore } from '@neutron-org/neutronjsplus/dist/dao';
import { QueryClientImpl as FeeburnerQueryClient } from '@neutron-org/neutronjs/neutron/feeburner/query.rpc.Query';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus/dist/constants';

import config from '../../config.json';

describe('Neutron / Treasury', () => {
  let testState: LocalState;
  let neutronClient: NeutronTestClient;
  let neutronClient2: NeutronTestClient;
  let neutronWallet2: Wallet;
  let mainDaoWallet: Wallet;
  let securityDaoWallet: Wallet;
  let holder1Wallet: Wallet;
  let holder2Wallet: Wallet;
  let mainDaoAddr: string;
  let securityDaoAddr: string;
  let holder1Addr: string;
  let holder2Addr: string;
  let neutronRpcClient: any;
  let feeburnerQuerier: FeeburnerQueryClient;

  beforeAll(async () => {
    testState = await LocalState.create(config, inject('mnemonics'));

    mainDaoWallet = testState.wallets.neutron.demo1Secp256k1;

    neutronClient = await NeutronTestClient.connectWithSigner(mainDaoWallet);

    neutronWallet2 = testState.wallets.neutron.demo2;

    neutronClient2 = await NeutronTestClient.connectWithSigner(neutronWallet2);

    securityDaoWallet = testState.wallets.neutron.icq;
    holder1Wallet = testState.wallets.neutron.demo2;
    holder2Wallet = await testState.nextNeutronWallet();
    mainDaoAddr = mainDaoWallet.address;
    securityDaoAddr = securityDaoWallet.address;
    holder1Addr = holder1Wallet.address;
    holder2Addr = holder2Wallet.address;
    neutronRpcClient = await testState.neutronRpcClient();
    feeburnerQuerier = new FeeburnerQueryClient(neutronRpcClient);
  });

  describe('Treasury', () => {
    let dsc: string;
    let reserve: string;
    let treasury: string;
    beforeAll(async () => {
      dsc = await setupDSC(neutronClient, mainDaoAddr, securityDaoAddr);
      treasury = await getNeutronDAOCore(neutronClient, neutronRpcClient);
    });

    describe('some corner cases', () => {
      let reserveStats: ReserveStats;
      beforeEach(async () => {
        reserve = await setupReserve(neutronClient, {
          mainDaoAddress: mainDaoAddr,
          securityDaoAddress: securityDaoAddr,
          distributionRate: '0.0',
          minPeriod: 1,
          distributionContract: dsc,
          treasuryContract: treasury,
          vestingDenominator: '100000000000',
        });

        reserveStats = await normalizeReserveBurnedCoins(
          neutronClient,
          reserve,
          feeburnerQuerier,
        );
      });

      test('zero distribution rate', async () => {
        await neutronClient.sendTokens(
          reserve,
          [{ denom: NEUTRON_DENOM, amount: '100000' }],
          {
            gas: '300000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1500' }],
          },
        );
        const res = await neutronClient.execute(
          reserve,
          {
            distribute: {},
          },
          [],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );
        expect(res.code).toEqual(0);

        const stats = (await neutronClient.queryContractSmart(reserve, {
          stats: {},
        })) as any;

        expect(parseInt(stats.total_distributed)).toEqual(0);
        expect(parseInt(stats.total_reserved)).toBeGreaterThan(0);
      });
      test('burned coins increment', async () => {
        await neutronClient.sendTokens(
          reserve,
          [{ denom: NEUTRON_DENOM, amount: '100000' }],
          {
            gas: '300000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1500' }],
          },
        );
        let burnedCoins = await getBurnedCoinsAmount(feeburnerQuerier);
        await neutronClient.execute(
          reserve,
          {
            distribute: {},
          },
          [],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );

        let stats = (await neutronClient.queryContractSmart(reserve, {
          stats: {},
        })) as any;
        expect(stats.total_processed_burned_coins).toEqual(burnedCoins);

        burnedCoins = await getBurnedCoinsAmount(feeburnerQuerier);
        await neutronClient.execute(
          reserve,
          {
            distribute: {},
          },
          [],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );
        stats = await neutronClient.queryContractSmart(reserve, {
          stats: {},
        });
        expect(stats.total_processed_burned_coins).toEqual(burnedCoins);
      });
      test('drain reserve', async () => {
        await neutronClient.simulateFeeBurning(1750);

        await neutronClient.sendTokens(
          reserve,
          [{ denom: NEUTRON_DENOM, amount: '2' }],
          {
            gas: '300000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1500' }],
          },
        );

        // First distribution
        await neutronClient.execute(
          reserve,
          {
            distribute: {},
          },
          [],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );

        let reserveBalance = await neutronClient.getBalance(
          reserve,
          NEUTRON_DENOM,
        );
        expect(+reserveBalance.amount).toEqual(1);

        // Second distribution
        await neutronClient.execute(
          reserve,
          {
            distribute: {},
          },
          [],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );
        reserveBalance = await neutronClient.getBalance(reserve, NEUTRON_DENOM);
        expect(+reserveBalance.amount).toEqual(0);

        // Third distribution
        await expect(
          neutronClient.execute(
            reserve,
            {
              distribute: {},
            },
            [],
            {
              gas: '4000000',
              amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
            },
          ),
        ).rejects.toThrow(/No funds to distribute/);
      });
      test('set shares by unauthorized', async () => {
        await expect(
          neutronClient2.execute(
            dsc,
            {
              set_shares: {
                shares: [
                  [holder1Addr, '1'],
                  [holder2Addr, '2'],
                ],
              },
            },
            [],
            {
              gas: '4000000',
              amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
            },
          ),
        ).rejects.toThrow(/Unauthorized/);
      });

      test('burned coins amount u32 safe calculation', async () => {
        await neutronClient.sendTokens(
          reserve,
          [{ denom: NEUTRON_DENOM, amount: '100000' }],
          {
            gas: '300000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1500' }],
          },
        );
        // u32::MAX
        await neutronClient.simulateFeeBurning(4_294_967_295);

        await neutronClient.execute(
          reserve,
          {
            distribute: {},
          },
          [],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );
        const afterStats = (await neutronClient.queryContractSmart(reserve, {
          stats: {},
        })) as any;

        expect(
          parseInt(afterStats.total_processed_burned_coins) -
          parseInt(reserveStats.total_processed_burned_coins),
        ).toEqual(4_294_967_295);

        const burnedCoins = await getBurnedCoinsAmount(feeburnerQuerier);

        await neutronClient.execute(
          reserve,
          {
            distribute: {},
          },
          [],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );

        const stats = (await neutronClient.queryContractSmart(reserve, {
          stats: {},
        })) as any;
        expect(stats.total_processed_burned_coins).toEqual(burnedCoins);
      });
    });

    describe('happy path', () => {
      let lastTreasuryBalance: number;
      let reserveStats: ReserveStats;
      beforeAll(async () => {
        lastTreasuryBalance = parseInt(
          (await neutronClient.getBalance(treasury, NEUTRON_DENOM)).amount,
          10,
        );
      });
      test('set shares', async () => {
        reserve = await setupReserve(neutronClient, {
          mainDaoAddress: mainDaoAddr,
          securityDaoAddress: securityDaoAddr,
          distributionRate: '0.21',
          minPeriod: 1,
          distributionContract: dsc,
          treasuryContract: treasury,
          vestingDenominator: '100000000000',
        });
        await neutronClient.execute(
          dsc,
          {
            set_shares: {
              shares: [
                [holder1Addr, '1'],
                [holder2Addr, '2'],
              ],
            },
          },
          [],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );
      });

      test('fund', async () => {
        await neutronClient.waitBlocks(1);
        reserveStats = await normalizeReserveBurnedCoins(
          neutronClient,
          reserve,
          feeburnerQuerier,
        );
        const burnedCoinsBefore = await getBurnedCoinsAmount(feeburnerQuerier);
        expect(burnedCoinsBefore).not.toBeNull();

        await neutronClient.simulateFeeBurning(20_000_000);
        await neutronClient.sendTokens(
          reserve,
          [{ denom: NEUTRON_DENOM, amount: '1000000000' }],
          {
            gas: '300000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1500' }],
          },
        );

        const res = await neutronClient.execute(
          reserve,
          {
            distribute: {},
          },
          [],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );
        expect(res.code).toEqual(0);
        await neutronClient.waitBlocks(1);

        const burnedCoinsAfter = await getBurnedCoinsAmount(feeburnerQuerier);
        expect(burnedCoinsAfter).not.toBeNull();

        const stats = await neutronClient.queryContractSmart(reserve, {
          stats: {},
        });
        expect(stats).toEqual(
          expect.objectContaining({
            total_distributed: '42014',
            total_reserved: `${158053 + parseInt(reserveStats.total_reserved)}`,
            total_processed_burned_coins: `${parseInt(burnedCoinsAfter || '0') -
              parseInt(burnedCoinsBefore || '0') +
              parseInt(reserveStats.total_processed_burned_coins)
              }`,
          }),
        );
      });

      test('verify treasury', async () => {
        await neutronClient.waitBlocks(1);
        const treasuryBalance = parseInt(
          (await neutronClient.getBalance(treasury, NEUTRON_DENOM)).amount,
          10,
        );
        expect(treasuryBalance - lastTreasuryBalance).toEqual(
          158053 + parseInt(reserveStats.total_reserved),
        );
        lastTreasuryBalance = treasuryBalance;
      });
      test('verify pendings', async () => {
        const pending = await neutronClient.queryContractSmart(dsc, {
          pending: {},
        });
        expect(pending).toEqual([
          [holder1Addr, '14005'],
          [holder2Addr, '28009'],
        ]);
      });
      test('claim pending', async () => {
        const balanceBefore = await neutronClient.getBalance(
          holder1Addr,
          NEUTRON_DENOM,
        );
        const res = await neutronClient2.execute(
          dsc,
          {
            claim: {},
          },
          [],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );
        expect(res.code).toEqual(0);
        const events = res.events;
        const attrs = events.filter((e) => e.type === 'transfer');
        expect(attrs[1].attributes).toEqual([
          {
            key: 'recipient',
            value: holder1Addr,
          },
          { key: 'sender', value: dsc },
          { key: 'amount', value: `14005${NEUTRON_DENOM}` },
          { key: 'msg_index', value: '0' },
        ]);

        const balanceAfter = await neutronClient.getBalance(
          holder1Addr,
          NEUTRON_DENOM,
        );
        expect(+balanceAfter.amount - +balanceBefore.amount).toEqual(4005);
      });
    });

    describe('update treasury config', () => {
      beforeEach(async () => {
        reserve = await setupReserve(neutronClient, {
          mainDaoAddress: mainDaoAddr,
          securityDaoAddress: securityDaoAddr,
          distributionRate: '0.23',
          minPeriod: 1000,
          distributionContract: dsc,
          treasuryContract: treasury,
          vestingDenominator: '100000000000',
        });
      });
      test('update reserve config by unauthorized', async () => {
        await expect(
          neutronClient2.execute(
            reserve,
            {
              update_config: {
                distributionRate: '0.11',
              },
            },
            [],
            {
              gas: '4000000',
              amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
            },
          ),
        ).rejects.toThrow(/Unauthorized/);
      });
      test('update reserve config by owner', async () => {
        const res = await neutronClient.execute(
          reserve,
          {
            update_config: {
              distribution_rate: '0.11',
              min_period: 500,
              dao: mainDaoAddr,
              distribution_contract: dsc,
            },
          },
          [],
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );
        expect(res.code).toEqual(0);
        const config = await neutronClient.queryContractSmart(reserve, {
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
      dsc = await setupDSC(neutronClient, mainDaoAddr, securityDaoAddr);
      treasury = await getNeutronDAOCore(neutronClient, neutronRpcClient);
      reserve = await setupReserve(neutronClient, {
        mainDaoAddress: mainDaoAddr,
        securityDaoAddress: securityDaoAddr,
        distributionRate: '0.21',
        minPeriod: 1000,
        distributionContract: dsc,
        treasuryContract: treasury,
        vestingDenominator: '100000000000',
      });
    });

    test('distribution', async () => {
      await testExecControl(
        neutronClient,
        dsc,
        async () => {
          const res = await neutronClient.execute(
            dsc,
            {
              set_shares: {
                shares: [
                  [holder1Addr, '1'],
                  [holder2Addr, '2'],
                ],
              },
            },
            [],
            {
              gas: '4000000',
              amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
            },
          );
          return res.code;
        },
        async () => {
          const shares = await neutronClient.queryContractSmart(dsc, {
            shares: {},
          });
          expect(shares).toEqual([
            [holder1Addr, '1'],
            [holder2Addr, '2'],
          ]);
        },
      );
    });

    test('reserve', async () => {
      await neutronClient.sendTokens(
        reserve,
        [{ denom: NEUTRON_DENOM, amount: '10000000' }],
        {
          gas: '300000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1500' }],
        },
      );
      await testExecControl(
        neutronClient,
        reserve,
        async () => {
          const res = await neutronClient.execute(
            reserve,
            {
              distribute: {},
            },
            [],
            {
              gas: '4000000',
              amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
            },
          );
          return res.code;
        },
        async () => {
          const stats = await neutronClient.queryContractSmart(reserve, {
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
  client: NeutronTestClient,
  mainDaoAddress: string,
  securityDaoAddress: string,
) => {
  const codeId = await client.upload(CONTRACTS.DISTRIBUTION);
  return await client.instantiate(
    codeId,
    {
      main_dao_address: mainDaoAddress,
      security_dao_address: securityDaoAddress,
      denom: NEUTRON_DENOM,
    },
    'dsc',
  );
};

interface ReserveStats {
  readonly total_distributed: string;
  readonly total_reserved: string;
  readonly total_processed_burned_coins: string;
}

/**
 * normalizeReserveBurnedCoins simulates fee burning via send tx. After normalization amount of burned coins equals to 7500.
 */
const normalizeReserveBurnedCoins = async (
  client: NeutronTestClient,
  reserveAddress: string,
  feeburnerQuerier: FeeburnerQueryClient,
): Promise<ReserveStats> => {
  // Normalize state
  let normalize = true;
  let reserveStats: ReserveStats = {
    total_processed_burned_coins: '0',
    total_reserved: '0',
    total_distributed: '0',
  };
  while (normalize) {
    await client.sendTokens(
      reserveAddress,
      [{ denom: NEUTRON_DENOM, amount: '1' }],
      {
        gas: '300000',
        amount: [{ denom: NEUTRON_DENOM, amount: '1500' }],
      },
    );
    await client.execute(
      reserveAddress,
      {
        distribute: {},
      },
      [],
      {
        gas: '4000000',
        amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
      },
    );
    reserveStats = await client.queryContractSmart(reserveAddress, {
      stats: {},
    });

    const burnedCoins = await getBurnedCoinsAmount(feeburnerQuerier);
    expect(burnedCoins).not.toBeNull();
    normalize =
      parseInt(reserveStats.total_processed_burned_coins) + 7500 !==
      parseInt(burnedCoins || '0');
  }

  return reserveStats;
};

const getBurnedCoinsAmount = async (
  client: FeeburnerQueryClient,
): Promise<string | undefined | null> => {
  const res = await client.totalBurnedNeutronsAmount();
  return res.totalBurnedNeutronsAmount.coin.amount;
};

const setupReserve = async (
  client: NeutronTestClient,
  opts: {
    mainDaoAddress: string;
    distributionRate: string;
    minPeriod: number;
    distributionContract: string;
    treasuryContract: string;
    securityDaoAddress: string;
    vestingDenominator: string;
  },
) =>
  await client.create(CONTRACTS.RESERVE, {
    main_dao_address: opts.mainDaoAddress,
    denom: NEUTRON_DENOM,
    distribution_rate: opts.distributionRate,
    min_period: opts.minPeriod,
    distribution_contract: opts.distributionContract,
    treasury_contract: opts.treasuryContract,
    security_dao_address: opts.securityDaoAddress,
    vesting_denominator: opts.vestingDenominator,
  });

/**
 * Tests a pausable contract execution control.
 * @param client from
 * @param testingContract is the contract the method tests;
 * @param execAction is an executable action to be called during a pause and after unpausing
 * as the main part of the test. Should return the execution response code;
 * @param actionCheck is called after unpausing to make sure the executable action worked.
 */
async function testExecControl(
  client: NeutronTestClient,
  testingContract: string,
  execAction: () => Promise<number | undefined>,
  actionCheck: () => Promise<void>,
) {
  // check contract's pause info before pausing
  let pauseInfo = await client.queryContractSmart(testingContract, {
    pause_info: {},
  });
  expect(pauseInfo).toEqual({ unpaused: {} });
  expect(pauseInfo.paused).toEqual(undefined);

  // pause contract
  let res = await client.execute(testingContract, {
    pause: {
      duration: 50,
    },
  });
  expect(res.code).toEqual(0);

  // check contract's pause info after pausing
  pauseInfo = await client.queryContractSmart(testingContract, {
    pause_info: {},
  });
  expect(pauseInfo.unpaused).toEqual(undefined);
  expect(pauseInfo.paused.until_height).toBeGreaterThan(0);

  // execute msgs on paused contract
  await expect(execAction()).rejects.toThrow(/Contract execution is paused/);

  // unpause contract
  res = await client.execute(testingContract, {
    unpause: {},
  });
  expect(res.code).toEqual(0);

  // check contract's pause info after unpausing
  pauseInfo = await client.queryContractSmart(testingContract, {
    pause_info: {},
  });
  expect(pauseInfo).toEqual({ unpaused: {} });
  expect(pauseInfo.paused).toEqual(undefined);

  // execute msgs on unpaused contract
  const code = await execAction();
  expect(code).toEqual(0);
  await actionCheck();

  // pause contract again for a short period
  const shortPauseDuration = 5;
  res = await client.execute(testingContract, {
    pause: {
      duration: shortPauseDuration,
    },
  });
  expect(res.code).toEqual(0);

  // check contract's pause info after pausing
  pauseInfo = await client.queryContractSmart(testingContract, {
    pause_info: {},
  });
  expect(pauseInfo.unpaused).toEqual(undefined);
  expect(pauseInfo.paused.until_height).toBeGreaterThan(0);

  // wait and check contract's pause info after unpausing
  await client.waitBlocks(shortPauseDuration);
  pauseInfo = await client.queryContractSmart(testingContract, {
    pause_info: {},
  });
  expect(pauseInfo).toEqual({ unpaused: {} });
  expect(pauseInfo.paused).toEqual(undefined);
}
