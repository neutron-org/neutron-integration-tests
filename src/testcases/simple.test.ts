import {
  AckFailuresResponse,
  COSMOS_DENOM,
  CosmosWrapper,
  getIBCDenom,
  IBC_RELAYER_NEUTRON_ADDRESS,
  NEUTRON_DENOM,
  NeutronContract,
  PageRequest,
} from '../helpers/cosmos';
import { getRemoteHeight, getWithAttempts, waitBlocks } from '../helpers/wait';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';

describe('Neutron / Simple', () => {
  let testState: TestStateLocalCosmosTestNet;
  let cm: CosmosWrapper;
  let cm2: CosmosWrapper;
  let contractAddress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    cm2 = new CosmosWrapper(
      testState.sdk2,
      testState.wallets.cosmos.demo2,
      COSMOS_DENOM,
    );
  });

  describe('Wallets', () => {
    test('Addresses', () => {
      expect(testState.wallets.neutron.demo1.address.toString()).toEqual(
        'neutron1m9l358xunhhwds0568za49mzhvuxx9ux8xafx2',
      );
      expect(testState.wallets.cosmos.demo2.address.toString()).toEqual(
        'cosmos10h9stc5v6ntgeygf5xf945njqq5h32r53uquvw',
      );
    });
  });

  describe('Contracts', () => {
    let codeId: string;
    test('store contract', async () => {
      codeId = await cm.storeWasm(NeutronContract.IBC_TRANSFER);
      expect(parseInt(codeId)).toBeGreaterThan(0);
    });
    test('instantiate', async () => {
      const res = await cm.instantiate(codeId, '{}', 'ibc_transfer');
      contractAddress = res[0]._contract_address;
    });
  });

  describe('IBC', () => {
    describe('Correct way', () => {
      let relayerBalance = 0;
      beforeAll(async () => {
        await waitBlocks(cm.sdk, 10);
        const balances = await cm.queryBalances(IBC_RELAYER_NEUTRON_ADDRESS);
        relayerBalance = parseInt(
          balances.balances.find((bal) => bal.denom == NEUTRON_DENOM)?.amount ||
            '0',
          10,
        );
      });
      test('transfer to contract', async () => {
        const res = await cm.msgSend(contractAddress.toString(), '50000');
        expect(res.code).toEqual(0);
      });
      test('check balance', async () => {
        const balances = await cm.queryBalances(contractAddress);
        expect(balances.balances).toEqual([
          { amount: '50000', denom: NEUTRON_DENOM },
        ]);
      });
      test('IBC transfer from a usual account', async () => {
        const res = await cm.msgIBCTransfer(
          'transfer',
          'channel-0',
          { denom: NEUTRON_DENOM, amount: '1000' },
          testState.wallets.cosmos.demo2.address.toString(),
          { revision_number: 2, revision_height: 100000000 },
        );
        expect(res.code).toEqual(0);
      });
      test('check IBC token balance', async () => {
        await waitBlocks(cm.sdk, 10);
        const balances = await cm2.queryBalances(
          testState.wallets.cosmos.demo2.address.toString(),
        );
        expect(
          balances.balances.find(
            (bal): boolean =>
              bal.denom ==
              'ibc/C053D637CCA2A2BA030E2C5EE1B28A16F71CCB0E45E8BE52766DC1B241B77878',
          )?.amount,
        ).toEqual('1000');
      });
      test('uatom IBC transfer from a remote chain to Neutron', async () => {
        const res = await cm2.msgIBCTransfer(
          'transfer',
          'channel-0',
          { denom: COSMOS_DENOM, amount: '1000' },
          testState.wallets.neutron.demo1.address.toString(),
          { revision_number: 2, revision_height: 100000000 },
        );
        expect(res.code).toEqual(0);
      });
      test('check uatom token balance transfered  via IBC on Neutron', async () => {
        await waitBlocks(cm.sdk, 10);
        const balances = await cm.queryBalances(
          testState.wallets.neutron.demo1.address.toString(),
        );
        expect(
          balances.balances.find(
            (bal): boolean =>
              bal.denom ==
              'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
          )?.amount,
        ).toEqual('1000');
      });
      test('check that weird IBC denom is uatom indeed', async () => {
        const denomTrace = await cm.queryDenomTrace(
          '27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        );
        expect(denomTrace.base_denom).toEqual(COSMOS_DENOM);
      });
      test('set payer fees', async () => {
        const res = await cm.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: cm.denom,
              ack_fee: '2333',
              recv_fee: '0',
              timeout_fee: '2666',
            },
          }),
        );
        expect(res.code).toEqual(0);
      });

      test('execute contract', async () => {
        const res = await cm.executeContract(
          contractAddress,
          JSON.stringify({
            send: {
              channel: 'channel-0',
              to: testState.wallets.cosmos.demo2.address.toString(),
              denom: NEUTRON_DENOM,
              amount: '1000',
            },
          }),
        );
        expect(res.code).toEqual(0);
      });

      test('check wallet balance', async () => {
        await waitBlocks(cm.sdk, 10);
        const balances = await cm2.queryBalances(
          testState.wallets.cosmos.demo2.address.toString(),
        );
        // we expect X4 balance because the contract sends 2 txs: first one = amount and the second one amount*2 + transfer from a usual account
        expect(
          balances.balances.find(
            (bal): boolean =>
              bal.denom ==
              'ibc/C053D637CCA2A2BA030E2C5EE1B28A16F71CCB0E45E8BE52766DC1B241B77878',
          )?.amount,
        ).toEqual('4000');
      });
      test('relayer must receive fee', async () => {
        const balances = await cm.queryBalances(IBC_RELAYER_NEUTRON_ADDRESS);
        const balance = parseInt(
          balances.balances.find((bal) => bal.denom == NEUTRON_DENOM)?.amount ||
            '0',
          10,
        );
        expect(balance - 2333 * 2 - relayerBalance).toBeLessThan(5); // it may differ by about 1-2 because of the gas fee
      });
      test('contract should be refunded', async () => {
        await waitBlocks(cm.sdk, 10);
        const balances = await cm.queryBalances(contractAddress);
        const balance = parseInt(
          balances.balances.find((bal) => bal.denom == NEUTRON_DENOM)?.amount ||
            '0',
          10,
        );
        expect(balance).toBe(50000 - 3000 - 2333 * 2);
      });
    });
    describe('Missing fee', () => {
      beforeAll(async () => {
        await cm.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: cm.denom,
              ack_fee: '0',
              recv_fee: '0',
              timeout_fee: '0',
            },
          }),
        );
      });
      test('execute contract should fail', async () => {
        await expect(
          cm.executeContract(
            contractAddress,
            JSON.stringify({
              send: {
                channel: 'channel-0',
                to: testState.wallets.cosmos.demo2.address.toString(),
                denom: NEUTRON_DENOM,
                amount: '1000',
              },
            }),
          ),
        ).rejects.toThrow(/invalid coins/);
      });
    });
    describe('Fee in wrong denom', () => {
      const portName = 'transfer';
      const channelName = 'channel-0';
      const uatomIBCDenom = getIBCDenom(portName, channelName, 'uatom');
      expect(uatomIBCDenom).toEqual(
        'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
      );
      test('transfer some atoms to contract', async () => {
        const uatomAmount = '1000';
        const res = await cm2.msgIBCTransfer(
          portName,
          channelName,
          { denom: cm2.denom, amount: uatomAmount },
          contractAddress,
          { revision_number: 2, revision_height: 100000000 },
        );
        expect(res.code).toEqual(0);

        await waitBlocks(cm.sdk, 10);
        const balances = await cm.queryBalances(contractAddress);
        expect(
          balances.balances.find((bal): boolean => bal.denom == uatomIBCDenom)
            ?.amount,
        ).toEqual(uatomAmount);
      });
      test('try to set fee in IBC transferred atoms', async () => {
        const res = await cm.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: uatomIBCDenom,
              ack_fee: '100',
              recv_fee: '0',
              timeout_fee: '100',
            },
          }),
        );
        expect(res.code).toEqual(0);

        await expect(
          cm.executeContract(
            contractAddress,
            JSON.stringify({
              send: {
                channel: 'channel-0',
                to: testState.wallets.cosmos.demo2.address.toString(),
                denom: NEUTRON_DENOM,
                amount: '1000',
              },
            }),
          ),
        ).rejects.toThrow(/insufficient fee/);
      });
    });
    describe('Not enough amount of tokens on contract to pay fee', () => {
      beforeAll(async () => {
        await cm.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: cm.denom,
              ack_fee: '1000000',
              recv_fee: '0',
              timeout_fee: '100000',
            },
          }),
        );
      });
      test('execute contract should fail', async () => {
        await expect(
          cm.executeContract(
            contractAddress,
            JSON.stringify({
              send: {
                channel: 'channel-0',
                to: testState.wallets.cosmos.demo2.address.toString(),
                denom: NEUTRON_DENOM,
                amount: '1000',
              },
            }),
          ),
        ).rejects.toThrow(/insufficient funds/);
      });
    });

    describe('Not enough amount of tokens on contract to pay fee', () => {
      beforeAll(async () => {
        await cm.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: cm.denom,
              ack_fee: '1000',
              recv_fee: '0',
              timeout_fee: '1000',
            },
          }),
        );
      });
      test('execute contract with failing sudo', async () => {
        const failuresBeforeCall = await cm.queryAckFailures(contractAddress);
        expect(failuresBeforeCall.failures.length).toEqual(0);

        // Mock sudo handler to fail
        await cm.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_set_sudo_failure_mock: {},
          }),
        );

        await cm.executeContract(
          contractAddress,
          JSON.stringify({
            send: {
              channel: 'channel-0',
              to: testState.wallets.cosmos.demo2.address.toString(),
              denom: NEUTRON_DENOM,
              amount: '1000',
            },
          }),
        );

        // This dirty workaround is here to prevent failing IBC transfer
        // from failing the whole test suite (which is very annoying).
        // TODO: figure out why contract fails to perform IBC transfer
        //       and implement a proper fix.
        let attempts = 10;
        while (attempts > 0) {
          attempts -= 1;

          try {
            await waitBlocks(cm.sdk, 3);
            const currentHeight = await getRemoteHeight(cm.sdk);

            await cm.executeContract(
              contractAddress,
              JSON.stringify({
                send: {
                  channel: 'channel-0',
                  to: testState.wallets.cosmos.demo2.address.toString(),
                  denom: NEUTRON_DENOM,
                  amount: '1000',
                  timeout_height: currentHeight + 2,
                },
              }),
            );
            break;
            // eslint-disable-next-line no-empty
          } catch (e) {}
        }
        expect(attempts).toBeGreaterThan(0);

        const failuresAfterCall = await getWithAttempts<AckFailuresResponse>(
          cm.sdk,
          async () => cm.queryAckFailures(contractAddress),
          // Wait until there 4 failure in the list
          async (data) => data.failures.length == 4,
        );

        expect(failuresAfterCall.failures).toEqual([
          expect.objectContaining({
            address: contractAddress,
            id: '0',
            response_type: 'ack',
          }),
          expect.objectContaining({
            address: contractAddress,
            id: '1',
            response_type: 'ack',
          }),
          expect.objectContaining({
            address: contractAddress,
            id: '2',
            response_type: 'timeout',
          }),
          expect.objectContaining({
            address: contractAddress,
            id: '3',
            response_type: 'timeout',
          }),
        ]);

        // Restore sudo handler to state
        await cm.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_unset_sudo_failure_mock: {},
          }),
        );
      });
    });
    describe('Failures limit test', () => {
      test("failures with small limit doesn't return an error", async () => {
        const pagination: PageRequest = {
          'pagination.limit': '1',
          'pagination.offset': '0',
        };
        const failures = await cm.queryAckFailures(contractAddress, pagination);
        expect(failures.failures.length).toEqual(1);
      });
      test('failures with big limit returns an error', async () => {
        const pagination: PageRequest = {
          'pagination.limit': '10000',
          'pagination.offset': '0',
        };
        await expect(
          cm.queryAckFailures(contractAddress, pagination),
        ).rejects.toThrow(/limit is more than maximum allowed/);
      });
    });
  });
});
