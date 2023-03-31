import axios from 'axios';
import {
  CosmosWrapper,
  createBankMessage,
  getEventAttribute,
  WalletWrapper,
} from './cosmos';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { getWithAttempts } from './wait';
import {
  MultiChoiceOption,
  SingleChoiceProposal,
  TotalPowerAtHeightResponse,
  VotingPowerAtHeightResponse,
} from './types';
import {
  clearAdminProposal,
  clientUpdateProposal,
  paramChangeProposal,
  ParamChangeProposalInfo,
  pinCodesProposal,
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
  timelock_ts: number; //  The timestamp at which the proposal was submitted to the timelock contract.
  msgs: Array<Record<string, any>>; // Vec<CosmosMsg<NeutronMsg>>
  status: string;
};

export type TimelockConfig = {
  owner: string;
  timelock_duration: number;
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

export type DaoContracts = {
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
  expect(voting_vaults).toMatchObject([
    { name: 'voting vault' },
    { name: 'lockdrop vault' },
  ]);
  const ntrn_vault_address = voting_vaults.filter(
    (x) => x.name == 'voting vault',
  )[0].address;
  const lockdrop_vault_address = voting_vaults.filter(
    (x) => x.name == 'lockdrop vault',
  )[0].address;

  return {
    ntrn_vault: { address: ntrn_vault_address },
    lockdrop_vault: { address: lockdrop_vault_address },
  };
};

export const getDaoContracts = async (
  cm: CosmosWrapper,
  dao_address: string,
): Promise<DaoContracts> => {
  const voting_module_address = await getVotingModule(cm, dao_address);
  const voting_vaults = await getVotingVaults(cm, voting_module_address);

  const proposal_modules = await cm.queryContract<[{ address: string }]>(
    dao_address,
    { proposal_modules: {} },
  );

  let proposalSingleAddress = '';
  let proposalMultipleAddress = '';
  let proposalOverruleAddress = '';

  let preProposalSingleAddress = '';
  let preProposalMultipleAddress = '';
  let preProposalOverruleAddress = '';

  expect(proposal_modules).toHaveLength(3);
  for (const proposal_module of proposal_modules) {
    const proposalContractInfo = await cm.getContractInfo(
      proposal_module.address,
    );
    const preProposalContract = await cm.queryContract<{
      Module: { addr: string };
    }>(proposal_module.address, { proposal_creation_policy: {} });
    switch (proposalContractInfo['contract_info']['label']) {
      case 'DAO_Neutron_cw-proposal-overrule':
        proposalOverruleAddress = proposal_module.address;
        preProposalOverruleAddress = preProposalContract.Module.addr;
        break;
      case 'DAO_Neutron_cw-proposal-multiple':
        proposalMultipleAddress = proposal_module.address;
        preProposalMultipleAddress = preProposalContract.Module.addr;
        break;
      case 'DAO_Neutron_cw-proposal-single':
        proposalSingleAddress = proposal_module.address;
        preProposalSingleAddress = preProposalContract.Module.addr;
        break;
    }
  }

  return {
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
  chain: CosmosWrapper;
  contracts: DaoContracts;

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
    loyalVoters: [DaoMember],
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
}

export class DaoMember {
  user: WalletWrapper;
  dao: Dao;

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
      [],
      this.user.wallet.address.toString(),
    );
  }

  /**
   * voteNo  vote 'no' for given proposal.
   */
  async voteNo(proposalId: number): Promise<InlineResponse20075TxResponse> {
    return await this.user.executeContract(
      this.dao.contracts.proposal_modules.single.address,
      JSON.stringify({ vote: { proposal_id: proposalId, vote: 'no' } }),
      [],
      this.user.wallet.address.toString(),
    );
  }

  /**
   * voteYes  vote for option for given multi choice proposal.
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
      [],
      this.user.wallet.address.toString(),
    );
  }

  async bondFunds(amount: string): Promise<InlineResponse20075TxResponse> {
    return await this.user.executeContract(
      (this.dao.contracts.voting_module as VotingVaultsModule).voting_vaults
        .ntrn_vault.address,
      JSON.stringify({
        bond: {},
      }),
      [{ denom: this.user.chain.denom, amount: amount }],
      this.user.wallet.address.toString(),
    );
  }

  /**
   * submitProposal creates proposal with given message.
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
      this.user.wallet.address.toString(),
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
    sender: string = this.user.wallet.address.toString(),
  ): Promise<InlineResponse20075TxResponse> {
    return await this.user.executeContract(
      this.dao.contracts.proposal_modules.single.address,
      JSON.stringify({ execute: { proposal_id: proposalId } }),
      [],
      sender,
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
  async executeMultiChoiceProposal(
    proposalId: number,
    sender: string = this.user.wallet.address.toString(),
  ): Promise<any> {
    return await this.user.executeContract(
      this.dao.contracts.proposal_modules.multiple.address,
      JSON.stringify({ execute: { proposal_id: proposalId } }),
      [],
      sender,
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
      this.user.wallet.address.toString(),
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
    await this.user.executeContract(
      this.dao.contracts.proposal_modules.single.address,
      JSON.stringify({
        vote: { proposal_id: proposal_id, vote: 'yes' },
      }),
    );

    await this.user.executeContract(
      this.dao.contracts.proposal_modules.single.address,
      JSON.stringify({ execute: { proposal_id: proposal_id } }),
    );
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
    proposal_id: number,
  ): Promise<InlineResponse20075TxResponse> {
    return this.user.executeContract(
      this.dao.contracts.proposal_modules.single.pre_proposal_module
        .timelock_module.address,
      JSON.stringify({
        overrule_proposal: {
          proposal_id: proposal_id,
        },
      }),
    );
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
          msg: Buffer.from(
            JSON.stringify({
              update_config: new_config,
            }),
          ).toString('base64'),
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
}
