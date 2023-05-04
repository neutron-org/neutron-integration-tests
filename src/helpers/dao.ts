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
  addSchedule,
  addSubdaoProposal,
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

export type GetSubdaoResponse = { addr: string; charter: string };

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
};

export type VaultBondingStatus = {
  bonding_enabled: string;
  unbondable_abount: string;
  height: number;
};

export type VotingVaultsModule = {
  address: string;
  vaults: {
    neutron: {
      address: string;
    };
    lockdrop: {
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
  DAO_CORE: 'neutron.core',
  NEUTRON_VAULT: 'neutron.voting.vaults.neutron',
  LOCKDROP_VAULT: 'neutron.voting.vaults.lockdrop',
  TREASURY: 'treasury',
  DISTRIBUTION: 'distribution',
  DAO_PRE_PROPOSAL_SINGLE: 'neutron.proposals.single.pre_propose',
  DAO_PRE_PROPOSAL_MULTIPLE: 'neutron.proposals.multiple.pre_propose',
  DAO_PRE_PROPOSAL_OVERRULE: 'neutron.proposals.overrule.pre_propose',
  DAO_VOTING_REGISTRY: 'neutron.voting',
  DAO_PROPOSAL_SINGLE: 'neutron.proposals.single',
  DAO_PROPOSAL_MULTIPLE: 'neutron.proposals.multiple',
  DAO_PROPOSAL_OVERRULE: 'neutron.proposals.overrule',
};

export const DaoPrefixes = {
  'Neutron DAO': 'neutron',
  'Security SubDAO': 'security',
  'Grants SubDAO': 'grants',
};

export type DaoContracts = {
  name: string;
  core: {
    address: string;
  };
  proposals: {
    single: {
      address: string;
      pre_propose: {
        address: string;
        timelock?: {
          address: string;
        };
      };
    };
    multiple?: {
      address: string;
      pre_propose: {
        address: string;
      };
    };
    overrule?: {
      address: string;
      pre_propose: {
        address: string;
      };
    };
  };
  voting: VotingVaultsModule | VotingCw4Module;
  subdaos?: {
    [name: string]: DaoContracts;
  };
};

export const getVotingModule = async (
  cm: CosmosWrapper,
  daoAddress: string,
): Promise<string> =>
  await cm.queryContract<string>(daoAddress, {
    voting_module: {},
  });

export const getVotingVaults = async (
  cm: CosmosWrapper,
  votingModuleAddress: string,
): Promise<VotingVaultsModule['vaults']> => {
  const votingVaults = await cm.queryContract<
    [{ address: string; name: string }]
  >(votingModuleAddress, { voting_vaults: {} });

  let ntrnVaultAddress;
  let lockdropVaultAddress;
  for (const vault of votingVaults) {
    const vaultContractInfo = await cm.getContractInfo(vault.address);

    switch (vaultContractInfo['contract_info']['label']) {
      case DaoContractLabels.NEUTRON_VAULT:
        ntrnVaultAddress = vault.address;
        break;
      case DaoContractLabels.LOCKDROP_VAULT:
        lockdropVaultAddress = vault.address;
        break;
    }
  }

  return {
    neutron: { address: ntrnVaultAddress },
    lockdrop: { address: lockdropVaultAddress },
  };
};

export const getDaoContracts = async (
  cm: CosmosWrapper,
  daoAddress: string,
): Promise<DaoContracts> => {
  const config = await cm.queryContract<{ name: string }>(daoAddress, {
    config: {},
  });

  const votingModuleAddress = await getVotingModule(cm, daoAddress);
  const votingVaults = await getVotingVaults(cm, votingModuleAddress);

  const proposalModules = await cm.queryContract<{ address: string }[]>(
    daoAddress,
    { proposal_modules: {} },
  );

  let proposalSingleAddress = '';
  let proposalMultipleAddress = '';
  let proposalOverruleAddress = '';

  let preProposalSingleAddress = '';
  let preProposalMultipleAddress = '';
  let preProposalOverruleAddress = '';

  for (const proposalModule of proposalModules) {
    const proposalContractInfo = await cm.getContractInfo(
      proposalModule.address,
    );
    const preProposalContract = await cm.queryContract<{
      Module: { addr: string };
    }>(proposalModule.address, { proposal_creation_policy: {} });
    switch (proposalContractInfo['contract_info']['label']) {
      case DaoContractLabels.DAO_PROPOSAL_OVERRULE:
        proposalOverruleAddress = proposalModule.address;
        preProposalOverruleAddress = preProposalContract.Module.addr;
        break;
      case DaoContractLabels.DAO_PROPOSAL_MULTIPLE:
        proposalMultipleAddress = proposalModule.address;
        preProposalMultipleAddress = preProposalContract.Module.addr;
        break;
      case DaoContractLabels.DAO_PROPOSAL_SINGLE:
        proposalSingleAddress = proposalModule.address;
        preProposalSingleAddress = preProposalContract.Module.addr;
        break;
    }
  }

  const subdaosList = await cm.queryContract<{ addr: string }[]>(daoAddress, {
    list_sub_daos: {},
  });

  const subdaos = {};
  for (const subdao of subdaosList) {
    const subDaoContracts = await getSubDaoContracts(cm, subdao.addr);
    subdaos[DaoPrefixes[subDaoContracts.name]] = subDaoContracts;
  }

  return {
    name: config.name,
    core: { address: daoAddress },
    proposals: {
      single: {
        address: proposalSingleAddress,
        pre_propose: { address: preProposalSingleAddress },
      },
      multiple: {
        address: proposalMultipleAddress,
        pre_propose: { address: preProposalMultipleAddress },
      },
      overrule: {
        address: proposalOverruleAddress,
        pre_propose: { address: preProposalOverruleAddress },
      },
    },
    voting: {
      address: votingModuleAddress,
      vaults: votingVaults,
    },
    subdaos: subdaos,
  };
};

export const getDaoAdmin = async (
  cm: CosmosWrapper,
  daoAddress: string,
): Promise<string> => {
  const daoInfo = await cm.getContractInfo(daoAddress);
  return  daoInfo['contract_info']['admin'];
}
export const getSubDaoContracts = async (
  cm: CosmosWrapper,
  daoAddress: string,
): Promise<DaoContracts> => {
  const config = await cm.queryContract<{ name: string }>(daoAddress, {
    config: {},
  });

  const votingModuleAddress = await cm.queryContract<string>(daoAddress, {
    voting_module: {},
  });
  const cw4GroupAddress = await cm.queryContract<string>(votingModuleAddress, {
    group_contract: {},
  });

  const proposalModules = await cm.queryContract<[{ address: string }]>(
    daoAddress,
    { proposal_modules: {} },
  );

  expect(proposalModules).toHaveLength(1);
  const proposalModule = proposalModules[0];

  const preProposalContract = await cm.queryContract<{
    Module: { addr: string };
  }>(proposalModule.address, { proposal_creation_policy: {} });
  const proposalSingleAddress = proposalModule.address;
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
      address: daoAddress,
    },
    proposals: {
      single: {
        address: proposalSingleAddress,
        pre_propose: {
          address: preProposalSingleAddress,
          timelock: {
            address: timelockAddr,
          },
        },
      },
    },
    voting: {
      address: votingModuleAddress,
      cw4group: {
        address: cw4GroupAddress,
      },
    },
  };
};

export const getTreasuryContract = async (
  cm: CosmosWrapper,
): Promise<string> => {
  const url = `${cm.sdk.url}/cosmos/params/v1beta1/params?subspace=feeburner&key=TreasuryAddress`;
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
      this.contracts.proposals.multiple.address,
      {
        proposal: {
          proposal_id: proposalId,
        },
      },
    );
  }

  async queryProposal(proposalId: number): Promise<SingleChoiceProposal> {
    return await this.chain.queryContract<SingleChoiceProposal>(
      this.contracts.proposals.single.address,
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
      this.contracts.proposals.overrule.address,
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
    const proposalId = await loyalVoters[0].submitSingleChoiceProposal(
      title,
      description,
      msgs,
      deposit,
    );
    await loyalVoters[0].user.chain.blockWaiter.waitBlocks(1);

    for (const voter of loyalVoters) {
      await voter.voteYes(proposalId);
    }
    await loyalVoters[0].executeProposal(proposalId);

    await getWithAttempts(
      loyalVoters[0].user.chain.blockWaiter,
      async () => await this.queryProposal(proposalId),
      async (response) => response.proposal.status === 'executed',
      20,
    );
  }

  async getTimelockedProposal(
    proposalId: number,
  ): Promise<TimeLockSingleChoiceProposal> {
    return this.chain.queryContract<TimeLockSingleChoiceProposal>(
      this.contracts.proposals.single.pre_propose.timelock.address,
      {
        proposal: {
          proposal_id: proposalId,
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

  async querySubDao(subdaoAddress: string): Promise<GetSubdaoResponse> {
    return this.chain.queryContract<GetSubdaoResponse>(
      this.contracts.core.address,
      {
        get_sub_dao: {
          address: subdaoAddress,
        },
      },
    );
  }

  async getOverruleProposalId(
    timelockAddress: string,
    subdaoProposalId: number,
  ): Promise<number> {
    return await this.chain.queryContract<number>(
      this.contracts.proposals.overrule.pre_propose.address,
      {
        query_extension: {
          msg: {
            overrule_proposal_id: {
              timelock_address: timelockAddress,
              subdao_proposal_id: subdaoProposalId,
            },
          },
        },
      },
    );
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
      this.dao.contracts.proposals.single.address,
      JSON.stringify({ vote: { proposal_id: proposalId, vote: 'yes' } }),
    );
  }

  /**
   * voteNo  vote 'no' for given proposal.
   */
  async voteNo(proposalId: number): Promise<InlineResponse20075TxResponse> {
    return await this.user.executeContract(
      this.dao.contracts.proposals.single.address,
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
      this.dao.contracts.proposals.multiple.address,
      JSON.stringify({
        vote: { proposal_id: proposalId, vote: { option_id: optionId } },
      }),
    );
  }

  async bondFunds(amount: string): Promise<InlineResponse20075TxResponse> {
    const vaultAddress = (this.dao.contracts.voting as VotingVaultsModule)
      .vaults.neutron.address;
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
      this.dao.contracts.proposals.single.pre_propose.address,
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
      this.dao.contracts.proposals.single.address,
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
      this.dao.contracts.proposals.multiple.address,
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
      this.dao.contracts.proposals.multiple.pre_propose.address,
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
    proposalId: number,
  ): Promise<TimeLockSingleChoiceProposal> {
    await this.voteYes(proposalId);
    await this.executeProposal(proposalId);
    return await this.dao.getTimelockedProposal(proposalId);
  }

  async executeTimelockedProposal(
    proposalId: number,
  ): Promise<InlineResponse20075TxResponse> {
    return this.user.executeContract(
      this.dao.contracts.proposals.single.pre_propose.timelock.address,
      JSON.stringify({
        execute_proposal: {
          proposal_id: proposalId,
        },
      }),
    );
  }

  async overruleTimelockedProposal(
    timelockAddress: string,
    proposalId: number,
  ): Promise<InlineResponse20075TxResponse> {
    const overruleProposalId = await this.dao.getOverruleProposalId(
      timelockAddress,
      proposalId,
    );
    await this.user.executeContract(
      this.dao.contracts.proposals.overrule.address,
      JSON.stringify({
        vote: { proposal_id: overruleProposalId, vote: 'yes' },
      }),
    );
    return await this.user.executeContract(
      this.dao.contracts.proposals.overrule.address,
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
    timelockAddress: string,
    proposalId: number,
  ): Promise<number> {
    const proposalTx = await this.user.executeContract(
      this.dao.contracts.proposals.overrule.pre_propose.address,
      JSON.stringify({
        propose: {
          msg: {
            propose_overrule: {
              timelock_contract: timelockAddress,
              proposal_id: proposalId,
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

    const proposalId1 = parseInt(attribute);
    expect(proposalId1).toBeGreaterThanOrEqual(0);
    return proposalId1;
  }

  async submitUpdateSubDaoConfigProposal(newConfig: {
    name?: string;
    description?: string;
    dao_uri?: string;
  }): Promise<number> {
    const message = {
      wasm: {
        execute: {
          contract_addr: this.dao.contracts.core.address,
          msg: wrapMsg({
            update_config: newConfig,
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
    codesIds: number[],
    amount: string,
  ): Promise<number> {
    const message = pinCodesProposal({
      title,
      description,
      codes_ids: codesIds,
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

  async submitUnpinCodesProposal(
    title: string,
    description: string,
    codesIds: number[],
    amount: string,
  ): Promise<number> {
    const message = unpinCodesProposal({
      title,
      description,
      codes_ids: codesIds,
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
  async submitClientUpdateProposal(
    title: string,
    description: string,
    subjectClientId: string,
    substituteClientId: string,
    amount: string,
  ): Promise<number> {
    const message = clientUpdateProposal({
      title,
      description,
      subject_client_id: subjectClientId,
      substitute_client_id: substituteClientId,
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
    upgradedClientState: string,
    amount: string,
  ): Promise<number> {
    const message = upgradeProposal({
      title,
      description,
      name,
      height,
      info,
      upgraded_client_state: upgradedClientState,
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
    newAdmin: string,
    amount: string,
  ): Promise<number> {
    const message = updateAdminProposal({
      title,
      description,
      contract,
      new_admin: newAdmin,
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
  mainDaoCoreAddress: string,
  overrulePreProposeAddress: string,
  securityDaoAddr: string,
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
                overrule_pre_propose: overrulePreProposeAddress,
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
    main_dao: mainDaoCoreAddress,
    security_dao: securityDaoAddr,
  };
  const res = await cm.instantiateContract(
    coreCodeId,
    JSON.stringify(coreInstantiateMessage),
    'cwd_subdao_core',
  );

  const f = (arr: Record<string, string>[], id: number) =>
    (arr.find((v) => Number(v.code_id) == id) || {})._contract_address;

  return new Dao(
    cm.chain,
    await getSubDaoContracts(cm.chain, f(res, coreCodeId)),
  );
};

export const setupSubDaoTimelockSet = async (
  cm: WalletWrapper,
  mainDaoAddress: string,
  securityDaoAddr: string,
  mockMainDao: boolean,
): Promise<Dao> => {
  const daoContracts = await getDaoContracts(cm.chain, mainDaoAddress);
  const subDao = await deploySubdao(
    cm,
    mockMainDao ? cm.wallet.address.toString() : daoContracts.core.address,
    daoContracts.proposals.overrule.pre_propose.address,
    securityDaoAddr,
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
    owner: cm.wallet.address.toString(),
    name: 'voting vault',
    denom: cm.chain.denom,
    description: 'a simple voting vault for testing purposes',
  };

  const neutronVaultCodeIdRes = await cm.instantiateContract(
    neutronVaultCodeId,
    JSON.stringify(neutronVaultInitMsg),
    DaoContractLabels.NEUTRON_VAULT,
  );

  const f = (arr: Record<string, string>[], id: number) =>
    (arr.find((v) => Number(v.code_id) == id) || {})._contract_address;
  const neutronVaultAddess = f(neutronVaultCodeIdRes, neutronVaultCodeId);
  const votingRegistryInstantiateInfo = {
    admin: {
      core_module: {},
    },
    code_id: votingRegistryCodeId,
    label: DaoContractLabels.DAO_VOTING_REGISTRY,
    msg: wrapMsg({
      manager: null,
      owner: cm.wallet.address.toString(),
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
