import { wrapMsg } from '@neutron-org/neutronjsplus/dist/cosmos';
import {
  Dao,
  DaoContracts,
  getDaoContracts,
  getSubDaoContracts,
} from '@neutron-org/neutronjsplus/dist/dao';
import { WasmWrapper } from './wasmClient';
import { NEUTRON_CONTRACT } from './constants';

export const deploySubdao = async (
  client: WasmWrapper,
  mainDaoCoreAddress: string,
  overrulePreProposeAddress: string,
  securityDaoAddr: string,
  closeProposalOnExecutionFailure = true,
): Promise<Dao> => {
  const coreCodeId = await client.upload(NEUTRON_CONTRACT.SUBDAO_CORE);
  const cw4VotingCodeId = await client.upload(NEUTRON_CONTRACT.CW4_VOTING);
  const cw4GroupCodeId = await client.upload(NEUTRON_CONTRACT.CW4_GROUP);
  const proposeCodeId = await client.upload(NEUTRON_CONTRACT.SUBDAO_PROPOSAL);
  const preProposeTimelockedCodeId = await client.upload(
    NEUTRON_CONTRACT.SUBDAO_PREPROPOSE,
  );
  const preProposeNonTimelockedPauseCodeId = await client.upload(
    NEUTRON_CONTRACT.SUBDAO_PREPROPOSE_NO_TIMELOCK,
  );
  const timelockCodeId = await client.upload(NEUTRON_CONTRACT.SUBDAO_TIMELOCK);
  const votingModuleInstantiateInfo = {
    code_id: cw4VotingCodeId,
    label: 'subDAO_Neutron_voting_module',
    msg: wrapMsg({
      cw4_group_code_id: cw4GroupCodeId,
      initial_members: [
        {
          addr: client.wallet.address,
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
          msg: wrapMsg({
            open_proposal_submission: true,
            timelock_module_instantiate_info: {
              code_id: timelockCodeId,
              label:
                'neutron.subdaos.test.proposal.single.pre_propose.timelock',
              msg: wrapMsg({
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
    msg: wrapMsg(proposeInstantiateMessage),
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
          msg: wrapMsg({
            open_proposal_submission: true,
            timelock_module_instantiate_info: {
              code_id: timelockCodeId,
              label:
                'neutron.subdaos.test.proposal.single2.pre_propose.timelock',
              msg: wrapMsg({
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
    msg: wrapMsg(propose2InstantiateMessage),
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
          msg: wrapMsg({
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
    msg: wrapMsg(nonTimelockedPauseProposeInstantiateMessage),
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

  return new Dao(client.client, await getSubDaoContracts(client, coreDaoContract));
};

export const setupSubDaoTimelockSet = async (
  client: WasmWrapper,
  mainDaoAddress: string,
  securityDaoAddr: string,
  mockMainDao: boolean,
  closeProposalOnExecutionFailure = true,
): Promise<Dao> => {
  const daoContracts = await getDaoContracts(cm.chain, mainDaoAddress);
  const subDao = await deploySubdao(
    cm,
    mockMainDao ? cm.wallet.address : daoContracts.core.address,
    daoContracts.proposals.overrule.pre_propose.address,
    securityDaoAddr,
    closeProposalOnExecutionFailure,
  );

  const mainDaoMember = new DaoMember(cm, new Dao(cm.chain, daoContracts));
  await mainDaoMember.addSubdaoToDao(subDao.contracts.core.address);

  return subDao;
};

// TODO: optional: move to neutron-integration-tests helpers
/**
 * @deprecated since version 0.5.0
 */
export const deployNeutronDao = async (
  // cm: WalletWrapper,
): Promise<DaoContracts> => {
  const coreCodeId = await client.upload(NEUTRON_CONTRACT.DAO_CORE);
  const proposeSingleCodeId = await client.upload(
    NEUTRON_CONTRACT.DAO_PROPOSAL_SINGLE,
  );
  const preProposeSingleCodeId = await client.upload(
    NEUTRON_CONTRACT.DAO_PREPROPOSAL_SINGLE,
  );
  const proposeMultipleCodeId = await client.upload(
    NEUTRON_CONTRACT.DAO_PROPOSAL_MULTI,
  );
  const preProposeMultipleCodeId = await client.upload(
    NEUTRON_CONTRACT.DAO_PREPROPOSAL_MULTI,
  );
  const preProposeOverruleCodeId = await client.upload(
    NEUTRON_CONTRACT.DAO_PREPROPOSAL_OVERRULE,
  );
  const votingRegistryCodeId = await client.upload(
    NEUTRON_CONTRACT.VOTING_REGISTRY,
  );

  const neutronVaultCodeId = await client.upload(NEUTRON_CONTRACT.NEUTRON_VAULT);
  const neutronVaultInitMsg = {
    owner: cm.wallet.address,
    name: 'voting vault',
    denom: cm.chain.denom,
    description: 'a simple voting vault for testing purposes',
  };

  const neutronVaultAddress = await cm.instantiateContract(
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
    msg: wrapMsg({
      owner: cm.wallet.address,
      voting_vaults: [neutronVaultAddress],
    }),
  };
  const preProposeInitMsg = {
    deposit_info: {
      denom: {
        token: {
          denom: {
            native: cm.chain.denom,
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
          msg: wrapMsg(preProposeInitMsg),
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
          msg: wrapMsg(preProposeInitMsg),
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
          msg: wrapMsg({}),
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
        msg: wrapMsg(proposeSingleInitMsg),
      },
      {
        admin: {
          core_module: {},
        },
        code_id: proposeMultipleCodeId,
        label: DaoContractLabels.DAO_PROPOSAL_MULTIPLE,
        msg: wrapMsg(proposeMultipleInitMsg),
      },
      {
        admin: {
          core_module: {},
        },
        code_id: proposeSingleCodeId,
        label: DaoContractLabels.DAO_PROPOSAL_OVERRULE,
        msg: wrapMsg(proposeOverruleInitMsg),
      },
    ],
  };
  const daoCoreContract = await cm.instantiateContract(
    coreCodeId,
    coreInstantiateMessage,
    DaoContractLabels.DAO_CORE,
  );
  await cm.chain.waitBlocks(1);
  return getDaoContracts(cm.chain, daoCoreContract);
};

