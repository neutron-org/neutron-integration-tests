import {
  Dao,
  DaoContractLabels,
  DaoMember,
  getDaoContracts,
  getSubDaoContracts,
  toBase64String,
} from '@neutron-org/neutronjsplus/dist/dao';
import { DaoContracts } from '@neutron-org/neutronjsplus/dist/dao_types';
import { NEUTRON_DENOM, CONTRACTS } from './constants';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import { addSubdaoProposal } from '@neutron-org/neutronjsplus/dist/proposal';
import { SigningNeutronClient } from './signing_neutron_client';

export const deploySubdao = async (
  client: SigningNeutronClient,
  mainDaoCoreAddress: string,
  overrulePreProposeAddress: string,
  securityDaoAddr: string,
  closeProposalOnExecutionFailure = true,
): Promise<Dao> => {
  const coreCodeId = await client.upload(CONTRACTS.SUBDAO_CORE);
  const cw4VotingCodeId = await client.upload(CONTRACTS.CW4_VOTING);
  const cw4GroupCodeId = await client.upload(CONTRACTS.CW4_GROUP);
  const proposeCodeId = await client.upload(CONTRACTS.SUBDAO_PROPOSAL);
  const preProposeTimelockedCodeId = await client.upload(
    CONTRACTS.SUBDAO_PREPROPOSE,
  );
  const preProposeNonTimelockedPauseCodeId = await client.upload(
    CONTRACTS.SUBDAO_PREPROPOSE_NO_TIMELOCK,
  );
  const timelockCodeId = await client.upload(CONTRACTS.SUBDAO_TIMELOCK);
  const votingModuleInstantiateInfo = {
    code_id: cw4VotingCodeId,
    label: 'subDAO_Neutron_voting_module',
    msg: toBase64String({
      cw4_group_code_id: cw4GroupCodeId,
      initial_members: [
        {
          addr: client.sender,
          weight: 1,
        },
      ],
    }),
  };

  const proposeInstantiateMessage = {
    threshold: { absolute_count: { threshold: '1' } },
    max_voting_period: { height: 10 },
    allow_revoting: false,
    pre_propose_info: {
      module_may_propose: {
        info: {
          code_id: preProposeTimelockedCodeId,
          label: 'neutron.subdaos.test.proposal.single.pre_propose',
          msg: toBase64String({
            open_proposal_submission: true,
            timelock_module_instantiate_info: {
              code_id: timelockCodeId,
              label:
                'neutron.subdaos.test.proposal.single.pre_propose.timelock',
              msg: toBase64String({
                overrule_pre_propose: overrulePreProposeAddress,
              }),
            },
          }),
        },
      },
    },
    close_proposal_on_execution_failure: closeProposalOnExecutionFailure,
  };
  const proposalModuleInstantiateInfo = {
    code_id: proposeCodeId,
    label: 'neutron.subdaos.test.proposal.single',
    msg: toBase64String(proposeInstantiateMessage),
  };

  const propose2InstantiateMessage = {
    threshold: { absolute_count: { threshold: '1' } },
    max_voting_period: { height: 10 },
    allow_revoting: false,
    pre_propose_info: {
      module_may_propose: {
        info: {
          code_id: preProposeTimelockedCodeId,
          label: 'neutron.subdaos.test.proposal.single2.pre_propose',
          msg: toBase64String({
            open_proposal_submission: true,
            timelock_module_instantiate_info: {
              code_id: timelockCodeId,
              label:
                'neutron.subdaos.test.proposal.single2.pre_propose.timelock',
              msg: toBase64String({
                overrule_pre_propose: overrulePreProposeAddress,
              }),
            },
          }),
        },
      },
    },
    close_proposal_on_execution_failure: false,
  };
  const proposal2ModuleInstantiateInfo = {
    code_id: proposeCodeId,
    label: 'neutron.subdaos.test.proposal.single2',
    msg: toBase64String(propose2InstantiateMessage),
  };

  const nonTimelockedPauseProposeInstantiateMessage = {
    threshold: { absolute_count: { threshold: '1' } },
    max_voting_period: { height: 10 },
    allow_revoting: false,
    pre_propose_info: {
      module_may_propose: {
        info: {
          code_id: preProposeNonTimelockedPauseCodeId,
          label: 'neutron.subdaos.test.proposal.single_nt_pause.pre_propose',
          msg: toBase64String({
            open_proposal_submission: true,
          }),
        },
      },
    },
    close_proposal_on_execution_failure: false,
  };
  const nonTimelockedPauseProposalModuleInstantiateInfo = {
    code_id: proposeCodeId,
    label: 'neutron.subdaos.test.proposal.single_nt_pause',
    msg: toBase64String(nonTimelockedPauseProposeInstantiateMessage),
  };

  const coreInstantiateMessage = {
    name: 'SubDAO core test 1',
    description: 'serves testing purposes',
    vote_module_instantiate_info: votingModuleInstantiateInfo,
    proposal_modules_instantiate_info: [
      proposalModuleInstantiateInfo,
      proposal2ModuleInstantiateInfo,
      nonTimelockedPauseProposalModuleInstantiateInfo,
    ],
    main_dao: mainDaoCoreAddress,
    security_dao: securityDaoAddr,
  };
  const coreDaoContract = await client.instantiate(
    coreCodeId,
    coreInstantiateMessage,
    'neutron.subdaos.test.core',
  );

  return new Dao(client, await getSubDaoContracts(client, coreDaoContract));
};

export const setupSubDaoTimelockSet = async (
  user: string,
  client: SigningNeutronClient,
  mainDaoAddress: string,
  securityDaoAddr: string,
  mockMainDao: boolean,
  closeProposalOnExecutionFailure = true,
): Promise<Dao> => {
  const daoContracts = await getDaoContracts(client, mainDaoAddress);
  const subDao = await deploySubdao(
    client,
    mockMainDao ? user : daoContracts.core.address,
    daoContracts.proposals.overrule.pre_propose.address,
    securityDaoAddr,
    closeProposalOnExecutionFailure,
  );

  const mainDaoMember = new DaoMember(
    new Dao(client, daoContracts),
    client.client,
    user,
    NEUTRON_DENOM,
  );
  await addSubdaoToDao(mainDaoMember, subDao.contracts.core.address);

  return subDao;
};

export const deployNeutronDao = async (
  user: string,
  client: SigningNeutronClient,
): Promise<DaoContracts> => {
  const coreCodeId = await client.upload(CONTRACTS.DAO_CORE);
  const proposeSingleCodeId = await client.upload(
    CONTRACTS.DAO_PROPOSAL_SINGLE,
  );
  const preProposeSingleCodeId = await client.upload(
    CONTRACTS.DAO_PREPROPOSAL_SINGLE,
  );
  const proposeMultipleCodeId = await client.upload(
    CONTRACTS.DAO_PROPOSAL_MULTI,
  );
  const preProposeMultipleCodeId = await client.upload(
    CONTRACTS.DAO_PREPROPOSAL_MULTI,
  );
  const preProposeOverruleCodeId = await client.upload(
    CONTRACTS.DAO_PREPROPOSAL_OVERRULE,
  );
  const votingRegistryCodeId = await client.upload(CONTRACTS.VOTING_REGISTRY);

  const neutronVaultCodeId = await client.upload(CONTRACTS.NEUTRON_VAULT);
  const neutronVaultInitMsg = {
    owner: user,
    name: 'voting vault',
    denom: NEUTRON_DENOM,
    description: 'a simple voting vault for testing purposes',
  };

  const neutronVaultAddress = await client.instantiate(
    neutronVaultCodeId,
    neutronVaultInitMsg,
    DaoContractLabels.NEUTRON_VAULT,
  );

  const votingRegistryInstantiateInfo = {
    admin: {
      core_module: {},
    },
    code_id: votingRegistryCodeId,
    label: DaoContractLabels.DAO_VOTING_REGISTRY,
    msg: toBase64String({
      owner: user,
      voting_vaults: [neutronVaultAddress],
    }),
  };
  const preProposeInitMsg = {
    deposit_info: {
      denom: {
        token: {
          denom: {
            native: NEUTRON_DENOM,
          },
        },
      },
      amount: '1000',
      refund_policy: 'always',
    },
    open_proposal_submission: false,
  };
  const proposeSingleInitMsg = {
    allow_revoting: false,
    pre_propose_info: {
      module_may_propose: {
        info: {
          admin: {
            core_module: {},
          },
          code_id: preProposeSingleCodeId,
          msg: toBase64String(preProposeInitMsg),
          label: DaoContractLabels.DAO_PRE_PROPOSAL_SINGLE,
        },
      },
    },
    only_members_execute: false,
    max_voting_period: {
      time: 604800,
    },
    close_proposal_on_execution_failure: false,
    threshold: {
      threshold_quorum: {
        quorum: {
          percent: '0.20',
        },
        threshold: {
          majority: {},
        },
      },
    },
  };

  const proposeMultipleInitMsg = {
    allow_revoting: false,
    pre_propose_info: {
      module_may_propose: {
        info: {
          admin: {
            core_module: {},
          },
          code_id: preProposeMultipleCodeId,
          msg: toBase64String(preProposeInitMsg),
          label: DaoContractLabels.DAO_PRE_PROPOSAL_MULTIPLE,
        },
      },
    },
    only_members_execute: false,
    max_voting_period: {
      time: 604800,
    },
    close_proposal_on_execution_failure: false,
    voting_strategy: {
      single_choice: {
        quorum: {
          majority: {},
        },
      },
    },
  };

  const proposeOverruleInitMsg = {
    allow_revoting: false,
    pre_propose_info: {
      module_may_propose: {
        info: {
          admin: {
            core_module: {},
          },
          code_id: preProposeOverruleCodeId,
          msg: toBase64String({}),
          label: DaoContractLabels.DAO_PRE_PROPOSAL_OVERRULE,
        },
      },
    },
    only_members_execute: false,
    max_voting_period: {
      height: 10,
    },
    close_proposal_on_execution_failure: false,
    threshold: {
      absolute_percentage: {
        percentage: {
          percent: '0.10',
        },
      },
    },
  };

  const coreInstantiateMessage = {
    name: 'SubDAO core test 1',
    description: 'serves testing purposes',
    initial_items: null,
    voting_registry_module_instantiate_info: votingRegistryInstantiateInfo,
    proposal_modules_instantiate_info: [
      {
        admin: {
          core_module: {},
        },
        code_id: proposeSingleCodeId,
        label: DaoContractLabels.DAO_PROPOSAL_SINGLE,
        msg: toBase64String(proposeSingleInitMsg),
      },
      {
        admin: {
          core_module: {},
        },
        code_id: proposeMultipleCodeId,
        label: DaoContractLabels.DAO_PROPOSAL_MULTIPLE,
        msg: toBase64String(proposeMultipleInitMsg),
      },
      {
        admin: {
          core_module: {},
        },
        code_id: proposeSingleCodeId,
        label: DaoContractLabels.DAO_PROPOSAL_OVERRULE,
        msg: toBase64String(proposeOverruleInitMsg),
      },
    ],
  };
  const daoCoreContract = await client.instantiate(
    coreCodeId,
    coreInstantiateMessage,
    DaoContractLabels.DAO_CORE,
  );
  await waitBlocks(1, client);
  return getDaoContracts(client, daoCoreContract);
};

export const addSubdaoToDao = async (member: DaoMember, subDaoCore: string) => {
  const p = await member.submitSingleChoiceProposal(
    'add subdao',
    '',
    [addSubdaoProposal(member.dao.contracts.core.address, subDaoCore)],
    '1000',
  );
  await member.voteYes(p);
  await member.executeProposalWithAttempts(p);
};
