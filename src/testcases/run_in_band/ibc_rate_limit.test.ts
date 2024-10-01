import { Registry } from '@cosmjs/proto-signing';
import { RunnerTestSuite, inject, expect } from 'vitest';
import { LocalState, mnemonicToWallet } from '../../helpers/local_state';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
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
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { ADMIN_MODULE_ADDRESS } from '@neutron-org/neutronjsplus/dist/constants';
import { createRPCQueryClient as createNeutronClient } from '@neutron-org/neutronjs/neutron/rpc.query';
import { NeutronQuerier } from '@neutron-org/neutronjs/querier_types';
import { QueryClientImpl as IbcQueryClient } from '@neutron-org/neutronjs/ibc/applications/transfer/v1/query.rpc.Query';
import { Wallet } from '../../helpers/wallet';

const TRANSFER_CHANNEL = 'channel-0';
const UATOM_IBC_TO_NEUTRON_DENOM =
  'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2';

// These are th
const DEMO_MNEMONIC_1 =
  'banner spread envelope side kite person disagree path silver will brother under couch edit food venture squirrel civil budget number acquire point work mass';
const DEMO_MNEMONIC_2 =
  'veteran try aware erosion drink dance decade comic dawn museum release episode original list ability owner size tuition surface ceiling depth seminar capable only';

describe('Neutron / IBC transfer', () => {
  let testState: LocalState;

  let neutronClient: SigningNeutronClient;
  let neutronClient2: SigningNeutronClient;
  let gaiaClient: SigningStargateClient;
  let neutronWallet: Wallet;
  let neutronWallet2: Wallet;
  let gaiaWallet: Wallet;

  let daoMember1: DaoMember;
  let mainDao: Dao;
  let chainManagerAddress: string;

  let rlContract: string;
  let ibcContract: string;

  let bankQuerier: BankQueryClient;
  let neutronQuerier: NeutronQuerier;
  let ibcQuerier: IbcQueryClient;

  let amount: string;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronWallet = await mnemonicToWallet(DEMO_MNEMONIC_1, 'neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );
    neutronWallet2 = await testState.nextWallet('neutron');
    neutronClient2 = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet2.directwallet,
      neutronWallet2.address,
    );
    gaiaWallet = await mnemonicToWallet(DEMO_MNEMONIC_2, 'cosmos');
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.directwallet,
      { registry: new Registry(defaultRegistryTypes) },
    );

    const neutronRpcClient = await testState.neutronRpcClient();

    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient,
      neutronRpcClient,
    ); // add assert for some addresses
    const daoContracts = await getDaoContracts(neutronClient, daoCoreAddress);
    mainDao = new Dao(neutronClient, daoContracts);
    daoMember1 = new DaoMember(
      mainDao,
      neutronClient.client,
      neutronWallet.address,
      NEUTRON_DENOM,
    );
    bankQuerier = new BankQueryClient(neutronRpcClient);
    neutronQuerier = await createNeutronClient({
      rpcEndpoint: testState.rpcNeutron,
    });
    const admins = await neutronQuerier.cosmos.adminmodule.adminmodule.admins();
    chainManagerAddress = admins.admins[0];
    ibcQuerier = new IbcQueryClient(neutronRpcClient);
    neutronClient.waitBlocks(20);
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
    test('bond form wallet 1', async () => {
      await daoMember1.bondFunds('10000');
      await neutronClient.getWithAttempts(
        async () => await mainDao.queryVotingPower(daoMember1.user),
        async (response) => response.power == 11000,
        20,
      );
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
      const proposalId = 1;
      test('create proposal', async () => {
        await daoMember1.submitUpdateParamsRateLimitProposal(
          chainManagerAddress,
          'Proposal #1',
          'Param change proposal. Setup IBC rate limit contract',
          {
            contract_address: rlContract,
          },
          '1000',
        );
      });
      test('vote YES', async () => {
        await daoMember1.voteYes(proposalId);
      });
      test('check if proposal is passed', async () => {
        await mainDao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
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
            denom: NEUTRON_DENOM,
            ack_fee: '2333',
            recv_fee: '0',
            timeout_fee: '2666',
          },
        });
        expect(res.code).toEqual(0);
      });
    });
    describe('with limit, Neutron -> gaia', () => {
      test('IBC transfer exceed limit in 2 steps: 1tx almost hits the limit (w/o failing), 2 tx exceeds the limit by 1 untrn', async () => {
        const fee = {
          gas: '200000',
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
          gas: '200000',
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
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        };
        // here we doing exact same tx, but it is not failing because there is no such path (limit) anymore
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
        const resBefroreLimit = await gaiaClient.signAndBroadcast(
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
        expect(resBefroreLimit.code).toEqual(0);
      });

      test('check that weird IBC denom is uatom indeed', async () => {
        const res = await ibcQuerier.denomTrace({
          hash: '27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
        });
        expect(res.denomTrace.baseDenom).toEqual(COSMOS_DENOM);
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
    // ibc send afterwards should work because rate-limiting MW action is completely removed from the ibc stack
    describe('Remove RL contract from neutron', () => {
      const proposalId = 2;
      test('create proposal', async () => {
        await daoMember1.submitUpdateParamsRateLimitProposal(
          chainManagerAddress,
          'Proposal #2',
          'Param change proposal. Remove rate limit contract',
          {
            contract_address: '',
          },
          '1000',
        );
      });
      test('vote YES', async () => {
        await daoMember1.voteYes(proposalId);
      });
      test('check if proposal is passed', async () => {
        await mainDao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await daoMember1.executeProposalWithAttempts(proposalId);
      });
      // and here we just tests if ibc send works
      test('perform IBC send after removig of contract: should be fine', async () => {
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
