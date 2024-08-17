import { LocalState } from '../../helpers/local_state';
import '@neutron-org/neutronjsplus';
import { inject } from 'vitest';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { createRPCQueryClient as createNeutronClient } from '@neutron-org/neutronjs/neutron/rpc.query';
import { NeutronQuerier } from '@neutron-org/neutronjs/querier_types';
import { ProtobufRpcClient } from '@cosmjs/stargate';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import config from '../../config.json';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus/dist/constants';
import { Wallet } from '../../helpers/wallet';

describe('Neutron / Parameters', () => {
  let testState: LocalState;

  let neutronWallet: Wallet;
  let neutronClient: SigningNeutronClient;
  let daoMember1: DaoMember;
  let dao: Dao;

  let neutronRpcClient: ProtobufRpcClient;

  let neutronQuerier: NeutronQuerier;

  beforeAll(async () => {
    testState = await LocalState.create(config, inject('mnemonics'));
    neutronWallet = testState.wallets.neutron.demo1;
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );
    neutronRpcClient = await testState.rpcClient('neutron');
    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient,
      neutronRpcClient,
    );
    const daoContracts = await getDaoContracts(neutronClient, daoCoreAddress);

    neutronQuerier = await createNeutronClient({
      rpcEndpoint: testState.rpcNeutron,
    });

    // const oldAdmins = await neutronQuerier.cosmos.adminmodule.adminmodule.admins();
    // chainManagerAddress = admins.admins[0];

    dao = new Dao(neutronClient, daoContracts);
    daoMember1 = new DaoMember(
      dao,
      neutronClient.client,
      neutronWallet.address,
      NEUTRON_DENOM,
    );

    await daoMember1.bondFunds('500000');
    await neutronClient.getWithAttempts(
      async () => await dao.queryVotingPower(daoMember1.user),
      async (response) => response.power > 0,
      20,
    );

    const oldAdmins =
      await neutronQuerier.cosmos.adminmodule.adminmodule.admins();

    console.log('oldAdmins: ' + JSON.stringify(oldAdmins));
  });

  describe('pass add admin proposal', () => {
    test('create/vote/execute proposal', async () => {
      const message = {
        stargate: {
          type_url: '/cosmos.adminmodule.adminmodule.MsgAddAdmin',
          value:
            // 'CkJuZXV0cm9uMXN1aGdmNXN2aHU0dXNydXJ2eHpsZ241NGtzeG1uOGdsamFyanR4cW5hcHY4a2pucDRucnN0ZHh2ZmYSQm5ldXRyb24xcHI4emp4ZW1scTk1amVyMmU1bnYzdHNjbG53d3R1NjY5M2ZlcjU3eWp2ZXlhOTZtaDA1cXgzZXNjbA==',
            'CkJuZXV0cm9uMXl3NHh2dGM0M21lOXNjcWZyMmpyMmd6dmN4ZDNhOXk0ZXE3Z2F1a3JldWd3MnlkMmY4dHM4ZzMwZnESQm5ldXRyb24xcHI4emp4ZW1scTk1amVyMmU1bnYzdHNjbG53d3R1NjY5M2ZlcjU3eWp2ZXlhOTZtaDA1cXgzZXNjbA==',
        },
      };

      const messages = [message];
      const proposalId = await daoMember1.submitSingleChoiceProposal(
        'proptitle',
        'propdesciption',
        messages,
        '1000',
      );
      console.log('proposal submitted: ' + proposalId);
      await daoMember1.voteYes(proposalId);
      console.log('proposal voted');
      await dao.checkPassedProposal(proposalId);
      console.log('proposal passed');
      await daoMember1.executeProposalWithAttempts(proposalId);
      console.log('proposal executed');

      const propError = await neutronClient.queryContractSmart(
        dao.contracts.proposals['single'].address,
        {
          proposal_execution_error: {
            proposal_id: proposalId,
          },
        },
      );
      console.log('propError: ' + propError);

      const newAdmins =
        await neutronQuerier.cosmos.adminmodule.adminmodule.admins();
      console.log('new admins: ' + JSON.stringify(newAdmins.admins));
    });
  });
});
