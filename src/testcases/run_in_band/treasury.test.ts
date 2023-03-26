/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { InlineResponse20071TxResponseEvents } from '@cosmos-client/ibc/cjs/openapi/api';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { Wallet } from '../../types';
import { NeutronContract } from '../../helpers/types';

interface TreasuryStats {
  readonly total_distributed: string;
  readonly total_reserved: string;
  readonly total_processed_burned_coins: string;
}

describe('Neutron / Treasury', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount1: WalletWrapper;
  let neutronAccount2: WalletWrapper;
  let main_dao_wallet: Wallet;
  let security_dao_wallet: Wallet;
  let holder_1_wallet: Wallet;
  let holder_2_wallet: Wallet;
  let main_dao_addr: AccAddress | ValAddress;
  let security_dao_addr: AccAddress | ValAddress;
  let holder_1_addr: AccAddress | ValAddress;
  let holder_2_addr: AccAddress | ValAddress;
  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount1 = new WalletWrapper(
      neutronChain,
      testState.wallets.neutron.demo1,
    );
    neutronAccount2 = new WalletWrapper(
      neutronChain,
      testState.wallets.neutron.demo2,
    );
    main_dao_wallet = testState.wallets.neutron.demo1;
    security_dao_wallet = testState.wallets.neutron.icq;
    holder_1_wallet = testState.wallets.neutron.demo2;
    holder_2_wallet = testState.wallets.neutron.rly1;
    main_dao_addr = main_dao_wallet.address;
    security_dao_addr = security_dao_wallet.address;
    holder_1_addr = holder_1_wallet.address;
    holder_2_addr = holder_2_wallet.address;
  });

  describe('Treasury', () => {
    let dsc: string;
    let treasury: string;
    let reserve: string;
    beforeAll(async () => {
      dsc = await setupDSC(
        neutronAccount1,
        main_dao_addr.toString(),
        security_dao_addr.toString(),
      );
      reserve = await setupReserve(
        neutronAccount1,
        main_dao_addr.toString(),
        security_dao_addr.toString(),
      );
    });

    describe('some corner cases', () => {
      let treasuryStats: TreasuryStats;
      beforeEach(async () => {
        treasury = await setupTreasury(neutronAccount1, {
          mainDaoAddress: main_dao_addr.toString(),
          securityDaoAddress: security_dao_addr.toString(),
          distributionRate: '0.0',
          minPeriod: 1,
          distributionContract: dsc,
          reserveContract: reserve,
          vestingDenominator: '100000000000',
        });

        treasuryStats = await normalizeTreasuryBurnedCoins(
          neutronAccount1,
          treasury,
        );
      });
      test('zero distribution rate', async () => {
        await neutronAccount1.msgSend(treasury, '100000');
        const res = await neutronAccount1.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );

        expect(res.code).toEqual(0);

        const stats = (await neutronChain.queryContract(treasury, {
          stats: {},
        })) as any;
        expect(parseInt(stats.total_distributed)).toEqual(0);
        expect(parseInt(stats.total_reserved)).toBeGreaterThan(0);
      });
      test('burned coins increment', async () => {
        await neutronAccount1.msgSend(treasury, '100000');
        let burnedCoins = await getBurnedCoinsAmount(neutronChain);
        await neutronAccount1.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );

        let stats = (await neutronChain.queryContract(treasury, {
          stats: {},
        })) as any;
        expect(stats.total_processed_burned_coins).toEqual(burnedCoins);

        burnedCoins = await getBurnedCoinsAmount(neutronChain);
        await neutronAccount1.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );
        stats = await neutronChain.queryContract(treasury, { stats: {} });
        expect(stats.total_processed_burned_coins).toEqual(burnedCoins);
      });
      test('drain treasury', async () => {
        await neutronAccount1.simulateFeeBurning(1750);

        await neutronAccount1.msgSend(treasury, '2');

        // First distribution
        await neutronAccount1.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );

        let treasuryBalance = await neutronChain.queryDenomBalance(
          treasury,
          neutronChain.denom,
        );
        expect(treasuryBalance).toEqual(1);

        // Second distribution
        await neutronAccount1.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );
        treasuryBalance = await neutronChain.queryDenomBalance(
          treasury,
          neutronChain.denom,
        );
        expect(treasuryBalance).toEqual(0);

        // Third distribution
        await expect(
          neutronAccount1.executeContract(
            treasury,
            JSON.stringify({
              distribute: {},
            }),
          ),
        ).rejects.toThrow(/No funds to distribute/);
      });
      test('set shares by unauthorized', async () => {
        await expect(
          neutronAccount2.executeContract(
            dsc,
            JSON.stringify({
              set_shares: {
                shares: [
                  [holder_1_addr.toString(), '1'],
                  [holder_2_addr.toString(), '2'],
                ],
              },
            }),
          ),
        ).rejects.toThrow(/Unauthorized/);
      });
      test('payout by unauthorized', async () => {
        await expect(
          neutronAccount2.executeContract(
            reserve,
            JSON.stringify({
              payout: {
                recipient: holder_2_addr.toString(),
                amount: '1400000',
              },
            }),
          ),
        ).rejects.toThrow(/Unauthorized/);
      });

      test('burned coins amount u32 safe calculation', async () => {
        await neutronAccount1.msgSend(treasury, '100000');
        // u32::MAX
        await neutronAccount1.simulateFeeBurning(4_294_967_295);

        await neutronAccount1.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );
        const afterStats = (await neutronChain.queryContract(treasury, {
          stats: {},
        })) as any;

        expect(
          parseInt(afterStats.total_processed_burned_coins) -
            parseInt(treasuryStats.total_processed_burned_coins),
        ).toEqual(4_294_967_295);

        const burnedCoins = await getBurnedCoinsAmount(neutronChain);

        await neutronAccount1.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );

        const stats = (await neutronChain.queryContract(treasury, {
          stats: {},
        })) as any;
        expect(stats.total_processed_burned_coins).toEqual(`${burnedCoins}`);
      });
    });

    describe('happy path', () => {
      let lastReserveBalance: number;
      let treasuryStats: TreasuryStats;
      beforeAll(async () => {
        lastReserveBalance = await neutronChain.queryDenomBalance(
          reserve,
          NEUTRON_DENOM,
        );
      });
      test('set shares', async () => {
        treasury = await setupTreasury(neutronAccount1, {
          mainDaoAddress: main_dao_addr.toString(),
          securityDaoAddress: security_dao_addr.toString(),
          distributionRate: '0.21',
          minPeriod: 1,
          distributionContract: dsc,
          reserveContract: reserve,
          vestingDenominator: '100000000000',
        });
        await neutronAccount1.executeContract(
          dsc,
          JSON.stringify({
            set_shares: {
              shares: [
                [holder_1_addr.toString(), '1'],
                [holder_2_addr.toString(), '2'],
              ],
            },
          }),
        );
      });

      test('fund', async () => {
        await neutronChain.blockWaiter.waitBlocks(1);
        treasuryStats = await normalizeTreasuryBurnedCoins(
          neutronAccount1,
          treasury,
        );
        const burnedCoinsBefore = await getBurnedCoinsAmount(neutronChain);
        await neutronAccount1.simulateFeeBurning(20_000_000);
        await neutronAccount1.msgSend(treasury, '1000000000');

        const res = await neutronAccount1.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );
        expect(res.code).toEqual(0);
        await neutronChain.blockWaiter.waitBlocks(1);

        const burnedCoinsAfter = await getBurnedCoinsAmount(neutronChain);

        const stats = await neutronChain.queryContract(treasury, {
          stats: {},
        });
        expect(stats).toEqual(
          expect.objectContaining({
            total_distributed: '42013',
            total_reserved: `${
              158050 + parseInt(treasuryStats.total_reserved)
            }`,
            total_processed_burned_coins: `${
              parseInt(burnedCoinsAfter!) -
              parseInt(burnedCoinsBefore!) +
              parseInt(treasuryStats.total_processed_burned_coins)
            }`,
          }),
        );
      });

      test('verify reserve', async () => {
        await neutronChain.blockWaiter.waitBlocks(1);
        const reserveBalance = await neutronChain.queryDenomBalance(
          reserve,
          NEUTRON_DENOM,
        );
        expect(reserveBalance - lastReserveBalance).toEqual(
          158050 + parseInt(treasuryStats.total_reserved),
        );
        lastReserveBalance = reserveBalance;
      });
      test('verify pendings', async () => {
        const pending = await neutronChain.queryContract(dsc, {
          pending: {},
        });
        expect(pending).toEqual([
          [holder_1_addr.toString(), '14005'],
          [holder_2_addr.toString(), '28008'],
        ]);
      });
      test('claim pending', async () => {
        const balanceBefore = await neutronChain.queryDenomBalance(
          holder_1_addr,
          NEUTRON_DENOM,
        );
        const res = await neutronAccount2.executeContract(
          dsc,
          JSON.stringify({
            claim: {},
          }),
        );
        expect(res.code).toEqual(0);
        const [{ events }] = JSON.parse(res.raw_log || '[]') as {
          events: InlineResponse20071TxResponseEvents[];
        }[];
        const attrs = events.find((e) => e.type === 'transfer')?.attributes;
        expect(attrs).toEqual([
          {
            key: 'recipient',
            value: holder_1_addr.toString(),
          },
          { key: 'sender', value: dsc },
          { key: 'amount', value: `14005${NEUTRON_DENOM}` },
        ]);

        const balanceAfter = await neutronChain.queryDenomBalance(
          holder_1_addr,
          NEUTRON_DENOM,
        );
        expect(balanceAfter - balanceBefore).toEqual(4005);
      });
      test('payout', async () => {
        const balanceBefore = await neutronChain.queryDenomBalance(
          holder_2_addr,
          NEUTRON_DENOM,
        );

        const res = await neutronAccount1.executeContract(
          reserve,
          JSON.stringify({
            payout: {
              recipient: holder_2_addr.toString(),
              amount: '158051',
            },
          }),
        );
        expect(res.code).toEqual(0);
        const [{ events }] = JSON.parse(res.raw_log || '[]') as {
          events: InlineResponse20071TxResponseEvents[];
        }[];
        const attrs = events.find((e) => e.type === 'transfer')?.attributes;
        expect(attrs).toEqual([
          {
            key: 'recipient',
            value: holder_2_addr.toString(),
          },
          { key: 'sender', value: reserve },
          { key: 'amount', value: `158051${NEUTRON_DENOM}` },
        ]);

        const balanceAfter = await neutronChain.queryDenomBalance(
          holder_2_addr,
          NEUTRON_DENOM,
        );
        expect(balanceAfter - balanceBefore).toEqual(158051);
        const reserveBalance = await neutronChain.queryDenomBalance(
          reserve,
          NEUTRON_DENOM,
        );
        expect(lastReserveBalance - reserveBalance).toEqual(158051);
      });
    });

    describe('update treasury config', () => {
      beforeEach(async () => {
        treasury = await setupTreasury(neutronAccount1, {
          mainDaoAddress: main_dao_addr.toString(),
          securityDaoAddress: security_dao_addr.toString(),
          distributionRate: '0.23',
          minPeriod: 1000,
          distributionContract: dsc,
          reserveContract: reserve,
          vestingDenominator: '100000000000',
        });
      });
      test('update treasury config by unauthorized', async () => {
        await expect(
          neutronAccount2.executeContract(
            treasury,
            JSON.stringify({
              update_config: {
                distributionRate: '0.11',
              },
            }),
          ),
        ).rejects.toThrow(/Unauthorized/);
      });
      test('update treasury config by owner', async () => {
        const res = await neutronAccount1.executeContract(
          treasury,
          JSON.stringify({
            update_config: {
              distribution_rate: '0.11',
              min_period: 500,
              dao: main_dao_addr.toString(),
              distribution_contract: dsc,
            },
          }),
        );
        expect(res.code).toEqual(0);
        const config = await neutronChain.queryContract<{
          distribution_rate: string;
          min_period: number;
          distribution_contract: string;
        }>(treasury, {
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
        main_dao_addr.toString(),
        security_dao_addr.toString(),
      );
      reserve = await setupReserve(
        neutronAccount1,
        main_dao_addr.toString(),
        security_dao_addr.toString(),
      );
      treasury = await setupTreasury(neutronAccount1, {
        mainDaoAddress: main_dao_addr.toString(),
        securityDaoAddress: security_dao_addr.toString(),
        distributionRate: '0.21',
        minPeriod: 1000,
        distributionContract: dsc,
        reserveContract: reserve,
        vestingDenominator: '100000000000',
      });
    });

    test('distribution', async () => {
      await neutronAccount1.testExecControl(
        dsc,
        async () => {
          const res = await neutronAccount1.executeContract(
            dsc,
            JSON.stringify({
              set_shares: {
                shares: [
                  [holder_1_addr.toString(), '1'],
                  [holder_2_addr.toString(), '2'],
                ],
              },
            }),
          );
          return res.code;
        },
        async () => {
          const shares = await neutronChain.queryContract<[][]>(dsc, {
            shares: {},
          });
          expect(shares).toEqual([
            [holder_1_addr.toString(), '1'],
            [holder_2_addr.toString(), '2'],
          ]);
        },
      );
    });

    test('treasury', async () => {
      await neutronAccount1.msgSend(treasury, '10000000');
      await neutronAccount1.testExecControl(
        treasury,
        async () => {
          const res = await neutronAccount1.executeContract(
            treasury,
            JSON.stringify({
              distribute: {},
            }),
          );
          return res.code;
        },
        async () => {
          const stats = await neutronChain.queryContract(treasury, {
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

    test('reserve', async () => {
      const balanceBefore = await neutronChain.queryDenomBalance(
        holder_2_addr,
        NEUTRON_DENOM,
      );
      await neutronAccount1.testExecControl(
        reserve,
        async () => {
          const res = await neutronAccount1.executeContract(
            reserve,
            JSON.stringify({
              payout: {
                recipient: holder_2_addr.toString(),
                amount: '332120',
              },
            }),
          );
          return res.code;
        },
        async () => {
          const balanceAfter = await neutronChain.queryDenomBalance(
            holder_2_addr,
            NEUTRON_DENOM,
          );
          expect(balanceAfter - balanceBefore).toEqual(332120);
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
  return (
    await cm.instantiateContract(
      codeId,
      JSON.stringify({
        main_dao_address: mainDaoAddress,
        security_dao_address: securityDaoAddress,
        denom: NEUTRON_DENOM,
      }),
      'dsc',
    )
  )[0]._contract_address;
};

/**
 * normalizeTreasuryBurnedCoins simulates fee burning via send tx. After normalization amount of burned coins equals to 7500.
 */
const normalizeTreasuryBurnedCoins = async (
  cm: WalletWrapper,
  treasuryAddress: string,
): Promise<TreasuryStats> => {
  // Normalize state
  let normalize = true;
  let treasuryStats: TreasuryStats = {
    total_processed_burned_coins: '0',
    total_reserved: '0',
    total_distributed: '0',
  };
  while (normalize) {
    await cm.msgSend(treasuryAddress, '1');
    await cm.executeContract(
      treasuryAddress,
      JSON.stringify({
        distribute: {},
      }),
    );
    treasuryStats = await cm.chain.queryContract<TreasuryStats>(
      treasuryAddress,
      {
        stats: {},
      },
    );

    const burnedCoins = await getBurnedCoinsAmount(cm.chain);
    normalize =
      parseInt(treasuryStats.total_processed_burned_coins) + 7500 !==
      parseInt(burnedCoins!);
  }

  return treasuryStats;
};

const getBurnedCoinsAmount = async (
  cm: CosmosWrapper,
): Promise<string | undefined | null> => {
  const totalBurnedNeutrons = await cm.queryTotalBurnedNeutronsAmount();
  return totalBurnedNeutrons.total_burned_neutrons_amount.coin.amount;
};

const setupReserve = async (
  cm: WalletWrapper,
  mainDaoAddress: string,
  securityDaoAddress: string,
) => {
  const codeId = await cm.storeWasm(NeutronContract.RESERVE);
  return (
    await cm.instantiateContract(
      codeId,
      JSON.stringify({
        main_dao_address: mainDaoAddress,
        security_dao_address: securityDaoAddress,
        denom: NEUTRON_DENOM,
      }),
      'reserve',
    )
  )[0]._contract_address;
};

const setupTreasury = async (
  cm: WalletWrapper,
  opts: {
    mainDaoAddress: string;
    distributionRate: string;
    minPeriod: number;
    distributionContract: string;
    reserveContract: string;
    securityDaoAddress: string;
    vestingDenominator: string;
  },
) => {
  const codeId = await cm.storeWasm(NeutronContract.TREASURY);
  return (
    await cm.instantiateContract(
      codeId,
      JSON.stringify({
        main_dao_address: opts.mainDaoAddress,
        denom: NEUTRON_DENOM,
        distribution_rate: opts.distributionRate,
        min_period: opts.minPeriod,
        distribution_contract: opts.distributionContract,
        reserve_contract: opts.reserveContract,
        security_dao_address: opts.securityDaoAddress,
        vesting_denominator: opts.vestingDenominator,
      }),
      'treausry',
    )
  )[0]._contract_address;
};
