import { InlineResponse20071TxResponseEvents } from '@cosmos-client/ibc/cjs/openapi/api';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  NeutronContract,
} from '../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';

describe('Neutron / Simple', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
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
  });

  describe('Treasury', () => {
    let dsc: string;
    let treausry: string;
    beforeAll(async () => {
      dsc = await setupDSC(
        cm,
        testState.wallets.neutron.demo1.address.toString(),
        testState.wallets.neutron.demo2.address.toString(),
      );
    });
    describe('some corner cases', () => {
      test('no money', async () => {
        treausry = await setupTreasury(cm, {
          owner: testState.wallets.neutron.demo1.address.toString(),
          dao: testState.wallets.neutron.demo2.address.toString(),
          distributionRate: 23,
          minPeriod: 1000,
          distributionContract: dsc,
        });
        await expect(
          cm.executeContract(
            treausry,
            JSON.stringify({
              distribute: {},
            }),
          ),
        ).rejects.toThrow(/no new funds to grab/);
      });

      test('zero distribution rate', async () => {
        treausry = await setupTreasury(cm, {
          owner: testState.wallets.neutron.demo1.address.toString(),
          dao: testState.wallets.neutron.demo2.address.toString(),
          distributionRate: 0,
          minPeriod: 1000,
          distributionContract: dsc,
        });
        await cm.msgSend(treausry, '100000');
        const res = await cm.executeContract(
          treausry,
          JSON.stringify({
            distribute: {},
          }),
        );
        expect(res.code).toEqual(0);
        const stats = await cm.queryContract(treausry, { stats: {} });
        expect(stats).toEqual({
          total_received: '100000',
          total_bank_spent: '0',
          total_distributed: '0',
          bank_balance: '100000',
          last_balance: '100000',
        });
      });

      test('zero distribution rate', async () => {
        treausry = await setupTreasury(cm, {
          owner: testState.wallets.neutron.demo1.address.toString(),
          dao: testState.wallets.neutron.demo2.address.toString(),
          distributionRate: 0,
          minPeriod: 1000,
          distributionContract: dsc,
        });
        await cm.msgSend(treausry, '100000');
        const res = await cm.executeContract(
          treausry,
          JSON.stringify({
            distribute: {},
          }),
        );
        expect(res.code).toEqual(0);
        const stats = await cm.queryContract(treausry, { stats: {} });
        expect(stats).toEqual({
          total_received: '100000',
          total_bank_spent: '0',
          total_distributed: '0',
          bank_balance: '100000',
          last_balance: '100000',
        });
      });

      describe('happy path', () => {
        test('set shares', async () => {
          treausry = await setupTreasury(cm, {
            owner: testState.wallets.neutron.demo1.address.toString(),
            dao: testState.wallets.neutron.demo2.address.toString(),
            distributionRate: 21,
            minPeriod: 1000,
            distributionContract: dsc,
          });
          await cm2.executeContract(
            dsc,
            JSON.stringify({
              set_shares: {
                shares: [
                  [testState.wallets.neutron.demo2.address.toString(), '1'],
                  [testState.wallets.neutron.rly1.address.toString(), '2'],
                ],
              },
            }),
          );
        });
        test('fund', async () => {
          await cm.msgSend(treausry, '10000000');
          const res = await cm.executeContract(
            treausry,
            JSON.stringify({
              distribute: {},
            }),
          );
          expect(res.code).toEqual(0);
          const stats = await cm.queryContract(treausry, { stats: {} });
          expect(stats).toEqual({
            total_received: '10000000',
            total_bank_spent: '0',
            total_distributed: '2100000',
            bank_balance: '7900000',
            last_balance: '7900000',
          });
        });
        test('verify pendings', async () => {
          const pending = await cm.queryContract(dsc, { pending: {} });
          expect(pending).toEqual([
            [testState.wallets.neutron.demo2.address.toString(), '700000'],
            [testState.wallets.neutron.rly1.address.toString(), '1400000'],
          ]);
        });
        test('claim pending', async () => {
          const balanceBefore = parseInt(
            (
              await cm.queryBalances(
                testState.wallets.neutron.demo2.address.toString(),
              )
            ).balances.find((b) => b.denom === NEUTRON_DENOM)?.amount || '0',
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
              value: testState.wallets.neutron.demo2.address.toString(),
            },
            { key: 'sender', value: dsc },
            { key: 'amount', value: `700000${NEUTRON_DENOM}` },
          ]);

          const balanceAfter = parseInt(
            (
              await cm.queryBalances(
                testState.wallets.neutron.demo2.address.toString(),
              )
            ).balances.find((b) => b.denom === NEUTRON_DENOM)?.amount || '0',
          );
          expect(balanceAfter - balanceBefore).toEqual(690000);
        });
        test('payout', async () => {
          const balanceBefore = parseInt(
            (
              await cm.queryBalances(
                testState.wallets.neutron.rly1.address.toString(),
              )
            ).balances.find((b) => b.denom === NEUTRON_DENOM)?.amount || '0',
          );

          const res = await cm2.executeContract(
            treausry,
            JSON.stringify({
              payout: {
                recipient: testState.wallets.neutron.rly1.address.toString(),
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
              value: testState.wallets.neutron.rly1.address.toString(),
            },
            { key: 'sender', value: treausry },
            { key: 'amount', value: `1400000${NEUTRON_DENOM}` },
          ]);

          const balanceAfter = parseInt(
            (
              await cm.queryBalances(
                testState.wallets.neutron.rly1.address.toString(),
              )
            ).balances.find((b) => b.denom === NEUTRON_DENOM)?.amount || '0',
          );
          expect(balanceAfter - balanceBefore).toEqual(1400000);
        });
      });

      test('set shares by owner', async () => {
        await expect(
          cm.executeContract(
            dsc,
            JSON.stringify({
              set_shares: {
                shares: [
                  [testState.wallets.neutron.demo2.address.toString(), '1'],
                  [testState.wallets.neutron.rly1.address.toString(), '2'],
                ],
              },
            }),
          ),
        ).rejects.toThrow(/only dao can set shares/);
      });

      test('payout by owner', async () => {
        treausry = await setupTreasury(cm, {
          owner: testState.wallets.neutron.demo1.address.toString(),
          dao: testState.wallets.neutron.demo2.address.toString(),
          distributionRate: 23,
          minPeriod: 1000,
          distributionContract: dsc,
        });
        await expect(
          cm.executeContract(
            treausry,
            JSON.stringify({
              payout: {
                recipient: testState.wallets.neutron.rly1.address.toString(),
                amount: '1400000',
              },
            }),
          ),
        ).rejects.toThrow(/only dao can payout/);
      });
    });
    describe('update distribution config', () => {
      test('update distribution config by owner', async () => {
        await expect(
          cm.executeContract(
            dsc,
            JSON.stringify({
              update_config: {
                dao: 'some other address',
              },
            }),
          ),
        ).rejects.toThrow(/only dao can update config/);
      });
      test('update distribution config wrong address', async () => {
        await expect(
          cm2.executeContract(
            dsc,
            JSON.stringify({
              update_config: {
                dao: 'some other address',
              },
            }),
          ),
        ).rejects.toThrow(/addr_validate errored/);
      });
      test('update distribution config by dao', async () => {
        const res = await cm2.executeContract(
          dsc,
          JSON.stringify({
            update_config: {
              dao: testState.wallets.neutron.demo1.address.toString(),
            },
          }),
        );
        expect(res.code).toEqual(0);
        const config = await cm.queryContract<{ dao: string }>(dsc, {
          config: {},
        });
        expect(config.dao).toEqual(
          testState.wallets.neutron.demo1.address.toString(),
        );
        await cm.executeContract(
          dsc,
          JSON.stringify({
            update_config: {
              dao: testState.wallets.neutron.demo2.address.toString(),
            },
          }),
        );
      });
    });

    describe('update treasury config', () => {
      beforeEach(async () => {
        treausry = await setupTreasury(cm, {
          owner: testState.wallets.neutron.demo1.address.toString(),
          dao: testState.wallets.neutron.demo2.address.toString(),
          distributionRate: 23,
          minPeriod: 1000,
          distributionContract: dsc,
        });
      });

      test('update treasury config by owner', async () => {
        await expect(
          cm.executeContract(
            treausry,
            JSON.stringify({
              update_config: {
                owner: 'some other address',
              },
            }),
          ),
        ).rejects.toThrow(/only dao can update config/);
      });

      test('update treasury config by dao', async () => {
        const res = await cm2.executeContract(
          treausry,
          JSON.stringify({
            update_config: {
              distribution_rate: 11,
              min_period: 500,
              dao: testState.wallets.neutron.demo1.address.toString(),
              distribution_contract: dsc,
            },
          }),
        );
        expect(res.code).toEqual(0);
        const config = await cm.queryContract<{
          distribution_rate: number;
          min_period: number;
          dao: string;
          distribution_contract: string;
        }>(treausry, {
          config: {},
        });
        expect(config.dao).toEqual(
          testState.wallets.neutron.demo1.address.toString(),
        );
        expect(config.distribution_rate).toEqual(11);
        expect(config.min_period).toEqual(500);
        expect(config.distribution_contract).toEqual(dsc);
      });
    });
  });
});
const setupDSC = async (cm: CosmosWrapper, owner: string, dao: string) => {
  const codeId = await cm.storeWasm(NeutronContract.DISTRIBUTION);
  return cm.instantiate(
    codeId,
    JSON.stringify({
      owner,
      dao,
      denom: NEUTRON_DENOM,
    }),
    'dsc',
  );
};

const setupTreasury = async (
  cm: CosmosWrapper,
  opts: {
    owner: string;
    dao: string;
    distributionRate: number;
    minPeriod: number;
    distributionContract: string;
  },
) => {
  const codeId = await cm.storeWasm(NeutronContract.TREASURY);
  return cm.instantiate(
    codeId,
    JSON.stringify({
      owner: opts.owner,
      dao: opts.dao,
      denom: NEUTRON_DENOM,
      distribution_rate: opts.distributionRate,
      min_period: opts.minPeriod,
      distribution_contract: opts.distributionContract,
    }),
    'treausry',
  );
};
