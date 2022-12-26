import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { InlineResponse20071TxResponseEvents } from '@cosmos-client/ibc/cjs/openapi/api';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  NeutronContract,
} from '../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { Wallet } from '../types';

describe('Neutron / Treasury', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
  let cm3: CosmosWrapper;
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
    cm3 = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.icq,
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
      test('no money', async () => {
        treasury = await setupTreasury(cm, {
          mainDaoAddress: main_dao_addr.toString(),
          securityDaoAddress: security_dao_addr.toString(),
          distributionRate: '0.23',
          minPeriod: 1000,
          distributionContract: dsc,
          reserveContract: reserve,
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
        });
        await cm.msgSend(treasury, '100000');
        const res = await cm.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );
        expect(res.code).toEqual(0);
        const stats = await cm.queryContract(treasury, { stats: {} });
        expect(stats).toEqual({
          total_received: '100000',
          total_distributed: '0',
          total_reserved: '100000',
        });
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
        treasury = await setupTreasury(cm, {
          mainDaoAddress: main_dao_addr.toString(),
          securityDaoAddress: security_dao_addr.toString(),
          distributionRate: '0.23',
          minPeriod: 1000,
          distributionContract: dsc,
          reserveContract: reserve,
        });
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
    });

    describe('happy path', () => {
      let lastReserveBalance: number;
      beforeAll(async () => {
        lastReserveBalance = await cm.queryDenomBalance(reserve, NEUTRON_DENOM);
      });
      test('set shares', async () => {
        treasury = await setupTreasury(cm, {
          mainDaoAddress: main_dao_addr.toString(),
          securityDaoAddress: security_dao_addr.toString(),
          distributionRate: '0.21',
          minPeriod: 1000,
          distributionContract: dsc,
          reserveContract: reserve,
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
        await cm.msgSend(treasury, '10000000');
        const res = await cm.executeContract(
          treasury,
          JSON.stringify({
            distribute: {},
          }),
        );
        expect(res.code).toEqual(0);
        const stats = await cm.queryContract(treasury, { stats: {} });
        expect(stats).toEqual({
          total_received: '10000000',
          total_distributed: '2100000',
          total_reserved: '7900000',
        });
      });
      test('verify reserve', async () => {
        const reserveBalance = await cm.queryDenomBalance(
          reserve,
          NEUTRON_DENOM,
        );
        expect(reserveBalance - lastReserveBalance).toEqual(7900000);
        lastReserveBalance = reserveBalance;
      });
      test('verify pendings', async () => {
        const pending = await cm.queryContract(dsc, { pending: {} });
        expect(pending).toEqual([
          [holder_1_addr.toString(), '700000'],
          [holder_2_addr.toString(), '1400000'],
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
          { key: 'amount', value: `700000${NEUTRON_DENOM}` },
        ]);

        const balanceAfter = await cm.queryDenomBalance(
          holder_1_addr,
          NEUTRON_DENOM,
        );
        expect(balanceAfter - balanceBefore).toEqual(690000);
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
              amount: '1400000',
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
          { key: 'amount', value: `1400000${NEUTRON_DENOM}` },
        ]);

        const balanceAfter = await cm.queryDenomBalance(
          holder_2_addr,
          NEUTRON_DENOM,
        );
        expect(balanceAfter - balanceBefore).toEqual(1400000);
        const reserveBalance = await cm.queryDenomBalance(
          reserve,
          NEUTRON_DENOM,
        );
        expect(lastReserveBalance - reserveBalance).toEqual(1400000);
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
        distributionRate: '0.23',
        minPeriod: 1000,
        distributionContract: dsc,
        reserveContract: reserve,
      });
    });

    test('treasury', async () => {
      await cm.testExecControl(
        treasury,
        async () => {
          let res = await cm.executeContract(
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
          return res.code;
        },
        async () => {
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
        },
      );
    });

    test('distribution', async () => {
      await cm.testExecControl(
        dsc,
        async () => {
          let res = await cm.executeContract(
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

    test('reserve', async () => {
      await cm.testExecControl(
        reserve,
        async () => {
          let res = await cm.executeContract(
            reserve,
            JSON.stringify({
              transfer_ownership: security_dao_addr.toString(),
            }),
          );
          return res.code;
        },
        async () => {
          const config = await cm.queryContract<{
            denom: string;
            main_dao_address: string;
            security_dao_address: string;
          }>(reserve, {
            config: {},
          });
          expect(config.main_dao_address).toEqual(security_dao_addr.toString());
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
  return cm.instantiate(
    codeId,
    JSON.stringify({
      main_dao_address: mainDaoAddress,
      security_dao_address: securityDaoAddress,
      denom: NEUTRON_DENOM,
    }),
    'dsc',
  );
};

const setupReserve = async (
  cm: CosmosWrapper,
  mainDaoAddress: string,
  securityDaoAddress: string,
) => {
  const codeId = await cm.storeWasm(NeutronContract.RESERVE);
  return cm.instantiate(
    codeId,
    JSON.stringify({
      main_dao_address: mainDaoAddress,
      security_dao_address: securityDaoAddress,
      denom: NEUTRON_DENOM,
    }),
    'reserve',
  );
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
  },
) => {
  const codeId = await cm.storeWasm(NeutronContract.TREASURY);
  return cm.instantiate(
    codeId,
    JSON.stringify({
      main_dao_address: opts.mainDaoAddress,
      denom: NEUTRON_DENOM,
      distribution_rate: opts.distributionRate,
      min_period: opts.minPeriod,
      distribution_contract: opts.distributionContract,
      reserve_contract: opts.reserveContract,
      security_dao_address: opts.securityDaoAddress,
    }),
    'treausry',
  );
};
