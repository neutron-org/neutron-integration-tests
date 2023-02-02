import {
  CosmosWrapper,
  NEUTRON_DENOM,
  NeutronContract,
} from '../helpers/cosmos';

import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';

describe('Neutron / Token Generation Event', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cmDemo1: CosmosWrapper;
  let cmDemo2: CosmosWrapper;
  let cw20TokenAddress: string;
  let tokenSaleContractAddress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cmDemo1 = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    cmDemo2 = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.neutron.demo2,
      NEUTRON_DENOM,
    );
  });

  describe('CW20 Token', () => {
    test('deploy CW20 token contract', async () => {
      const codeId = await cmDemo1.storeWasm(NeutronContract.CW20_TOKEN);
      const res = await cmDemo1.instantiate(
        codeId,
        {
          name: 'Shitcoin',
          symbol: 'SHIT',
          decimals: 6,
          initial_balances: [
            {
              address: testState.wallets.neutron.demo1.address.toString(),
              amount: '10000000',
            },
          ],
        },
        'shitcoin',
      );
      cw20TokenAddress = res[0]._contract_address;
    });
    test('query balance', async () => {
      const balance = await cmDemo1.queryContract(cw20TokenAddress, {
        balance: {
          address: testState.wallets.neutron.demo1.address.toString(),
        },
      });
      expect(balance).toMatchObject({
        balance: '10000000',
      });
    });
  });

  describe('Token sale', () => {
    let config: {
      slot_duration: number;
      base_denom: string;
      owner: string;
      reserve: string;
      token: string;
    };
    let eventConfig: {
      amount: string;
      stage1_begin: number;
      stage2_begin: number;
      stage2_end: number;
    };
    beforeAll(async () => {
      config = {
        slot_duration: 10,
        base_denom: NEUTRON_DENOM,
        owner: testState.wallets.neutron.demo1.address.toString(),
        reserve: testState.wallets.neutron.demo2.address.toString(),
        token: cw20TokenAddress,
      };
      const start = Math.round(Date.now() / 1000);
      eventConfig = {
        amount: '1000000',
        stage1_begin: start + 10,
        stage2_begin: start + 20,
        stage2_end: start + 30,
      };
      const codeId = await cmDemo1.storeWasm(NeutronContract.TOKEN_SALE);
      const res = await cmDemo1.instantiate(codeId, config, 'token_sale');
      tokenSaleContractAddress = res[0]._contract_address;
    });
    describe('setup', () => {
      test('transfer cw20 tokens to the contract', async () => {
        await cmDemo1.executeContract(
          cw20TokenAddress,
          JSON.stringify({
            increase_allowance: {
              spender: tokenSaleContractAddress,
              amount: '1000000',
            },
          }),
        );
      });
      test('query config', async () => {
        const contractConfig = await cmDemo1.queryContract(
          tokenSaleContractAddress,
          {
            config: {},
          },
        );
        expect(contractConfig).toEqual({
          ...config,
          event_config: null,
          tokens_released: false,
        });
      });
      test('setup config', async () => {
        const res = await cmDemo1.executeContract(
          tokenSaleContractAddress,
          JSON.stringify({
            post_initialize: { config: eventConfig },
          }),
        );
        expect(res.code).toEqual(0);
        const resConfig = await cmDemo1.queryContract(
          tokenSaleContractAddress,
          {
            config: {},
          },
        );
        expect(resConfig).toEqual({
          ...config,
          event_config: eventConfig,
          tokens_released: false,
        });
      });
    });
    describe('Phase1', () => {
      it('should fail when deposit before start', async () => {
        await expect(
          cmDemo2.executeContract(
            tokenSaleContractAddress,
            JSON.stringify({
              deposit: {},
            }),
            [{ denom: NEUTRON_DENOM, amount: '100000' }],
          ),
        ).rejects.toThrow(/deposit period is not start yet/);
      });
      it('should not fail when depositwhen it is right time', async () => {
        const tm = eventConfig.stage1_begin * 1000 - Date.now() + 2000;
        await new Promise((resolve) => setTimeout(() => resolve(true), tm));
        const res = await cmDemo2.executeContract(
          tokenSaleContractAddress,
          JSON.stringify({
            deposit: {},
          }),
          [{ denom: NEUTRON_DENOM, amount: '1000000' }],
        );
        expect(res.code).toEqual(0);
      });
      it('should return withdrawable amount', async () => {
        const res = await cmDemo2.queryContract(tokenSaleContractAddress, {
          info: { address: testState.wallets.neutron.demo2.address.toString() },
        });
        expect(res).toEqual({
          clamable: false,
          deposit: '1000000',
          tokens_to_claim: '1000000',
          total_deposit: '1000000',
          withdrawable_amount: '1000000',
        });
      });

      it('should not allow withdraw more than withdrawable amount', async () => {
        await expect(
          cmDemo2.executeContract(
            tokenSaleContractAddress,
            JSON.stringify({
              withdraw: {
                amount: '10000000',
              },
            }),
          ),
        ).rejects.toThrow(
          /can not withdraw more than current withdrawable amount/,
        );
      });
      it('should allow withdraw', async () => {
        const currentBalance = await cmDemo2.queryDenomBalance(
          testState.wallets.neutron.demo2.address,
          NEUTRON_DENOM,
        );
        const res = await cmDemo2.executeContract(
          tokenSaleContractAddress,
          JSON.stringify({
            withdraw: {
              amount: '100000',
            },
          }),
        );
        expect(res.code).toEqual(0);
        const newBalance = await cmDemo2.queryDenomBalance(
          testState.wallets.neutron.demo2.address,
          NEUTRON_DENOM,
        );
        expect(newBalance - currentBalance).toEqual(90000); //minus gas fee
      });
      it('should allow withdraw second time', async () => {
        const currentBalance = await cmDemo2.queryDenomBalance(
          testState.wallets.neutron.demo2.address,
          NEUTRON_DENOM,
        );
        const res = await cmDemo2.executeContract(
          tokenSaleContractAddress,
          JSON.stringify({
            withdraw: {
              amount: '100000',
            },
          }),
        );
        expect(res.code).toEqual(0);
        const newBalance = await cmDemo2.queryDenomBalance(
          testState.wallets.neutron.demo2.address,
          NEUTRON_DENOM,
        );
        expect(newBalance - currentBalance).toEqual(90000); //minus gas fee
      });
      it('should fail on withdraw reserve', async () => {
        await expect(
          cmDemo1.executeContract(
            tokenSaleContractAddress,
            JSON.stringify({
              withdraw_reserve: {},
            }),
          ),
        ).rejects.toThrow(/cannot withdraw funds yet/);
      });
    });
    describe('Phase2', () => {
      it('should return correct info', async () => {
        const tm = eventConfig.stage2_begin * 1000 - Date.now() + 3000;
        await new Promise((resolve) => setTimeout(() => resolve(true), tm));
        const res = await cmDemo2.queryContract(tokenSaleContractAddress, {
          info: { address: testState.wallets.neutron.demo2.address.toString() },
        });
        expect(res).toEqual({
          clamable: false,
          deposit: '800000',
          tokens_to_claim: '1000000',
          total_deposit: '800000',
          withdrawable_amount: '800000',
        });
      });
      it('should allow withdraw', async () => {
        const currentBalance = await cmDemo2.queryDenomBalance(
          testState.wallets.neutron.demo2.address,
          NEUTRON_DENOM,
        );
        const res = await cmDemo2.executeContract(
          tokenSaleContractAddress,
          JSON.stringify({
            withdraw: {
              amount: '100000',
            },
          }),
        );
        expect(res.code).toEqual(0);
        const newBalance = await cmDemo2.queryDenomBalance(
          testState.wallets.neutron.demo2.address,
          NEUTRON_DENOM,
        );
        expect(newBalance - currentBalance).toEqual(90000); //minus gas fee
      });
      it('should not allow withdraw second time', async () => {
        await expect(
          cmDemo2.executeContract(
            tokenSaleContractAddress,
            JSON.stringify({
              withdraw: {
                amount: '100000',
              },
            }),
          ),
        ).rejects.toThrow(/a withdraw was already executed on phase 2/);
      });
      it('should fail on withdraw tokens', async () => {
        await expect(
          cmDemo2.executeContract(
            tokenSaleContractAddress,
            JSON.stringify({
              withdraw_tokens: {},
            }),
          ),
        ).rejects.toThrow(/cannot withdraw tokens yet/);
      });
      it('should fail on withdraw reserve', async () => {
        await expect(
          cmDemo1.executeContract(
            tokenSaleContractAddress,
            JSON.stringify({
              withdraw_reserve: {},
            }),
          ),
        ).rejects.toThrow(/cannot withdraw funds yet/);
      });
    });
    describe('Phase 3', () => {
      beforeAll(async () => {
        const tm = eventConfig.stage2_end * 1000 - Date.now() + 2000;
        await new Promise((resolve) => setTimeout(() => resolve(true), tm));
      });
      it('should return correct info (not clamable)', async () => {
        const res = await cmDemo2.queryContract(tokenSaleContractAddress, {
          info: { address: testState.wallets.neutron.demo2.address.toString() },
        });
        expect(res).toEqual({
          clamable: false,
          deposit: '700000',
          tokens_to_claim: '1000000',
          total_deposit: '700000',
          withdrawable_amount: '0',
        });
      });
      it('releases tokens', async () => {
        const res = await cmDemo1.executeContract(
          tokenSaleContractAddress,
          JSON.stringify({
            release_tokens: {},
          }),
        );
        expect(res.code).toEqual(0);
      });
      it('should return correct info (clamable)', async () => {
        const res = await cmDemo2.queryContract(tokenSaleContractAddress, {
          info: { address: testState.wallets.neutron.demo2.address.toString() },
        });
        expect(res).toEqual({
          clamable: true,
          deposit: '700000',
          tokens_to_claim: '1000000',
          total_deposit: '700000',
          withdrawable_amount: '0',
        });
      });
      it('should allow withdraw tokens', async () => {
        const res = await cmDemo2.executeContract(
          tokenSaleContractAddress,
          JSON.stringify({
            withdraw_tokens: {},
          }),
        );
        expect(res.code).toEqual(0);
      });
      it('should increase token balance', async () => {
        const res = await cmDemo2.queryContract(cw20TokenAddress, {
          balance: {
            address: testState.wallets.neutron.demo2.address.toString(),
          },
        });
        expect(res).toEqual({ balance: '1000000' });
      });
      it('should fail withdraw second time', async () => {
        await expect(
          cmDemo2.executeContract(
            tokenSaleContractAddress,
            JSON.stringify({
              withdraw_tokens: {},
            }),
          ),
        ).rejects.toThrow(/tokens were already claimed/);
      });
      it('should transfer balance to reserve', async () => {
        const startReserveBalance = await cmDemo1.queryDenomBalance(
          testState.wallets.neutron.demo2.address,
          NEUTRON_DENOM,
        );
        const res = await cmDemo1.executeContract(
          tokenSaleContractAddress,
          JSON.stringify({
            withdraw_reserve: {},
          }),
        );
        expect(res.code).toEqual(0);
        const endReserveBalance = await cmDemo1.queryDenomBalance(
          testState.wallets.neutron.demo2.address,
          NEUTRON_DENOM,
        );
        expect(endReserveBalance - startReserveBalance).toEqual(700000);
      });
    });
  });
});
