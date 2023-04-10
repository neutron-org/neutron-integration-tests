import axios from 'axios';
import {
  CosmosWrapper,
  createBankMessage,
  getEventAttribute,
  WalletWrapper,
  wrapMsg,
} from './cosmos';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { getWithAttempts } from './wait';
import {
  MultiChoiceOption,
  NeutronContract,
  SingleChoiceProposal,
  TotalPowerAtHeightResponse,
  VotingPowerAtHeightResponse,
} from './types';
import {
  addSubdaoProposal,
  addSchedule,
  clearAdminProposal,
  clientUpdateProposal,
  paramChangeProposal,
  ParamChangeProposalInfo,
  pinCodesProposal,
  removeSchedule,
  SendProposalInfo,
  unpinCodesProposal,
  updateAdminProposal,
  upgradeProposal,
} from './proposal';

export type ProposalModule = {
  address: string;
  prefix: string;
  status: string;
};

export type TimeLockSingleChoiceProposal = {
  id: number;
  msgs: Array<Record<string, any>>; // Vec<CosmosMsg<NeutronMsg>>
  status: string;
};

export type TimelockConfig = {
  owner: string;
  overrule_pre_propose: string;
  subdao: string;
};

export type TimelockProposalListResponse = {
  proposals: Array<TimeLockSingleChoiceProposal>;
};

export type SubDaoConfig = {
  name: string;
  description: string;
  dao_uri: string;
  main_dao: string;
  security_dao: string;
};

export type LockdropVaultConfig = {
  name: string;
  description: string;
  lockdrop_contract: string;
  owner: string;
  manager: string;
};

export type VaultBondingStatus = {
  bonding_enabled: string;
  unbondable_abount: string;
  height: number;
};

export type VotingVaultsModule = {
  address: string;
  voting_vaults: {
    ntrn_vault: {
      address: string;
    };
    lockdrop_vault: {
      address: string;
    };
  };
};

export type VotingCw4Module = {
  address: string;
  cw4group: {
    address: string;
  };
};

export const DaoContractLabels = {
  DAO_CORE: 'DAO',
  NEUTRON_VAULT: 'DAO_Neutron_voting_vault',
  LOCKDROP_VAULT: 'DAO_Neutron_lockdrop_vault',
  TREASURY: 'Treasury',
  DISTRIBUTION: 'Distribution',
  DAO_PRE_PROPOSAL_SINGLE: 'neutron',
  DAO_PRE_PROPOSAL_MULTIPLE: 'neutron',
  DAO_PRE_PROPOSAL_OVERRULE: 'neutron',
  DAO_VOTING_REGISTRY: 'DAO_Neutron_voting_registry',
  DAO_PROPOSAL_SINGLE: 'DAO_Neutron_cw-proposal-single',
  DAO_PROPOSAL_MULTIPLE: 'DAO_Neutron_cw-proposal-multiple',
  DAO_PROPOSAL_OVERRULE: 'DAO_Neutron_cw-proposal-overrule',
};

export type DaoContracts = {
  name: string;
  core: {
    address: string;
  };
  proposal_modules: {
    single: {
      address: string;
      pre_proposal_module: {
        address: string;
        timelock_module?: {
          address: string;
        };
      };
    };
    multiple?: {
      address: string;
      pre_proposal_module: {
        address: string;
      };
    };
    overrule?: {
      address: string;
      pre_proposal_module: {
        address: string;
      };
    };
  };
  voting_module: VotingVaultsModule | VotingCw4Module;
  subdaos?: DaoContracts[];
};

export const getVotingModule = async (
  cm: CosmosWrapper,
  dao_address: string,
): Promise<string> =>
  await cm.queryContract<string>(dao_address, {
    voting_module: {},
  });

export const getVotingVaults = async (
  cm: CosmosWrapper,
  voting_module_address: string,
): Promise<VotingVaultsModule['voting_vaults']> => {
  const voting_vaults = await cm.queryContract<
    [{ address: string; name: string }]
  >(voting_module_address, { voting_vaults: {} });
  const ntrn_vault_address = voting_vaults.filter(
    (x) => x.name == 'voting vault',
  )[0]?.address;
  const lockdrop_vault_address = voting_vaults.filter(
    (x) => x.name == 'lockdrop vault',
  )[0]?.address;

  return {
    ntrn_vault: { address: ntrn_vault_address },
    lockdrop_vault: { address: lockdrop_vault_address },
  };
};

export const getDaoContracts = async (
  cm: CosmosWrapper,
  dao_address: string,
): Promise<DaoContracts> => {
  const config = await cm.queryContract<{ name: string }>(dao_address, {
    config: {},
  });

  const voting_module_address = await getVotingModule(cm, dao_address);
  const voting_vaults = await getVotingVaults(cm, voting_module_address);

  const proposal_modules = await cm.queryContract<{ address: string }[]>(
    dao_address,
    { proposal_modules: {} },
  );

  let proposalSingleAddress = '';
  let proposalMultipleAddress = '';
  let proposalOverruleAddress = '';

  let preProposalSingleAddress = '';
  let preProposalMultipleAddress = '';
  let preProposalOverruleAddress = '';

  for (const proposal_module of proposal_modules) {
    const proposalContractInfo = await cm.getContractInfo(
      proposal_module.address,
    );
    const preProposalContract = await cm.queryContract<{
      Module: { addr: string };
    }>(proposal_module.address, { proposal_creation_policy: {} });
    switch (proposalContractInfo['contract_info']['label']) {
      case DaoContractLabels.DAO_PROPOSAL_OVERRULE:
        proposalOverruleAddress = proposal_module.address;
        preProposalOverruleAddress = preProposalContract.Module.addr;
        break;
      case DaoContractLabels.DAO_PROPOSAL_MULTIPLE:
        proposalMultipleAddress = proposal_module.address;
        preProposalMultipleAddress = preProposalContract.Module.addr;
        break;
      case DaoContractLabels.DAO_PROPOSAL_SINGLE:
        proposalSingleAddress = proposal_module.address;
        preProposalSingleAddress = preProposalContract.Module.addr;
        break;
    }
  }

  const subdaosList = await cm.queryContract<{ addr: string }[]>(dao_address, {
    list_sub_daos: {},
  });

  const subdaos = [];
  for (const subdao of subdaosList) {
    subdaos.push(await getSubDaoContracts(cm, subdao.addr));
  }

  return {
    name: config.name,
    core: { address: dao_address },
    proposal_modules: {
      single: {
        address: proposalSingleAddress,
        pre_proposal_module: { address: preProposalSingleAddress },
      },
      multiple: {
        address: proposalMultipleAddress,
        pre_proposal_module: { address: preProposalMultipleAddress },
      },
      overrule: {
        address: proposalOverruleAddress,
        pre_proposal_module: { address: preProposalOverruleAddress },
      },
    },
    voting_module: {
      address: voting_module_address,
      voting_vaults: voting_vaults,
    },
    subdaos,
  };
};

export const getSubDaoContracts = async (
  cm: CosmosWrapper,
  dao_address: string,
): Promise<DaoContracts> => {
  const config = await cm.queryContract<{ name: string }>(dao_address, {
    config: {},
  });

  const voting_module_address = await cm.queryContract<string>(dao_address, {
    voting_module: {},
  });
  const cw4_group_address = await cm.queryContract<string>(
    voting_module_address,
    {
      group_contract: {},
    },
  );

  const proposal_modules = await cm.queryContract<[{ address: string }]>(
    dao_address,
    { proposal_modules: {} },
  );

  expect(proposal_modules).toHaveLength(1);
  const proposal_module = proposal_modules[0];

  const preProposalContract = await cm.queryContract<{
    Module: { addr: string };
  }>(proposal_module.address, { proposal_creation_policy: {} });
  const proposalSingleAddress = proposal_module.address;
  const preProposalSingleAddress = preProposalContract.Module.addr;

  let timelockAddr;
  try {
    timelockAddr = await cm.queryContract<string>(preProposalSingleAddress, {
      query_extension: { msg: { timelock_address: {} } },
    });
  } catch (e) {
    timelockAddr = null;
  }

  return {
    name: config.name,
    core: {
      address: dao_address,
    },
    proposal_modules: {
      single: {
        address: proposalSingleAddress,
        pre_proposal_module: {
          address: preProposalSingleAddress,
          timelock_module: {
            address: timelockAddr,
          },
        },
      },
    },
    voting_module: {
      address: voting_module_address,
      cw4group: {
        address: cw4_group_address,
      },
    },
  };
};

export const getReserveContract = async (
  cm: CosmosWrapper,
): Promise<string> => {
  const url = `${cm.sdk.url}/cosmos/params/v1beta1/params?subspace=feeburner&key=ReserveAddress`;
  const resp = await axios.get<{
    param: { value: string };
  }>(url);
  return JSON.parse(resp.data.param.value);
};

export class Dao {
  readonly chain: CosmosWrapper;
  readonly contracts: DaoContracts;

  constructor(cm: CosmosWrapper, contracts: DaoContracts) {
    this.chain = cm;
    this.contracts = contracts;
  }

  async checkPassedProposal(proposalId: number) {
    await getWithAttempts(
      this.chain.blockWaiter,
      async () => await this.queryProposal(proposalId),
      async (response) => response.proposal.status === 'passed',
      20,
    );
  }

  async checkPassedMultiChoiceProposal(proposalId: number) {
    await getWithAttempts(
      this.chain.blockWaiter,
      async () => await this.queryMultiChoiceProposal(proposalId),
      async (response) => response.proposal.status === 'passed',
      20,
    );
  }

  async checkExecutedMultiChoiceProposal(proposalId: number) {
    await getWithAttempts(
      this.chain.blockWaiter,
      async () => await this.queryMultiChoiceProposal(proposalId),
      async (response) => response.proposal.status === 'executed',
      20,
    );
  }

  async queryMultiChoiceProposal(proposalId: number): Promise<any> {
    return await this.chain.queryContract<any>(
      this.contracts.proposal_modules.multiple.address,
      {
        proposal: {
          proposal_id: proposalId,
        },
      },
    );
  }

  async queryProposal(proposalId: number): Promise<SingleChoiceProposal> {
    return await this.chain.queryContract<SingleChoiceProposal>(
      this.contracts.proposal_modules.single.address,
      {
        proposal: {
          proposal_id: proposalId,
        },
      },
    );
  }
  async queryOverruleProposal(
    proposalId: number,
  ): Promise<SingleChoiceProposal> {
    return await this.chain.queryContract<SingleChoiceProposal>(
      this.contracts.proposal_modules.overrule.address,
      {
        proposal: {
          proposal_id: proposalId,
        },
      },
    );
  }

  async queryTotalVotingPower(): Promise<TotalPowerAtHeightResponse> {
    return await this.chain.queryContract<TotalPowerAtHeightResponse>(
      this.contracts.core.address,
      {
        total_power_at_height: {},
      },
    );
  }

  async queryVotingPower(addr: string): Promise<VotingPowerAtHeightResponse> {
    return await this.chain.queryContract<VotingPowerAtHeightResponse>(
      this.contracts.core.address,
      {
        voting_power_at_height: {
          address: addr,
        },
      },
    );
  }

  async makeSingleChoiceProposalPass(
    loyalVoters: DaoMember[],
    title: string,
    description: string,
    msgs: any[],
    deposit: string,
  ) {
    const proposal_id = await loyalVoters[0].submitSingleChoiceProposal(
      title,
      description,
      msgs,
      deposit,
    );
    await loyalVoters[0].user.chain.blockWaiter.waitBlocks(1);

    for (const voter of loyalVoters) {
      await voter.voteYes(proposal_id);
    }
    await loyalVoters[0].executeProposal(proposal_id);

    await getWithAttempts(
      loyalVoters[0].user.chain.blockWaiter,
      async () => await this.queryProposal(proposal_id),
      async (response) => response.proposal.status === 'executed',
      20,
    );
  }

  async getTimelockedProposal(
    proposal_id: number,
  ): Promise<TimeLockSingleChoiceProposal> {
    return this.chain.queryContract<TimeLockSingleChoiceProposal>(
      this.contracts.proposal_modules.single.pre_proposal_module.timelock_module
        .address,
      {
        proposal: {
          proposal_id: proposal_id,
        },
      },
    );
  }

  async getSubDaoList(): Promise<string[]> {
    const res = await this.chain.queryContract<{ addr: string }[]>(
      this.contracts.core.address,
      {
        list_sub_daos: {},
      },
    );
    return res.map((x) => x.addr);
  }

  async getOverruleProposalId(
    timelock_address: string,
    subdao_proposal_id: number,
  ): Promise<number> {
    const res = await this.chain.queryContract<number>(
      this.contracts.proposal_modules.overrule.pre_proposal_module.address,
      {
        query_extension: {
          msg: {
            overrule_proposal_id: {
              timelock_address,
              subdao_proposal_id,
            },
          },
        },
      },
    );
    return res;
  }
}

export class DaoMember {
  readonly user: WalletWrapper;
  readonly dao: Dao;

  constructor(cm: WalletWrapper, dao: Dao) {
    this.user = cm;
    this.dao = dao;
  }

  /**
   * voteYes  vote 'yes' for given proposal.
   */
  async voteYes(proposalId: number): Promise<InlineResponse20075TxResponse> {
    return await this.user.executeContract(
      this.dao.contracts.proposal_modules.single.address,
      JSON.stringify({ vote: { proposal_id: proposalId, vote: 'yes' } }),
    );
  }

  /**
   * voteNo  vote 'no' for given proposal.
   */
  async voteNo(proposalId: number): Promise<InlineResponse20075TxResponse> {
    return await this.user.executeContract(
      this.dao.contracts.proposal_modules.single.address,
      JSON.stringify({ vote: { proposal_id: proposalId, vote: 'no' } }),
    );
  }

  /**
   * voteForOption  vote for option for given multi choice proposal.
   */
  async voteForOption(
    proposalId: number,
    optionId: number,
  ): Promise<InlineResponse20075TxResponse> {
    return await this.user.executeContract(
      this.dao.contracts.proposal_modules.multiple.address,
      JSON.stringify({
        vote: { proposal_id: proposalId, vote: { option_id: optionId } },
      }),
    );
  }

  async bondFunds(amount: string): Promise<InlineResponse20075TxResponse> {
    const vaultAddress = (
      this.dao.contracts.voting_module as VotingVaultsModule
    ).voting_vaults.ntrn_vault.address;
    return await this.user.executeContract(
      vaultAddress,
      JSON.stringify({
        bond: {},
      }),
      [{ denom: this.user.chain.denom, amount: amount }],
    );
  }

  /**
   * submitSingleChoiceProposal creates proposal with given message.
   */
  async submitSingleChoiceProposal(
    title: string,
    description: string,
    msgs: any[],
    deposit = '',
  ): Promise<number> {
    let depositFunds = [];
    if (deposit !== '') {
      depositFunds = [{ denom: this.user.chain.denom, amount: deposit }];
    }
    const proposalTx = await this.user.executeContract(
      this.dao.contracts.proposal_modules.single.pre_proposal_module.address,
      JSON.stringify({
        propose: {
          msg: {
            propose: {
              title: title,
              description: description,
              msgs,
            },
          },
        },
      }),
      depositFunds,
    );

    const attribute = getEventAttribute(
      (proposalTx as any).events,
      'wasm',
      'proposal_id',
    );

    const proposalId = parseInt(attribute);
    expect(proposalId).toBeGreaterThanOrEqual(0);
    return proposalId;
  }

  /**
   * executeProposal executes given proposal.
   */
  async executeProposal(
    proposalId: number,
  ): Promise<InlineResponse20075TxResponse> {
    return await this.user.executeContract(
      this.dao.contracts.proposal_modules.single.address,
      JSON.stringify({ execute: { proposal_id: proposalId } }),
    );
  }

  async executeProposalWithAttempts(proposalId: number) {
    await this.executeProposal(proposalId);
    await getWithAttempts(
      this.user.chain.blockWaiter,
      async () => await this.dao.queryProposal(proposalId),
      async (response) => response.proposal.status === 'executed',
      20,
    );
  }

  async executeMultiChoiceProposalWithAttempts(proposalId: number) {
    await this.executeMultiChoiceProposal(proposalId);
    await getWithAttempts(
      this.user.chain.blockWaiter,
      async () => await this.dao.queryMultiChoiceProposal(proposalId),
      async (response) => response.proposal.status === 'executed',
      20,
    );
  }

  /**
   * executeMultiChoiceProposal executes given multichoice proposal.
   */
  async executeMultiChoiceProposal(proposalId: number): Promise<any> {
    return await this.user.executeContract(
      this.dao.contracts.proposal_modules.multiple.address,
      JSON.stringify({ execute: { proposal_id: proposalId } }),
    );
  }

  /**
   * submitSendProposal creates proposal to send funds from DAO core contract for given address.
   */
  async submitSendProposal(
    title: string,
    description: string,
    dest: { recipient: string; amount: number; denom: string }[],
    deposit = '',
  ): Promise<number> {
    const messages = dest.map((d) =>
      createBankMessage(d.recipient, d.amount, d.denom),
    );
    return await this.submitSingleChoiceProposal(
      title,
      description,
      messages,
      deposit,
    );
  }

  /**
   * submitParameterChangeProposal creates parameter change proposal.
   */
  async submitParameterChangeProposal(
    title: string,
    description: string,
    subspace: string,
    key: string,
    value: string,
    deposit: string,
  ): Promise<number> {
    const message = paramChangeProposal({
      title,
      description,
      subspace,
      key,
      value,
    });
    return await this.submitSingleChoiceProposal(
      title,
      description,
      [message],
      deposit,
    );
  }

  /**
   * submitMultiChoiceSendProposal creates parameter change proposal with multiple choices.
   */
  async submitMultiChoiceSendProposal(
    choices: SendProposalInfo[],
    title: string,
    description: string,
    deposit: string,
  ): Promise<number> {
    const messages: MultiChoiceOption[] = choices.map((choice, idx) => ({
      description: 'choice' + idx,
      msgs: [
        createBankMessage(choice.to, parseInt(choice.amount), choice.denom),
      ],
    }));
    return await this.submitMultiChoiceProposal(
      title,
      description,
      deposit,
      messages,
    );
  }

  /**
   * submitMultiChoiceParameterChangeProposal creates parameter change proposal with multiple choices.
   */
  async submitMultiChoiceParameterChangeProposal(
    choices: ParamChangeProposalInfo[],
    title: string,
    description: string,
    deposit: string,
  ): Promise<number> {
    const messages: MultiChoiceOption[] = choices.map((choice, idx) => ({
      description: 'choice' + idx,
      msgs: [paramChangeProposal(choice)],
    }));
    return await this.submitMultiChoiceProposal(
      title,
      description,
      deposit,
      messages,
    );
  }

  /**
   * submitMultiChoiceProposal creates multi-choice proposal with given message.
   */
  async submitMultiChoiceProposal(
    title: string,
    description: string,
    deposit: string,
    options: MultiChoiceOption[],
  ): Promise<number> {
    const proposalTx = await this.user.executeContract(
      this.dao.contracts.proposal_modules.multiple.pre_proposal_module.address,
      JSON.stringify({
        propose: {
          msg: {
            propose: {
              title: title,
              description: description,
              choices: { options },
            },
          },
        },
      }),
      [{ denom: this.user.chain.denom, amount: deposit }],
    );

    const attribute = getEventAttribute(
      (proposalTx as any).events,
      'wasm',
      'proposal_id',
    );

    const proposalId = parseInt(attribute);
    expect(proposalId).toBeGreaterThanOrEqual(0);
    return proposalId;
  }

  /**
   * submitSoftwareUpgradeProposal creates proposal.
   */
  async submitSoftwareUpgradeProposal(
    title: string,
    description: string,
    name: string,
    height: number,
    info: string,
    deposit: string,
  ): Promise<number> {
    const message = {
      custom: {
        submit_admin_proposal: {
          admin_proposal: {
            software_upgrade_proposal: {
              title,
              description,
              plan: {
                name,
                height,
                info,
              },
            },
          },
        },
      },
    };
    return await this.submitSingleChoiceProposal(
      title,
      description,
      [message],
      deposit,
    );
  }

  /**
   * submitCancelSoftwareUpgradeProposal creates proposal.
   */
  async submitCancelSoftwareUpgradeProposal(
    title: string,
    description: string,
    deposit: string,
  ): Promise<number> {
    const message = {
      custom: {
        submit_admin_proposal: {
          admin_proposal: {
            cancel_software_upgrade_proposal: {
              title,
              description,
            },
          },
        },
      },
    };
    return await this.submitSingleChoiceProposal(
      title,
      description,
      [message],
      deposit,
    );
  }

  async supportAndExecuteProposal(
    proposal_id: number,
  ): Promise<TimeLockSingleChoiceProposal> {
    await this.voteYes(proposal_id);
    await this.executeProposal(proposal_id);
    return await this.dao.getTimelockedProposal(proposal_id);
  }

  async executeTimelockedProposal(
    proposal_id: number,
  ): Promise<InlineResponse20075TxResponse> {
    return this.user.executeContract(
      this.dao.contracts.proposal_modules.single.pre_proposal_module
        .timelock_module.address,
      JSON.stringify({
        execute_proposal: {
          proposal_id: proposal_id,
        },
      }),
    );
  }

  async overruleTimelockedProposal(
    timelock_address: string,
    proposal_id: number,
  ): Promise<InlineResponse20075TxResponse> {
    const overruleProposalId = await this.dao.getOverruleProposalId(
      timelock_address,
      proposal_id,
    );
    await this.user.executeContract(
      this.dao.contracts.proposal_modules.overrule.address,
      JSON.stringify({
        vote: { proposal_id: overruleProposalId, vote: 'yes' },
      }),
    );
    return await this.user.executeContract(
      this.dao.contracts.proposal_modules.overrule.address,
      JSON.stringify({ execute: { proposal_id: overruleProposalId } }),
    );
  }

  /**
   * submitOverruleProposal tries to create overrule proposal.
   * Actually, it will always fail since even while creation of overrule proposals
   * is permissionless, there is no moment in time when user can do that.
   * The overrule proposal is created automatically when subdao proposal is timelocked
   * and there is no way to create it for non-timelocked proposal or create a duplicate.
   * Thus, this function is for testing purposes only.
   */
  async submitOverruleProposal(
    timelock_address: string,
    proposal_id: number,
  ): Promise<number> {
    const proposalTx = await this.user.executeContract(
      this.dao.contracts.proposal_modules.overrule.pre_proposal_module.address,
      JSON.stringify({
        propose: {
          msg: {
            propose_overrule: {
              timelock_contract: timelock_address,
              proposal_id,
            },
          },
        },
      }),
    );

    const attribute = getEventAttribute(
      (proposalTx as any).events,
      'wasm',
      'proposal_id',
    );

    const proposalId = parseInt(attribute);
    expect(proposalId).toBeGreaterThanOrEqual(0);
    return proposalId;
  }

  async submitUpdateSubDaoConfigProposal(new_config: {
    name?: string;
    description?: string;
    dao_uri?: string;
  }): Promise<number> {
    const message = {
      wasm: {
        execute: {
          contract_addr: this.dao.contracts.core.address,
          msg: wrapMsg({
            update_config: new_config,
          }),
          funds: [],
        },
      },
    };

    return await this.submitSingleChoiceProposal(
      'update subDAO config',
      'sets subDAO config to new value',
      [message],
    );
  }

  /**
   * submitPinCodesProposal creates proposal which pins given code ids to wasmvm.
   */
  async submitPinCodesProposal(
    title: string,
    description: string,
    codes_ids: number[],
    amount: string,
  ): Promise<number> {
    const message = pinCodesProposal({ title, description, codes_ids });
    return await this.submitSingleChoiceProposal(
      title,
      description,
      [message],
      amount,
    );
  }

  /**
   * submitUnpinCodesProposal creates proposal which pins given code ids to wasmvm.
   */

  async submitUnpinCodesProposal(
    title: string,
    description: string,
    codes_ids: number[],
    amount: string,
  ): Promise<number> {
    const message = unpinCodesProposal({ title, description, codes_ids });
    return await this.submitSingleChoiceProposal(
      title,
      description,
      [message],
      amount,
    );
  }

  /**
   * submitUnpinCodesProposal creates proposal which pins given code ids to wasmvm.
   */
  async submitClientUpdateProposal(
    title: string,
    description: string,
    subject_client_id: string,
    substitute_client_id: string,
    amount: string,
  ): Promise<number> {
    const message = clientUpdateProposal({
      title,
      description,
      subject_client_id,
      substitute_client_id,
    });
    return await this.submitSingleChoiceProposal(
      title,
      description,
      [message],
      amount,
    );
  }

  /**
   * submitUnpinCodesProposal creates proposal which pins given code ids to wasmvm.
   */
  async submitUpgradeProposal(
    title: string,
    description: string,
    name: string,
    height: number,
    info: string,
    upgraded_client_state: string,
    amount: string,
  ): Promise<number> {
    const message = upgradeProposal({
      title,
      description,
      name,
      height,
      info,
      upgraded_client_state,
    });
    return await this.submitSingleChoiceProposal(
      title,
      description,
      [message],
      amount,
    );
  }

  /**
   * submitUpdateAminProposal creates proposal which pins given code ids to wasmvm.
   */
  async submitUpdateAdminProposal(
    title: string,
    description: string,
    contract: string,
    new_admin: string,
    amount: string,
  ): Promise<number> {
    const message = updateAdminProposal({
      title,
      description,
      contract,
      new_admin,
    });
    return await this.submitSingleChoiceProposal(
      title,
      description,
      [message],
      amount,
    );
  }

  /**
   * submitUpdateAminProposal creates proposal which pins given code ids to wasmvm.
   */
  async submitClearAdminProposal(
    title: string,
    description: string,
    contract: string,
    amount: string,
  ): Promise<number> {
    const message = clearAdminProposal({ title, description, contract });
    return await this.submitSingleChoiceProposal(
      title,
      description,
      [message],
      amount,
    );
  }
  /**
   * submitAddSchedule creates proposal to add new schedule.
   */
  async submitAddSchedule(
    title: string,
    description: string,
    amount: string,
    name: string,
    period: number,
    msgs: any[],
  ): Promise<number> {
    const message = addSchedule(name, period, msgs);
    return await this.submitSingleChoiceProposal(
      title,
      description,
      [message],
      amount,
    );
  }

  /**
   * submitRemoveSchedule creates proposal to remove added schedule.
   */
  async submitRemoveSchedule(
    title: string,
    description: string,
    amount: string,
    name: string,
  ): Promise<number> {
    const message = removeSchedule(name);
    return await this.submitSingleChoiceProposal(
      title,
      description,
      [message],
      amount,
    );
  }

  async queryVotingPower(): Promise<VotingPowerAtHeightResponse> {
    return await this.dao.queryVotingPower(this.user.wallet.address.toString());
  }

  async addSubdaoToDao(subDaoCore: string) {
    const p = await this.submitSingleChoiceProposal(
      'add subdao',
      '',
      [addSubdaoProposal(this.dao.contracts.core.address, subDaoCore)],
      '1000',
    );
    await this.voteYes(p);
    await this.executeProposalWithAttempts(p);
  }
}

export const deploySubdao = async (
  cm: WalletWrapper,
  main_dao_core_address: string,
  overrule_pre_propose_address: string,
  security_dao_addr: string,
): Promise<Dao> => {
  const coreCodeId = await cm.storeWasm(NeutronContract.SUBDAO_CORE);
  const cw4VotingCodeId = await cm.storeWasm(NeutronContract.CW4_VOTING);
  const cw4GroupCodeId = await cm.storeWasm(NeutronContract.CW4_GROUP);
  const proposeCodeId = await cm.storeWasm(NeutronContract.SUBDAO_PROPOSAL);
  const preProposeCodeId = await cm.storeWasm(
    NeutronContract.SUBDAO_PREPROPOSE,
  );
  const timelockCodeId = await cm.storeWasm(NeutronContract.SUBDAO_TIMELOCK);
  const votingModuleInstantiateInfo = {
    code_id: cw4VotingCodeId,
    label: 'subDAO_Neutron_voting_module',
    msg: wrapMsg({
      cw4_group_code_id: cw4GroupCodeId,
      initial_members: [
        {
          addr: cm.wallet.address.toString(),
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
          code_id: preProposeCodeId,
          label: 'subDAO prepropose module',
          msg: wrapMsg({
            open_proposal_submission: true,
            timelock_module_instantiate_info: {
              code_id: timelockCodeId,
              label: 'subDAO timelock contract',
              msg: wrapMsg({
                overrule_pre_propose: overrule_pre_propose_address,
              }),
            },
          }),
        },
      },
    },
    close_proposal_on_execution_failure: false,
  };
  const proposalModuleInstantiateInfo = {
    code_id: proposeCodeId,
    label: 'subDAO proposal contract',
    msg: wrapMsg(proposeInstantiateMessage),
  };
  const coreInstantiateMessage = {
    name: 'SubDAO core test 1',
    description: 'serves testing purposes',
    vote_module_instantiate_info: votingModuleInstantiateInfo,
    proposal_modules_instantiate_info: [proposalModuleInstantiateInfo],
    dao_uri: 'www.testsubdao.org',
    main_dao: main_dao_core_address,
    security_dao: security_dao_addr,
  };
  const res = await cm.instantiateContract(
    coreCodeId,
    JSON.stringify(coreInstantiateMessage),
    'cwd_subdao_core',
  );

  const f = (arr, id) =>
    arr.find((v) => Number(v.code_id) == id)!._contract_address;

  return new Dao(
    cm.chain,
    await getSubDaoContracts(cm.chain, f(res, coreCodeId)),
  );
};

export const setupSubDaoTimelockSet = async (
  cm: WalletWrapper,
  main_dao_address: string,
  security_dao_addr: string,
  mockMainDao: boolean,
): Promise<Dao> => {
  const daoContracts = await getDaoContracts(cm.chain, main_dao_address);
  const subDao = await deploySubdao(
    cm,
    mockMainDao ? cm.wallet.address.toString() : daoContracts.core.address,
    daoContracts.proposal_modules.overrule.pre_proposal_module.address,
    security_dao_addr,
  );

  const mainDaoMember = new DaoMember(cm, new Dao(cm.chain, daoContracts));
  await mainDaoMember.addSubdaoToDao(subDao.contracts.core.address);

  return subDao;
};

export const deployNeutronDao = async (
  cm: WalletWrapper,
): Promise<DaoContracts> => {
  const coreCodeId = await cm.storeWasm(NeutronContract.DAO_CORE);
  const proposeSingleCodeId = await cm.storeWasm(
    NeutronContract.DAO_PROPOSAL_SINGLE,
  );
  const preProposeSingleCodeId = await cm.storeWasm(
    NeutronContract.DAO_PREPROPOSAL_SINGLE,
  );
  const proposeMultipleCodeId = await cm.storeWasm(
    NeutronContract.DAO_PROPOSAL_MULTI,
  );
  const preProposeMultipleCodeId = await cm.storeWasm(
    NeutronContract.DAO_PREPROPOSAL_MULTI,
  );
  const preProposeOverruleCodeId = await cm.storeWasm(
    NeutronContract.DAO_PREPROPOSAL_OVERRULE,
  );
  const votingRegistryCodeId = await cm.storeWasm(
    NeutronContract.VOTING_REGISTRY,
  );

  const neutronVaultCodeId = await cm.storeWasm(NeutronContract.NEUTRON_VAULT);
  const neutronVaultInitMsg = {
    owner: {
      address: {
        addr: cm.wallet.address.toString(),
      },
    },
    name: 'voting vault',
    denom: cm.chain.denom,
    description: 'a simple voting vault for testing purposes',
  };

  const neutronVaultCodeIdRes = await cm.instantiateContract(
    neutronVaultCodeId,
    JSON.stringify(neutronVaultInitMsg),
    DaoContractLabels.NEUTRON_VAULT,
  );

  const f = (arr, id) =>
    arr.find((v) => Number(v.code_id) == id)!._contract_address;
  const neutronVaultAddess = f(neutronVaultCodeIdRes, neutronVaultCodeId);
  const votingRegistryInstantiateInfo = {
    admin: {
      core_module: {},
    },
    code_id: votingRegistryCodeId,
    label: DaoContractLabels.DAO_VOTING_REGISTRY,
    msg: wrapMsg({
      manager: null,
      owner: {
        address: {
          addr: cm.wallet.address.toString(),
        },
      },
      voting_vaults: [neutronVaultAddess],
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
  const res = await cm.instantiateContract(
    coreCodeId,
    JSON.stringify(coreInstantiateMessage),
    DaoContractLabels.DAO_CORE,
  );
  return getDaoContracts(cm.chain, f(res, coreCodeId));
};
