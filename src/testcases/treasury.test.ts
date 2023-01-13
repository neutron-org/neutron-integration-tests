/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { InlineResponse20071TxResponseEvents } from '@cosmos-client/ibc/cjs/openapi/api';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  NeutronContract,
} from '../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { Wallet } from '../types';

interface TreasuryStats {
  readonly total_distributed: string;
  readonly total_reserved: string;
  readonly total_processed_burned_coins: string;
}

describe('Neutron / Treasury', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
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
    cm = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    cm2 = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.demo2,
      NEUTRON_DENOM,
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
        cm,
        main_dao_addr.toString(),
        security_dao_addr.toString(),
      );
      reserve = await setupReserve(
        cm,
        main_dao_addr.toString(),
        security_dao_addr.toString(),
      );
    });

    describe('some corner cases', () => {
      let treasuryStats: TreasuryStats;
      beforeEach(async () => {
        treasury = await setupTreasury(cm, {
          mainDaoAddress: main_dao_addr.toString(),
          securityDaoAddress: security_dao_addr.toString(),
          distributionRate: '0.0',
          minPeriod: 1000,
          distributionContract: dsc,
          reserveContract: reserve,
          vestingDenominator: '100000000000',
        });
        await expect(
          cm.executeContract(
            treasury,
            JSON.stringify({
              distribute: {},
            }),
          ),
        ).rejects.toThrow(/No funds to distribute/);
      });
      test('zero distribution rate', async () => {
        treasury = await setupTreasury(cm, {
          mainDaoAddress: main_dao_addr.toString(),
          securityDaoAddress: security_dao_addr.toString(),
          distributionRate: '0.0',
          minPeriod: 1000,
          distributionContract: dsc,
          reserveContract: reserve,
          vestingDenominator: '100000000000',
        });
        await cm.msgSend(treasury, '100000');
        const res = await cm.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );

        expect(res.code).toEqual(0);

        const stats = (await cm.queryContract(treasury, { stats: {} })) as any;
        expect(parseInt(stats.total_distributed)).toEqual(0);
        expect(parseInt(stats.total_reserved)).toBeGreaterThan(0);
      });
      test('burned coins increment', async () => {
        await cm.msgSend(treasury, '100000');
        let burnedCoins = await getBurnedCoinsAmount(cm);
        await cm.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );

        let stats = (await cm.queryContract(treasury, { stats: {} })) as any;
        expect(stats.total_processed_burned_coins).toEqual(burnedCoins);

        burnedCoins = await getBurnedCoinsAmount(cm);
        await cm.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );
        stats = await cm.queryContract(treasury, { stats: {} });
        expect(stats.total_processed_burned_coins).toEqual(burnedCoins);
      });
      test('drain treasury', async () => {
        await cm.simulateFeeBurning(1750);

        await cm.msgSend(treasury, '2');

        // First distribution
        await cm.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );

        let treasuryBalance = await cm.queryDenomBalance(treasury, cm.denom);
        expect(treasuryBalance).toEqual(1);

        // Second distribution
        await cm.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );
        treasuryBalance = await cm.queryDenomBalance(treasury, cm.denom);
        expect(treasuryBalance).toEqual(0);

        // Third distribution
        await expect(
          cm.executeContract(
            treasury,
            JSON.stringify({
              distribute: {},
            }),
          ),
        ).rejects.toThrow(/No funds to distribute/);
      });
      test('set shares by unauthorized', async () => {
        await expect(
          cm2.executeContract(
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
          cm2.executeContract(
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
        await cm.msgSend(treasury, '100000');
        // u32::MAX
        await cm.simulateFeeBurning(4_294_967_295);

        await cm.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );
        const afterStats = (await cm.queryContract(treasury, {
          stats: {},
        })) as any;

        expect(
          parseInt(afterStats.total_processed_burned_coins) -
            parseInt(treasuryStats.total_processed_burned_coins),
        ).toEqual(4_294_967_295);

        const burnedCoins = await getBurnedCoinsAmount(cm);

        await cm.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );

        const stats = (await cm.queryContract(treasury, { stats: {} })) as any;
        expect(stats.total_processed_burned_coins).toEqual(`${burnedCoins}`);
      });
    });

    describe('happy path', () => {
      let lastReserveBalance: number;
      let treasuryStats: TreasuryStats;
      beforeAll(async () => {
        lastReserveBalance = await cm.queryDenomBalance(reserve, NEUTRON_DENOM);
      });
      test('set shares', async () => {
        treasury = await setupTreasury(cm, {
          mainDaoAddress: main_dao_addr.toString(),
          securityDaoAddress: security_dao_addr.toString(),
          distributionRate: '0.21',
          minPeriod: 1,
          distributionContract: dsc,
          reserveContract: reserve,
          vestingDenominator: '100000000000',
        });
        await cm.executeContract(
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
        treasuryStats = await normalizeTreasuryBurnedCoins(cm, treasury);
        const burnedCoinsBefore = await getBurnedCoinsAmount(cm);
        await cm.simulateFeeBurning(20_000_000);
        await cm.msgSend(treasury, '1000000000');

        const res = await cm.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );
        expect(res.code).toEqual(0);

        const burnedCoinsAfter = await getBurnedCoinsAmount(cm);

        const stats = await cm.queryContract(treasury, { stats: {} });
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
        const reserveBalance = await cm.queryDenomBalance(
          reserve,
          NEUTRON_DENOM,
        );
        expect(reserveBalance - lastReserveBalance).toEqual(
          158050 + parseInt(treasuryStats.total_reserved),
        );
        lastReserveBalance = reserveBalance;
      });
      test('verify pendings', async () => {
        const pending = await cm.queryContract(dsc, { pending: {} });
        expect(pending).toEqual([
          [holder_1_addr.toString(), '14005'],
          [holder_2_addr.toString(), '28008'],
        ]);
      });
      test('claim pending', async () => {
        const balanceBefore = await cm.queryDenomBalance(
          holder_1_addr,
          NEUTRON_DENOM,
        );
        const res = await cm2.executeContract(
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

        const balanceAfter = await cm.queryDenomBalance(
          holder_1_addr,
          NEUTRON_DENOM,
        );
        expect(balanceAfter - balanceBefore).toEqual(4005);
      });
      test('payout', async () => {
        const balanceBefore = await cm.queryDenomBalance(
          holder_2_addr,
          NEUTRON_DENOM,
        );

        const res = await cm.executeContract(
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

        const balanceAfter = await cm.queryDenomBalance(
          holder_2_addr,
          NEUTRON_DENOM,
        );
        expect(balanceAfter - balanceBefore).toEqual(158051);
        const reserveBalance = await cm.queryDenomBalance(
          reserve,
          NEUTRON_DENOM,
        );
        expect(lastReserveBalance - reserveBalance).toEqual(158051);
      });
    });

    describe('update treasury config', () => {
      beforeEach(async () => {
        treasury = await setupTreasury(cm, {
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
          cm2.executeContract(
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
        const res = await cm.executeContract(
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
        const config = await cm.queryContract<{
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
        cm,
        main_dao_addr.toString(),
        security_dao_addr.toString(),
      );
      reserve = await setupReserve(
        cm,
        main_dao_addr.toString(),
        security_dao_addr.toString(),
      );
      treasury = await setupTreasury(cm, {
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
      await cm.testExecControl(
        dsc,
        async () => {
          const res = await cm.executeContract(
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
          const shares = await cm.queryContract<[][]>(dsc, {
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
      await cm.msgSend(treasury, '10000000');
      await cm.testExecControl(
        treasury,
        async () => {
          const res = await cm.executeContract(
            treasury,
            JSON.stringify({
              distribute: {},
            }),
          );
          return res.code;
        },
        async () => {
          const stats = await cm.queryContract(treasury, { stats: {} });
          expect(stats).toEqual({
            total_received: '10000000',
            total_distributed: '2100000',
            total_reserved: '7900000',
          });
        },
      );
    });

    test('reserve', async () => {
      const balanceBefore = await cm.queryDenomBalance(
        holder_2_addr,
        NEUTRON_DENOM,
      );
      await cm.testExecControl(
        reserve,
        async () => {
          const res = await cm.executeContract(
            reserve,
            JSON.stringify({
              payout: {
                recipient: holder_2_addr.toString(),
                amount: '1400000',
              },
            }),
          );
          return res.code;
        },
        async () => {
          const balanceAfter = await cm.queryDenomBalance(
            holder_2_addr,
            NEUTRON_DENOM,
          );
          expect(balanceAfter - balanceBefore).toEqual(1400000);
        },
      );
    });
  });
});

const setupDSC = async (
  cm: CosmosWrapper,
  mainDaoAddress: string,
  securityDaoAddress: string,
) => {
  const codeId = await cm.storeWasm(NeutronContract.DISTRIBUTION);
  return (
    await cm.instantiate(
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
  cm: CosmosWrapper,
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
    treasuryStats = await cm.queryContract<TreasuryStats>(treasuryAddress, {
      stats: {},
    });

    const burnedCoins = await getBurnedCoinsAmount(cm);
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
  cm: CosmosWrapper,
  mainDaoAddress: string,
  securityDaoAddress: string,
) => {
  const codeId = await cm.storeWasm(NeutronContract.RESERVE);
  return (
    await cm.instantiate(
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
  cm: CosmosWrapper,
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
    await cm.instantiate(
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
