import { Registry } from '@cosmjs/proto-signing';
import { RunnerTestSuite, inject, describe, beforeAll } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import { MsgTransfer as NeutronMsgTransfer } from '@neutron-org/neutronjs/ibc/applications/transfer/v1/tx';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import { QueryClientImpl as BankQueryClient } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/query.rpc.Query';
import {
  CONTRACTS,
  NEUTRON_DENOM,
} from '../../helpers/constants';
import { SigningStargateClient } from '@cosmjs/stargate';
import { GaiaWallet, Wallet } from '../../helpers/wallet';
import config from '../../config.json';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';

const TRANSFER_CHANNEL = 'channel-0';
const IBC_TOKEN_DENOM =
  'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6';

describe('Neutron / IBC transfer', () => {
  let testState: LocalState;

  let neutronClient: NeutronTestClient;
  let gaiaClient: SigningStargateClient;
  let neutronWallet: Wallet;
  let gaiaWallet: GaiaWallet;

  let ibcContract: string;

  let bankQuerier: BankQueryClient;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronWallet = await testState.nextNeutronWallet();
    neutronClient = await NeutronTestClient.connectWithSigner(neutronWallet);

    gaiaWallet = await testState.nextGaiaWallet();
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.signer,
      { registry: new Registry(defaultRegistryTypes) },
    );

    const neutronRpcClient = await testState.neutronRpcClient();
    bankQuerier = new BankQueryClient(neutronRpcClient);
  });

  describe('Contracts', () => {
    test('instantiate contract', async () => {
      ibcContract = await neutronClient.create(CONTRACTS.IBC_TRANSFER, {});
    });
  });

  describe('IBC', () => {
    describe('Correct way', () => {
      const initialContractBalance = 500000;

      beforeAll(async () => {
        await neutronClient.waitBlocks(10);
      });
      test('transfer to contract', async () => {
        const res = await neutronClient.sendTokens(
          ibcContract,
          [{ denom: NEUTRON_DENOM, amount: initialContractBalance.toString() }],
          {
            gas: '200000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
          },
        );
        expect(res.code).toEqual(0);
      });
      test('check balance', async () => {
        const res = await bankQuerier.allBalances({
          resolveDenom: false,
          address: ibcContract,
        });
        expect(res.balances).toEqual([
          { amount: initialContractBalance.toString(), denom: NEUTRON_DENOM },
        ]);
      });
      test('IBC transfer from a usual account', async () => {
        const fee = {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        };
        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: NeutronMsgTransfer.typeUrl,
              value: NeutronMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: NEUTRON_DENOM, amount: '1000' },
                sender: neutronWallet.address,
                receiver: gaiaWallet.address,
                timeoutHeight: {
                  revisionNumber: 2n,
                  revisionHeight: 100000000n,
                },
              }),
            },
          ],
          fee,
        );
        expect(res.code).toEqual(0);
      });
      test('check IBC token balance', async () => {
        await neutronClient.waitBlocks(10);
        const balance = await gaiaClient.getBalance(
          gaiaWallet.address,
          IBC_TOKEN_DENOM,
        );
        expect(balance.amount).toEqual('1000');
      });

      test('check getContract', async () => {
        // Use neutronClient which extends CosmWasmClient
        const contractInfo = await neutronClient.getContract(ibcContract);

        // Verify the response contains expected contract info
        expect(contractInfo.address).toEqual(ibcContract);
        expect(contractInfo.creator).toBeDefined();
        expect(contractInfo.codeId).toBeGreaterThan(0);
      });
    });
  });
});
