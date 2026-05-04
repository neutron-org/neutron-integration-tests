import '@neutron-org/neutronjsplus';
import { Registry } from '@cosmjs/proto-signing';
import { RunnerTestSuite, inject, expect } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import { MsgTransfer as GaiaMsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import { MsgTransfer as NeutronMsgTransfer } from '@neutron-org/neutronjs/ibc/applications/transfer/v1/tx';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import { QueryClientImpl as BankQueryClient } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/query.rpc.Query';
import {
  COSMOS_DENOM,
  CONTRACTS,
  NEUTRON_DENOM,
} from '../../helpers/constants';
import { SigningStargateClient } from '@cosmjs/stargate';
import config from '../../config.json';
import { ADMIN_MODULE_ADDRESS } from '@neutron-org/neutronjsplus/dist/constants';
import { QueryClientImpl as IbcQueryClient } from '@neutron-org/neutronjs/ibc/applications/transfer/v1/query.rpc.Query';
import { GaiaWallet, Wallet } from '../../helpers/wallet';
import { delegateTokens } from '../../helpers/staking';
import {
  executeMsgSubmitProposalV1,
  executeMsgVoteNeutron,
} from '../../helpers/gov';
import { getEventAttribute } from '@neutron-org/neutronjsplus/dist/cosmos';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import { BinaryWriter } from '@neutron-org/neutronjs/binary';
import { Params as IbcRateLimitParams } from '@neutron-org/neutronjs/neutron/ibcratelimit/v1beta1/params';
import { MsgUpdateParams as MintMsgUpdateParams } from '@neutron-org/neutronjs/cosmos/mint/v1beta1/tx';
import { Params as MintParams } from '@neutron-org/neutronjs/cosmos/mint/v1beta1/mint';
import { QueryClientImpl as MintQueryClient } from '@neutron-org/neutronjs/cosmos/mint/v1beta1/query.rpc.Query';

const GOV_MODULE_ADDRESS = 'neutron10d07y265gmmuvt4z0w9aw880jnsr700j7a68v5';
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

function encodeIbcRateLimitMsgUpdateParams(
  authority: string,
  contractAddress: string,
): Uint8Array {
  const writer = BinaryWriter.create();
  if (authority !== '') writer.uint32(10).string(authority);
  IbcRateLimitParams.encode(
    IbcRateLimitParams.fromPartial({ contractAddress }),
    writer.uint32(18).fork(),
  ).ldelim();
  return writer.finish();
}

const TRANSFER_CHANNEL = 'channel-0';
const UATOM_IBC_TO_NEUTRON_DENOM =
  'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2';

describe('Neutron / IBC transfer', () => {
  let testState: LocalState;

  let neutronClient: NeutronTestClient;
  let neutronClient2: NeutronTestClient;
  let gaiaClient: SigningStargateClient;
  let neutronWallet: Wallet;
  let neutronWallet2: Wallet;
  let gaiaWallet: GaiaWallet;
  let govWallet: Wallet;
  let govClient: NeutronTestClient;

  let rlContract: string;
  let ibcContract: string;

  let bankQuerier: BankQueryClient;
  let ibcQuerier: IbcQueryClient;
  let mintQuerier: MintQueryClient;

  let amount: string;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronWallet = testState.wallets.neutron.demo1;
    neutronClient = await NeutronTestClient.connectWithSigner(neutronWallet);
    neutronWallet2 = await testState.nextNeutronWallet();
    neutronClient2 = await NeutronTestClient.connectWithSigner(neutronWallet2);
    gaiaWallet = await testState.nextGaiaWallet();
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.signer,
      { registry: new Registry(defaultRegistryTypes) },
    );

    const neutronRpcClient = await testState.neutronRpcClient();

    govWallet = await testState.nextSecp256k1SignNeutronWallet();
    govClient = await NeutronTestClient.connectWithSigner(govWallet);
    bankQuerier = new BankQueryClient(neutronRpcClient);
    ibcQuerier = new IbcQueryClient(neutronRpcClient);
    mintQuerier = new MintQueryClient(neutronRpcClient);
  });

  describe('Mint module: set mint_denom to fakeuntrn', () => {
    test('delegate from gov wallet', async () => {
      const govRes = await delegateTokens(
        govClient,
        govWallet.address,
        testState.wallets.neutron.val1.valAddress,
        '5000000000',
      );
      expect(govRes.code).toEqual(0);
    });

    test('submit, vote and execute proposal to set mint_denom to fakeuntrn', async () => {
      const currentParams = await mintQuerier.params();
      const newParams = MintParams.fromPartial({
        ...currentParams.params,
        mintDenom: 'fakeuntrn',
      });
      const res = await executeMsgSubmitProposalV1(
        govClient,
        govWallet,
        'Mint params: mint_denom to fakeuntrn',
        'Change mint module mint_denom from untrn to fakeuntrn so UNTRN supply is fixed for IBC rate limit tests',
        '',
        [
          {
            typeUrl: MintMsgUpdateParams.typeUrl,
            value: MintMsgUpdateParams.encode(
              MintMsgUpdateParams.fromPartial({
                authority: GOV_MODULE_ADDRESS,
                params: newParams,
              }),
            ).finish(),
          },
        ],
        [{ denom: NEUTRON_DENOM, amount: '60000000' }],
        true,
        { gas: '4000000', amount: [{ denom: NEUTRON_DENOM, amount: '10000' }] },
      );
      expect(res.code).toEqual(0);
      const proposalId = parseInt(
        getEventAttribute(res.events, 'submit_proposal', 'proposal_id') || '1',
        10,
      );
      const voteRes = await executeMsgVoteNeutron(
        govClient,
        govWallet,
        proposalId,
      );
      expect(voteRes.code).toEqual(0);
      await waitSeconds(15);
    });
  });

  describe('Contracts', () => {
    test('store and instantiate RL contract', async () => {
      const quota = buildChannelQuota(
        'weekly',
        TRANSFER_CHANNEL,
        NEUTRON_DENOM,
        604800,
        1,
        1,
      );
      rlContract = await neutronClient.create(CONTRACTS.IBC_RATE_LIMITER, {
        gov_module: neutronWallet.address,
        ibc_module: ADMIN_MODULE_ADDRESS,
        paths: [quota],
      });
    });
    test('instantiate IBC contract', async () => {
      ibcContract = await neutronClient.create(CONTRACTS.IBC_TRANSFER, {});
    });
  });

  describe('prepare: test IBC transfer and set RL contract addr to neutron', () => {
    test('delegate from gov wallet', async () => {
      const govRes = await delegateTokens(
        govClient,
        govWallet.address,
        testState.wallets.neutron.val1.valAddress,
        '5000000000',
      );
      expect(govRes.code).toEqual(0);
    });

    test('IBC transfer without any limits', async () => {
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

    describe('IBC rate limit params proposal', () => {
      test('submit, vote and execute proposal to set RL contract', async () => {
        const res = await executeMsgSubmitProposalV1(
          govClient,
          govWallet,
          'Proposal #1',
          'Param change proposal. Setup IBC rate limit contract',
          '',
          [
            {
              typeUrl: '/neutron.ibcratelimit.v1beta1.MsgUpdateParams',
              value: encodeIbcRateLimitMsgUpdateParams(
                GOV_MODULE_ADDRESS,
                rlContract,
              ),
            },
          ],
          [{ denom: NEUTRON_DENOM, amount: '60000000' }],
          true,
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );
        expect(res.code).toEqual(0);
        const proposalId = parseInt(
          getEventAttribute(res.events, 'submit_proposal', 'proposal_id') ||
            '1',
          10,
        );
        const voteRes = await executeMsgVoteNeutron(
          govClient,
          govWallet,
          proposalId,
        );
        expect(voteRes.code).toEqual(0);
        await waitSeconds(15);
      });
    });
  });

  describe('IBC Rate limits', () => {
    describe('setup ibc contract', () => {
      test('transfer to contract', async () => {
        const res = await neutronClient.sendTokens(
          ibcContract,
          [{ denom: NEUTRON_DENOM, amount: '50000000' }],
          {
            gas: '200000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
          },
        );
        expect(res.code).toEqual(0);
      });
      test('set payer fees', async () => {
        const res = await neutronClient.execute(ibcContract, {
          set_fees: {
            fees: {
              denom: NEUTRON_DENOM,
              ack_fee: '2333',
              recv_fee: '0',
              timeout_fee: '2666',
            },
          },
        });
        expect(res.code).toEqual(0);
      });
    });
    describe('with limit, Neutron -> gaia', () => {
      test('IBC transfer exceed limit in 2 steps: 1tx almost hits the limit (w/o failing), 2 tx exceeds the limit by 1 untrn', async () => {
        const fee = {
          gas: '300000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        };
        const neutronSupply = await bankQuerier.supplyOf({
          denom: NEUTRON_DENOM,
        });
        // 1% of ntrn supply - 1ntrn
        const firstAmount = (
          BigInt(neutronSupply.amount.amount) / BigInt(100) -
          BigInt(1000000)
        ).toString();

        // transfer 6.9(9)M from neutron wallet which almost 1%, but still not reach it
        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: NeutronMsgTransfer.typeUrl,
              value: NeutronMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: NEUTRON_DENOM, amount: firstAmount },
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

        const res2 = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: NeutronMsgTransfer.typeUrl,
              value: NeutronMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: NEUTRON_DENOM, amount: '1000001' }, // basically 1NTRN + 1 untrn
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
        expect(res2.code).toEqual(2);
        expect(res2.rawLog).contains(
          'IBC Rate Limit exceeded for channel-0/untrn.',
        );
      });

      test('IBC send via contract(s) should be limited as well', async () => {
        await expect(
          neutronClient.execute(ibcContract, {
            send: {
              channel: TRANSFER_CHANNEL,
              to: gaiaWallet.address,
              denom: NEUTRON_DENOM,
              amount: '1000001',
            },
          }),
        ).rejects.toThrow(/IBC Rate Limit exceeded for channel-0/);
      });

      test('IBC transfer from a different wallet to ensure that limiting is working for different address (non-contract)', async () => {
        const fee = {
          gas: '300000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        };
        const res = await neutronClient2.signAndBroadcast(
          [
            {
              typeUrl: NeutronMsgTransfer.typeUrl,
              value: NeutronMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: NEUTRON_DENOM, amount: '1000001' }, // 1NTRN + 1untrn
                sender: neutronWallet2.address,
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
        expect(res.code).toEqual(2);
        expect(res.rawLog).contains(
          'IBC Rate Limit exceeded for channel-0/untrn.',
        );
      });

      test('Unset limit', async () => {
        await neutronClient.execute(rlContract, {
          remove_path: {
            channel_id: TRANSFER_CHANNEL,
            denom: NEUTRON_DENOM,
          },
        });
      });
      test('IBC transfer:  no more limiting', async () => {
        const fee = {
          gas: '300000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        };
        // here we are doing the exact same tx, but it is not failing because there is no such path (limit) anymore
        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: NeutronMsgTransfer.typeUrl,
              value: NeutronMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: NEUTRON_DENOM, amount: '100000' },
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
    });
    describe('with limit, Gaia -> Neutron', () => {
      test('send some atoms to neutron chain', async () => {
        const resBeforeLimit = await gaiaClient.signAndBroadcast(
          gaiaWallet.address,
          [
            {
              typeUrl: GaiaMsgTransfer.typeUrl,
              value: GaiaMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: COSMOS_DENOM, amount: '1000000' },
                sender: gaiaWallet.address,
                receiver: neutronWallet.address,
                timeoutHeight: {
                  revisionNumber: 2n,
                  revisionHeight: 100000000n,
                },
              }),
            },
          ],
          {
            gas: '200000',
            amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
          },
        );
        expect(resBeforeLimit.code).toEqual(0);
      });

      test('check that weird IBC denom is uatom indeed', async () => {
        const res = await ibcQuerier.denom({
          hash: '27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        });
        expect(res.denom.base).toEqual(COSMOS_DENOM);
      });

      test('add limit', async () => {
        const quota = buildChannelQuota(
          'weekly',
          TRANSFER_CHANNEL,
          UATOM_IBC_TO_NEUTRON_DENOM,
          604800,
          1,
          1,
        );
        await neutronClient.execute(rlContract, {
          add_path: quota,
        });
      });

      test('IBC transfer exceeds the limit', async () => {
        const uatomibcSupply = await bankQuerier.supplyOf({
          denom: UATOM_IBC_TO_NEUTRON_DENOM,
        });

        amount = (
          BigInt(uatomibcSupply.amount.amount) / BigInt(100) +
          BigInt(1)
        ).toString();

        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: NeutronMsgTransfer.typeUrl,
              value: NeutronMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: UATOM_IBC_TO_NEUTRON_DENOM, amount: amount },
                sender: neutronWallet.address,
                receiver: gaiaWallet.address,
                timeoutHeight: {
                  revisionNumber: 2n,
                  revisionHeight: 100000000n,
                },
              }),
            },
          ],
          {
            gas: '200000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
          },
        );
        expect(res.code).toEqual(2);
        expect(res.rawLog).contains('IBC Rate Limit exceeded');
      });
    });

    // Note: we haven't unset the limit afterwards, instead we've removed rate limiting contract from params.
    // ibc send afterward should work because rate-limiting MW action is completely removed from the ibc stack
    describe('Remove RL contract from neutron', () => {
      test('submit, vote and execute proposal to remove RL contract', async () => {
        const res = await executeMsgSubmitProposalV1(
          govClient,
          govWallet,
          'Proposal #2',
          'Param change proposal. Remove rate limit contract',
          '',
          [
            {
              typeUrl: '/neutron.ibcratelimit.v1beta1.MsgUpdateParams',
              value: encodeIbcRateLimitMsgUpdateParams(GOV_MODULE_ADDRESS, ''),
            },
          ],
          [{ denom: NEUTRON_DENOM, amount: '60000000' }],
          true,
          {
            gas: '4000000',
            amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
          },
        );
        expect(res.code).toEqual(0);
        const proposalId = parseInt(
          getEventAttribute(res.events, 'submit_proposal', 'proposal_id') ||
            '2',
          10,
        );
        const voteRes = await executeMsgVoteNeutron(
          govClient,
          govWallet,
          proposalId,
        );
        expect(voteRes.code).toEqual(0);
        await waitSeconds(15);
      });
      // and here we just test if ibc send works
      test('perform IBC send after removing contract: should be fine', async () => {
        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: NeutronMsgTransfer.typeUrl,
              value: NeutronMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: UATOM_IBC_TO_NEUTRON_DENOM, amount: amount },
                sender: neutronWallet.address,
                receiver: gaiaWallet.address,
                timeoutHeight: {
                  revisionNumber: 2n,
                  revisionHeight: 100000000n,
                },
              }),
            },
          ],
          {
            gas: '200000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
          },
        );
        expect(res.code).toEqual(0);
      });
    });
  });
});

function buildChannelQuota(
  name: string,
  channel: string,
  denom: string,
  duration: number,
  sendPercentage: number,
  recvPercentage: number,
): object {
  return {
    channel_id: channel,
    denom: denom,
    quotas: [
      {
        name: name,
        duration: duration,
        send_recv: [sendPercentage, recvPercentage],
      },
    ],
  };
}
