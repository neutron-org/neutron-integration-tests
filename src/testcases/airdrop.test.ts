import {
  CosmosWrapper,
  NEUTRON_DENOM,
  NeutronContract,
} from '../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { getRemoteHeight } from '../helpers/wait';

describe('Neutron / Airdrop', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let creditsAddress: string;
  let airdropAddress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
  });

  describe('Deploy contracts', () => {
    describe('deploy Credits', () => {
      let codeId: string;
      test('store contract', async () => {
        codeId = await cm.storeWasm(NeutronContract.CREDITS);
        expect(parseInt(codeId)).toBeGreaterThan(0);
      });
      test('instantiate', async () => {
        const res = await cm.instantiate(
          codeId,
          JSON.stringify({
            dao_address: testState.wallets.neutron.demo1.address.toString(),
            when_withdrawable: '0',
          }),
          'credits',
        );
        creditsAddress = res[0]._contract_address;
      });
    });

    describe('deploy Airdrop', () => {
      let codeId: string;
      test('store contract', async () => {
        codeId = await cm.storeWasm(NeutronContract.AIRDROP);
        expect(parseInt(codeId)).toBeGreaterThan(0);
      });
      test('instantiate', async () => {
        const res = await cm.instantiate(
          codeId,
          JSON.stringify({
            owner: cm.wallet.address.toString(),
            credits_address: creditsAddress,
            reserve_address: testState.wallets.neutron.demo2.address.toString(),
            neutron_denom: NEUTRON_DENOM,
          }),
          'airdrop',
        );
        airdropAddress = res[0]._contract_address;
      });
    });

    describe('Update configs', () => {
      test('tell Credits about Airdrop', async () => {
        await cm.executeContract(
          creditsAddress,
          JSON.stringify({
            update_config: {
              airdrop_address: airdropAddress,
              lockdrop_address: airdropAddress, // XXX: I didn't deploy lockdrop so I don't really care :^)
            },
          }),
        );
      });
      test('tell Airdrop about Credits', async () => {
        await cm.executeContract(
          airdropAddress,
          JSON.stringify({
            update_config: {
              new_owner: cm.wallet.address.toString(),
              new_credits_address: creditsAddress,
            },
          }),
        );
      });
    });

    describe('Configure airdrop', () => {
      test('mint cNTRN tokens', async () => {
        await cm.executeContract(
          creditsAddress,
          JSON.stringify({
            mint: {},
          }),
          [{ denom: cm.denom, amount: '10000' }],
        );

        const airdropBalance = await cm.queryContract<{ balance: string }>(
          creditsAddress,
          {
            balance: { address: airdropAddress },
          },
        );
        expect(airdropBalance.balance).toEqual('10000');
      });

      test('register merkle root', async () => {
        const currentHeight = await getRemoteHeight(cm.sdk);
        await cm.executeContract(
          airdropAddress,
          JSON.stringify({
            register_merkle_root: {
              merkle_root:
                // TODO: use https://github.com/neutron-org/cw-tokens/blob/feat/NTRN-363-tge-airdrop-contract/contracts/cw20-merkle-airdrop/helpers/README.md
                // to generate proper test vectors and merkel proof for this test
                'b45c1ea28b26adb13e412933c9e055b01fdf7585304b00cd8f1cb220aa6c5e88',
              expiration: {
                at_height: currentHeight + 10,
              },
              total_amount: '10000',
            },
          }),
        );
      });
    });
  });
});
