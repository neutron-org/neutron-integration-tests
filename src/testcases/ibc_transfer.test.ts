import Long from 'long';
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
import { getRemoteHeight, getWithAttempts } from '../helpers/wait';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';

describe('Neutron / IBC-transfer', () => {
  let testState: TestStateLocalCosmosTestNet;
  let ntrnDemo1: CosmosWrapper;
  let cosmosDemo2: CosmosWrapper;
  let ntrnDemo2: CosmosWrapper;
  let contractAddress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    ntrnDemo1 = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    cosmosDemo2 = new CosmosWrapper(
      testState.sdk2,
      testState.blockWaiter2,
      testState.wallets.cosmos.demo2,
      COSMOS_DENOM,
    );
    ntrnDemo2 = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      testState.wallets.neutron.demo2,
      NEUTRON_DENOM,
    );
    const codeId = await ntrnDemo1.storeWasm(NeutronContract.IBC_TRANSFER);
    // BEWARE: this contract sends 2 txs
    const res = await ntrnDemo1.instantiate(codeId, '{}', 'ibc_transfer');
    contractAddress = res[0]._contract_address;
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

  describe('IBC', () => {
    describe('Correct way', () => {
      let relayerBalance = 0;
      beforeAll(async () => {
        await ntrnDemo1.blockWaiter.waitBlocks(10);
        const balances = await ntrnDemo1.queryBalances(
          IBC_RELAYER_NEUTRON_ADDRESS,
        );
        relayerBalance = parseInt(
          balances.balances.find((bal) => bal.denom == NEUTRON_DENOM)?.amount ||
            '0',
          10,
        );
      });
      test('transfer to contract', async () => {
        const res = await ntrnDemo1.msgSend(
          contractAddress.toString(),
          '50000',
        );
        expect(res.code).toEqual(0);
      });
      test('check balance', async () => {
        const balances = await ntrnDemo1.queryBalances(contractAddress);
        expect(balances.balances).toEqual([
          { amount: '50000', denom: NEUTRON_DENOM },
        ]);
      });
      test('IBC transfer from a usual account', async () => {
        const res = await ntrnDemo1.msgIBCTransfer(
          'transfer',
          'channel-0',
          { denom: NEUTRON_DENOM, amount: '1000' },
          testState.wallets.cosmos.demo2.address.toString(),
          {
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
        );
        expect(res.code).toEqual(0);
      });
      test('check IBC token balance', async () => {
        await ntrnDemo1.blockWaiter.waitBlocks(10);
        const balances = await cosmosDemo2.queryBalances(
          testState.wallets.cosmos.demo2.address.toString(),
        );
        expect(
          balances.balances.find(
            (bal): boolean =>
              bal.denom ==
              'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6',
          )?.amount,
        ).toEqual('1000');
      });
      test('uatom IBC transfer from a remote chain to Neutron', async () => {
        const res = await cosmosDemo2.msgIBCTransfer(
          'transfer',
          'channel-0',
          { denom: COSMOS_DENOM, amount: '1000' },
          testState.wallets.neutron.demo1.address.toString(),
          {
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
        );
        expect(res.code).toEqual(0);
      });
      test('check uatom token balance transfered  via IBC on Neutron', async () => {
        await ntrnDemo1.blockWaiter.waitBlocks(10);
        const balances = await ntrnDemo1.queryBalances(
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
        const denomTrace = await ntrnDemo1.queryDenomTrace(
          '27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        );
        expect(denomTrace.base_denom).toEqual(COSMOS_DENOM);
      });
      test('set payer fees', async () => {
        const res = await ntrnDemo1.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: ntrnDemo1.denom,
              ack_fee: '2333',
              recv_fee: '0',
              timeout_fee: '2666',
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
      test('execute contract', async () => {
        const res = await ntrnDemo1.executeContract(
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
        await ntrnDemo1.blockWaiter.waitBlocks(10);
        const balances = await cosmosDemo2.queryBalances(
          testState.wallets.cosmos.demo2.address.toString(),
        );
        // we expect X4 balance because the contract sends 2 txs: first one = amount and the second one amount*2 + transfer from a usual account
        expect(
          balances.balances.find(
            (bal): boolean =>
              bal.denom ==
              'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6',
          )?.amount,
        ).toEqual('4000');
      });
      test('relayer must receive fee', async () => {
        const balances = await ntrnDemo1.queryBalances(
          IBC_RELAYER_NEUTRON_ADDRESS,
        );
        const balance = parseInt(
          balances.balances.find((bal) => bal.denom == NEUTRON_DENOM)?.amount ||
            '0',
          10,
        );
        expect(balance - 2333 * 2 - relayerBalance).toBeLessThan(5); // it may differ by about 1-2 because of the gas fee
      });
      test('contract should be refunded', async () => {
        await ntrnDemo1.blockWaiter.waitBlocks(10);
        const balances = await ntrnDemo1.queryBalances(contractAddress);
        const balance = parseInt(
          balances.balances.find((bal) => bal.denom == NEUTRON_DENOM)?.amount ||
            '0',
          10,
        );
        expect(balance).toBe(50000 - 3000 - 2333 * 2);
      });
    });
    describe('Fee payer', () => {
      beforeAll(async () => {
        await ntrnDemo1.msgSend(contractAddress.toString(), '50000');
        await ntrnDemo1.executeContract(contractAddress, {
          set_fees: {
            denom: ntrnDemo1.denom,
            ack_fee: '2333',
            recv_fee: '0',
            timeout_fee: '2666',
            payer: ntrnDemo2.wallet.address.toString(),
          },
        });
      });
      test('should return error bc there is no fee grant yet', async () => {
        await expect(
          ntrnDemo1.executeContract(contractAddress, {
            send: {
              channel: 'channel-0',
              to: testState.wallets.cosmos.demo2.address.toString(),
              denom: NEUTRON_DENOM,
              amount: '1000',
            },
          }),
        ).rejects.toThrow(/fee-grant not found/);
      });
      test('should spend fee payer tokens', async () => {
        await ntrnDemo2.feeGrant(contractAddress);
        const balanceBefore = await ntrnDemo1.queryDenomBalance(
          ntrnDemo2.wallet.address.toString(),
          NEUTRON_DENOM,
        );
        await ntrnDemo1.executeContract(contractAddress, {
          send: {
            channel: 'channel-0',
            to: testState.wallets.cosmos.demo2.address.toString(),
            denom: NEUTRON_DENOM,
            amount: '1000',
          },
        });
        await ntrnDemo1.blockWaiter.waitBlocks(10); // must be enought to process the tx
        const balanceAfter = await ntrnDemo1.queryDenomBalance(
          ntrnDemo2.wallet.address.toString(),
          NEUTRON_DENOM,
        );
        // there are 2 txs in the contract so we must multiply the fee by 2
        // as ack is done and ackFee must be spent, and timeoutFee is refunded
        expect(balanceBefore - balanceAfter).toEqual(2333 * 2);
      });
    });
    describe('Missing fee', () => {
      beforeAll(async () => {
        await ntrnDemo1.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: ntrnDemo1.denom,
              ack_fee: '0',
              recv_fee: '0',
              timeout_fee: '0',
            },
          }),
        );
      });
      test('execute contract should fail', async () => {
        await expect(
          ntrnDemo1.executeContract(
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
        const res = await cosmosDemo2.msgIBCTransfer(
          portName,
          channelName,
          { denom: cosmosDemo2.denom, amount: uatomAmount },
          contractAddress,
          {
            revision_number: new Long(2),
            revision_height: new Long(100000000),
          },
        );
        expect(res.code).toEqual(0);

        await ntrnDemo1.blockWaiter.waitBlocks(10);
        const balances = await ntrnDemo1.queryBalances(contractAddress);
        expect(
          balances.balances.find((bal): boolean => bal.denom == uatomIBCDenom)
            ?.amount,
        ).toEqual(uatomAmount);
      });
      test('try to set fee in IBC transferred atoms', async () => {
        const res = await ntrnDemo1.executeContract(
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
          ntrnDemo1.executeContract(
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
        await ntrnDemo1.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: ntrnDemo1.denom,
              ack_fee: '1000000',
              recv_fee: '0',
              timeout_fee: '100000',
            },
          }),
        );
      });
      test('execute contract should fail', async () => {
        await expect(
          ntrnDemo1.executeContract(
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
    describe('Enough amount of tokens on contract to pay fee', () => {
      beforeAll(async () => {
        await ntrnDemo1.executeContract(
          contractAddress,
          JSON.stringify({
            set_fees: {
              denom: ntrnDemo1.denom,
              ack_fee: '1000',
              recv_fee: '0',
              timeout_fee: '1000',
            },
          }),
        );
      });
      test('execute contract with failing sudo', async () => {
        const failuresBeforeCall = await ntrnDemo1.queryAckFailures(
          contractAddress,
        );
        expect(failuresBeforeCall.failures.length).toEqual(0);

        // Mock sudo handler to fail
        await ntrnDemo1.executeContract(
          contractAddress,
          JSON.stringify({
            integration_tests_set_sudo_failure_mock: {},
          }),
        );

        await ntrnDemo1.executeContract(
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
            await ntrnDemo1.blockWaiter.waitBlocks(3);
            const currentHeight = await getRemoteHeight(ntrnDemo1.sdk);

            await ntrnDemo1.executeContract(
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
          ntrnDemo1.blockWaiter,
          async () => ntrnDemo1.queryAckFailures(contractAddress),
          // Wait until there 4 failure in the list
          async (data) => data.failures.length == 4,
        );

        expect(failuresAfterCall.failures).toEqual([
          expect.objectContaining({
            address: contractAddress,
            id: '0',
            ack_type: 'ack',
          }),
          expect.objectContaining({
            address: contractAddress,
            id: '1',
            ack_type: 'ack',
          }),
          expect.objectContaining({
            address: contractAddress,
            id: '2',
            ack_type: 'timeout',
          }),
          expect.objectContaining({
            address: contractAddress,
            id: '3',
            ack_type: 'timeout',
          }),
        ]);

        // Restore sudo handler to state
        await ntrnDemo1.executeContract(
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
        const failures = await ntrnDemo1.queryAckFailures(
          contractAddress,
          pagination,
        );
        expect(failures.failures.length).toEqual(1);
      });
      test('failures with big limit returns an error', async () => {
        const pagination: PageRequest = {
          'pagination.limit': '10000',
          'pagination.offset': '0',
        };
        await expect(
          ntrnDemo1.queryAckFailures(contractAddress, pagination),
        ).rejects.toThrow(/limit is more than maximum allowed/);
      });
    });
  });
});
