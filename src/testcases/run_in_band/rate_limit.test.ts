import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import { RunnerTestSuite, inject, expect } from 'vitest';
import { LocalState } from '../../helpers/local_state';
import {
  SigningNeutronClient,
  CreateWalletFromMnemonic,
} from '../../helpers/signing_neutron_client';
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
import { Wallet } from '../../helpers/wallet';
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

const TRANSFER_CHANNEL = 'channel-0';
const UATOM_IBC_TO_NEUTRON_DENOM =
  'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2';

// These are th
const DEMO_MNEMONIC_1 =
  'banner spread envelope side kite person disagree path silver will brother under couch edit food venture squirrel civil budget number acquire point work mass';
// const DEMO_MNEMONIC_2 =
//   'veteran try aware erosion drink dance decade comic dawn museum release episode original list ability owner size tuition surface ceiling depth seminar capable only';

describe('Neutron / IBC transfer', () => {
  let testState: LocalState;

  let neutronClient: SigningNeutronClient;
  let gaiaClient: SigningStargateClient;
  let neutronWallet: DirectSecp256k1HdWallet;
  let neutronAddr: string;
  let gaiaWallet: Wallet;

  let daoMember1: DaoMember;
  let mainDao: Dao;
  let chainManagerAddress: string;

  let rlContract: string;

  let bankQuerier: BankQueryClient;
  let neutronQuerier: NeutronQuerier;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronWallet = await CreateWalletFromMnemonic(DEMO_MNEMONIC_1, 'neutron');
    const accounts = await neutronWallet.getAccounts();
    neutronAddr = accounts[0].address;
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet,
      neutronAddr,
    );
    gaiaWallet = await testState.nextWallet('cosmos');
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
      accounts[0].address,
      NEUTRON_DENOM,
    );
    bankQuerier = new BankQueryClient(neutronRpcClient);
    neutronQuerier = await createNeutronClient({
      rpcEndpoint: testState.rpcNeutron,
    });
    const admins = await neutronQuerier.cosmos.adminmodule.adminmodule.admins();
    chainManagerAddress = admins.admins[0];
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
      console.log(
        JSON.stringify({
          gov_module: ADMIN_MODULE_ADDRESS,
          ibc_module: ADMIN_MODULE_ADDRESS,
          paths: [quota],
        }),
      );
      rlContract = await neutronClient.create(CONTRACTS.RATE_LIMITER, {
        gov_module: neutronAddr,
        ibc_module: ADMIN_MODULE_ADDRESS,
        paths: [quota],
      });
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
              sender: neutronAddr,
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

    describe('Rate limit params proposal', () => {
      const proposalId = 1;
      test('create proposal', async () => {
        await daoMember1.submitUpdateParamsRateLimitProposal(
          chainManagerAddress,
          'Proposal #1',
          'Param change proposal. Setup rate limit contract',
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

  describe('Rate limits', () => {
    describe('with limit, Neutron -> gaia', () => {
      test('IBC transfer to limit', async () => {
        const fee = {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        };
        const neutronSupply = await bankQuerier.supplyOf({
          denom: NEUTRON_DENOM,
        });

        console.log('BALANCEEE');
        console.log(neutronSupply.amount);
        // 1% of ntrn supply - 1ntrn
        const firstAmount = (
          BigInt(neutronSupply.amount.amount) / BigInt(100) -
          BigInt(1000000)
        ).toString();

        const balance = await neutronClient.getBalance(
          mainDao.contracts.core.address,
          NEUTRON_DENOM,
        );
        console.log(balance);
        // transfer 6.9(9)M from neutron wallet which almost 1%, but still not reach it
        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: NeutronMsgTransfer.typeUrl,
              value: NeutronMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: NEUTRON_DENOM, amount: firstAmount },
                sender: neutronAddr,
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
                sender: neutronAddr,
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
                sender: neutronAddr,
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
      // Note: we don't unset the limit afterwards, instead we're removing rate limiting contract from params
      test('IBC transfer to limit', async () => {
        const res = await gaiaClient.signAndBroadcast(
          gaiaWallet.address,
          [
            {
              typeUrl: GaiaMsgTransfer.typeUrl,
              value: GaiaMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: COSMOS_DENOM, amount: '1000' },
                sender: gaiaWallet.address,
                receiver: neutronAddr,
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
        expect(res.code).toEqual(0);
        expect(res.rawLog).contains(
          'IBC Rate Limit exceeded for channel-0/untrn.',
        );
      });
    });
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
      test('perform IBC send after removig of contract: should', async () => {
        const res = await gaiaClient.signAndBroadcast(
          gaiaWallet.address,
          [
            {
              typeUrl: GaiaMsgTransfer.typeUrl,
              value: GaiaMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: { denom: COSMOS_DENOM, amount: '1000000000' },
                sender: gaiaWallet.address,
                receiver: neutronAddr,
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
