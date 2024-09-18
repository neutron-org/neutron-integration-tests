import {Registry} from '@cosmjs/proto-signing';
import {RunnerTestSuite, inject} from 'vitest';
import {LocalState} from '../../helpers/local_state';
import {SigningNeutronClient} from '../../helpers/signing_neutron_client';
import {MsgTransfer as GaiaMsgTransfer} from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import {MsgTransfer as NeutronMsgTransfer} from '@neutron-org/neutronjs/ibc/applications/transfer/v1/tx';
import {defaultRegistryTypes} from '@cosmjs/stargate';
import {QueryFailuresResponse} from '@neutron-org/neutronjs/neutron/contractmanager/query';
import {QueryClientImpl as BankQueryClient} from '@neutron-org/neutronjs/cosmos/bank/v1beta1/query.rpc.Query';
import {QueryClientImpl as IbcQueryClient} from '@neutron-org/neutronjs/ibc/applications/transfer/v1/query.rpc.Query';
import {
  COSMOS_DENOM,
  IBC_RELAYER_NEUTRON_ADDRESS,
  CONTRACTS,
  NEUTRON_DENOM,
} from '../../helpers/constants';
import {SigningStargateClient} from '@cosmjs/stargate';
import {waitBlocks} from '@neutron-org/neutronjsplus/dist/wait';
import {Wallet} from '../../helpers/wallet';
import {getIBCDenom} from '@neutron-org/neutronjsplus/dist/cosmos';
import config from '../../config.json';
import {QueryClientImpl as ContractManagerQuery} from '@neutron-org/neutronjs/neutron/contractmanager/query.rpc.Query';
import {Dao, DaoMember, getDaoContracts, getNeutronDAOCore} from "@neutron-org/neutronjsplus/dist/dao";
import {ADMIN_MODULE_ADDRESS} from "@neutron-org/neutronjsplus/dist/constants";
import {createRPCQueryClient as createNeutronClient} from "@neutron-org/neutronjs/neutron/rpc.query";
import {NeutronQuerier} from "@neutron-org/neutronjs/querier_types";
import {QueryParamsResponse} from "@neutron-org/neutronjs/neutron/interchainqueries/query";


const TRANSFER_CHANNEL = 'channel-0';
const IBC_TOKEN_DENOM =
  'ibc/4E41ED8F3DCAEA15F4D6ADC6EDD7C04A676160735C9710B904B7BF53525B56D6';
const UATOM_IBC_TO_NEUTRON_DENOM =
  'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2';

describe('Neutron / IBC transfer', () => {
  let testState: LocalState;

  let neutronClient: SigningNeutronClient;
  let gaiaClient: SigningStargateClient;
  let neutronWallet: Wallet;
  let gaiaWallet: Wallet;
  let gaiaWallet2: Wallet;

  let daoMember1: DaoMember;
  let mainDao: Dao;
  let chainManagerAddress: string;

  let rlContract: string;

  let contractManagerQuerier: ContractManagerQuery;
  let bankQuerier: BankQueryClient;
  let ibcQuerier: IbcQueryClient;
  let neutronQuerier: NeutronQuerier;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );
    gaiaWallet = await testState.nextWallet('cosmos');
    gaiaWallet2 = await testState.nextWallet('cosmos');
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.directwallet,
      {registry: new Registry(defaultRegistryTypes)},
    );

    let neutronRpcClient = await testState.neutronRpcClient();

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
    contractManagerQuerier = new ContractManagerQuery(neutronRpcClient);
    bankQuerier = new BankQueryClient(neutronRpcClient);
    ibcQuerier = new IbcQueryClient(neutronRpcClient);
    neutronQuerier = await createNeutronClient({
      rpcEndpoint: testState.rpcNeutron,
    });
    const admins = await neutronQuerier.cosmos.adminmodule.adminmodule.admins();
    chainManagerAddress = admins.admins[0];
    neutronClient.waitBlocks(20)
  });



  describe('No limit', () => {
    test('IBC transfer without any limits', async () => {
      const fee = {
        gas: '200000',
        amount: [{denom: NEUTRON_DENOM, amount: '1000'}],
      };
      const res = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: NeutronMsgTransfer.typeUrl,
            value: NeutronMsgTransfer.fromPartial({
              sourcePort: 'transfer',
              sourceChannel: TRANSFER_CHANNEL,
              token: {denom: NEUTRON_DENOM, amount: '1000'},
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
  });


  describe('Contracts', () => {
    test('store and instantiate RL contract', async () => {
      let quota = buildChannelQuota('weekly', TRANSFER_CHANNEL, NEUTRON_DENOM, 604800, 1, 1)
      rlContract = await neutronClient.create(CONTRACTS.RATE_LIMITER, {
        gov_module: ADMIN_MODULE_ADDRESS,
        ibc_module: ADMIN_MODULE_ADDRESS,
        paths: [quota]
      });
    });
  });

  describe('prepare: bond funds', () => {
    test('bond form wallet 1', async () => {
      await daoMember1.bondFunds('10000');
      await neutronClient.getWithAttempts(
        async () => await mainDao.queryVotingPower(daoMember1.user),
        async (response) => response.power == 10000,
        20,
      );
    });

    test('IBC transfer without any limits', async () => {
      const fee = {
        gas: '200000',
        amount: [{denom: NEUTRON_DENOM, amount: '1000'}],
      };
      const res = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: NeutronMsgTransfer.typeUrl,
            value: NeutronMsgTransfer.fromPartial({
              sourcePort: 'transfer',
              sourceChannel: TRANSFER_CHANNEL,
              token: {denom: NEUTRON_DENOM, amount: '1000'},
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
      // expect(res.code).toEqual(0);
      console.log(res.rawLog)
    });

    // describe('Funds transfer', () => {
    //   const proposalId = 1;
    //   test('create proposal', async () => {
    //     await daoMember1.submitUpdateParamsRateLimitProposal(
    //       chainManagerAddress,
    //       'Proposal #1',
    //       'Param change proposal. Setup rate limit contract',
    //       {
    //         contract_address: rlContract
    //       },
    //       '1000',
    //     );
    //   });
    //   test('vote YES', async () => {
    //     await daoMember1.voteYes(proposalId);
    //
    //   });
    //   test('check if proposal is passed', async () => {
    //     await mainDao.checkPassedProposal(proposalId);
    //   });
    //   test('execute passed proposal', async () => {
    //     await daoMember1.executeProposalWithAttempts(proposalId);
    //   });
    // });

    describe('Rate limit params proposal', () => {
      const proposalId = 2;
      test('create proposal', async () => {
        await daoMember1.submitUpdateParamsRateLimitProposal(
          chainManagerAddress,
          'Proposal #1',
          'Param change proposal. Setup rate limit contract',
          {
            contract_address: rlContract
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
      test('add limit', async () => {
        // let quota = buildChannelQuota('weekly', TRANSFER_CHANNEL, NEUTRON_DENOM, 604800, 1, 1)
        // await neutronClient.execute(rlContract
        //   , {
        //     add_path: quota,
        //   });
      });
      test('IBC transfer to limit', async () => {
        const fee = {
          gas: '200000',
          amount: [{denom: NEUTRON_DENOM, amount: '1000'}],
        };
        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: NeutronMsgTransfer.typeUrl,
              value: NeutronMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: {denom: NEUTRON_DENOM, amount: '10000000000000'},
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
      test('Unset limit', async () => {
        // let quota = buildChannelQuota('weekly', TRANSFER_CHANNEL, NEUTRON_DENOM, 604800, 1, 1)
        await neutronClient.execute(rlContract, {
          remove_path: {
            channel_id: TRANSFER_CHANNEL,
            denom: NEUTRON_DENOM
          },
        });
      });
      test('IBC transfer:  no more limiting', async () => {
        const fee = {
          gas: '200000',
          amount: [{denom: NEUTRON_DENOM, amount: '1000'}],
        };
        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: NeutronMsgTransfer.typeUrl,
              value: NeutronMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: {denom: NEUTRON_DENOM, amount: '1000'},
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
      test('add limit', async () => {
        await neutronClient.waitBlocks(10);
        const balance = await gaiaClient.getBalance(
          gaiaWallet.address,
          IBC_TOKEN_DENOM,
        );
        expect(balance.amount).toEqual('1000');
      });
      test('IBC transfer to limit', async () => {
        const fee = {
          gas: '200000',
          amount: [{denom: NEUTRON_DENOM, amount: '1000'}],
        };
        const res = await neutronClient.signAndBroadcast(
          [
            {
              typeUrl: NeutronMsgTransfer.typeUrl,
              value: NeutronMsgTransfer.fromPartial({
                sourcePort: 'transfer',
                sourceChannel: TRANSFER_CHANNEL,
                token: {denom: NEUTRON_DENOM, amount: '1000'},
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
      test('Unset limit', async () => {
        await neutronClient.waitBlocks(10);
        const balance = await gaiaClient.getBalance(
          gaiaWallet.address,
          IBC_TOKEN_DENOM,
        );
        expect(balance.amount).toEqual('1000');
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
  recvPercentage: number
): object {
  return {
    channel_id: channel,
    denom: denom,
    quotas: [
      {
        name: name,
        duration: duration,
        send_recv: [sendPercentage, recvPercentage]
      }
    ]
  };
}

function buildRestrictionMsg(denom: string, acceptedChannel: string): object {
  return {
    set_denom_restrictions: {
      denom: denom,
      allowed_channels: [acceptedChannel]
    }
  }
}

