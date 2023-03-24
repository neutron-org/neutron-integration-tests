import axios from 'axios';
import { CosmosWrapper, getEventAttribute, WalletWrapper } from './cosmos';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { getWithAttempts } from './wait';
import {
  MultiChoiceOption,
  SingleChoiceProposal,
  TotalPowerAtHeightResponse,
  VotingPowerAtHeightResponse,
} from './types';
import {
  paramChangeProposal,
  ParamChangeProposalInfo,
  sendProposal,
  SendProposalInfo,
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

export type DaoContracts = {
  core: {
    address: string;
  };
  proposal_modules: {
    single: {
      address: string;
      pre_proposal_module: {
        address: string;
      };
    };
    multiple: {
      address: string;
      pre_proposal_module: {
        address: string;
      };
    };
    overrule: {
      address: string;
      pre_proposal_module: {
        address: string;
      };
    };
  };
  voting_module: {
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
): Promise<DaoContracts['voting_module']['voting_vaults']> => {
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
  cm: CosmosWrapper;
  contracts: DaoContracts;

  constructor(cm: CosmosWrapper, contracts: DaoContracts) {
    this.cm = cm;
    this.contracts = contracts;
  }

  async checkPassedProposal(proposalId: number) {
    await getWithAttempts(
      this.cm.blockWaiter,
      async () => await this.queryProposal(proposalId),
      async (response) => response.proposal.status === 'passed',
      20,
    );
  }

  async checkPassedMultiChoiceProposal(proposalId: number) {
    await getWithAttempts(
      this.cm.blockWaiter,
      async () => await this.queryMultiChoiceProposal(proposalId),
      async (response) => response.proposal.status === 'passed',
      20,
    );
  }

  async checkExecutedMultiChoiceProposal(proposalId: number) {
    await getWithAttempts(
      this.cm.blockWaiter,
      async () => await this.queryMultiChoiceProposal(proposalId),
      async (response) => response.proposal.status === 'executed',
      20,
    );
  }

  async queryMultiChoiceProposal(proposalId: number): Promise<any> {
    return await this.cm.queryContract<any>(
      this.contracts.proposal_modules.multiple.address,
      {
        proposal: {
          proposal_id: proposalId,
        },
      },
    );
  }

  async queryProposal(proposalId: number): Promise<SingleChoiceProposal> {
    return await this.cm.queryContract<SingleChoiceProposal>(
      this.contracts.proposal_modules.single.address,
      {
        proposal: {
          proposal_id: proposalId,
        },
      },
    );
  }

  async queryTotalVotingPower(): Promise<TotalPowerAtHeightResponse> {
    return await this.cm.queryContract<TotalPowerAtHeightResponse>(
      this.contracts.core.address,
      {
        total_power_at_height: {},
      },
    );
  }

  async queryVotingPower(addr: string): Promise<VotingPowerAtHeightResponse> {
    return await this.cm.queryContract<VotingPowerAtHeightResponse>(
      this.contracts.core.address,
      {
        voting_power_at_height: {
          address: addr,
        },
      },
    );
  }
}

export class DaoMember {
  cm: WalletWrapper;
  dao: Dao;

  constructor(cm: WalletWrapper, dao: Dao) {
    this.cm = cm;
    this.dao = dao;
  }

  /**
   * voteYes  vote 'yes' for given proposal.
   */
  async voteYes(proposalId: number): Promise<InlineResponse20075TxResponse> {
    return await this.cm.executeContract(
      this.dao.contracts.proposal_modules.single.address,
      JSON.stringify({ vote: { proposal_id: proposalId, vote: 'yes' } }),
      [],
      this.cm.wallet.address.toString(),
    );
  }

  /**
   * voteNo  vote 'no' for given proposal.
   */
  async voteNo(proposalId: number): Promise<InlineResponse20075TxResponse> {
    return await this.cm.executeContract(
      this.dao.contracts.proposal_modules.single.address,
      JSON.stringify({ vote: { proposal_id: proposalId, vote: 'no' } }),
      [],
      this.cm.wallet.address.toString(),
    );
  }

  /**
   * voteYes  vote for option for given multi choice proposal.
   */
  async voteForOption(
    proposalId: number,
    optionId: number,
  ): Promise<InlineResponse20075TxResponse> {
    return await this.cm.executeContract(
      this.dao.contracts.proposal_modules.multiple.address,
      JSON.stringify({
        vote: { proposal_id: proposalId, vote: { option_id: optionId } },
      }),
      [],
      this.cm.wallet.address.toString(),
    );
  }

  async bondFunds(amount: string): Promise<InlineResponse20075TxResponse> {
    return await this.cm.executeContract(
      this.dao.contracts.voting_module.voting_vaults.ntrn_vault.address,
      JSON.stringify({
        bond: {},
      }),
      [{ denom: this.cm.cw.denom, amount: amount }],
      this.cm.wallet.address.toString(),
    );
  }

  /**
   * submitProposal creates proposal with given message.
   */
  async submitSingleChoiceProposal(
    title: string,
    description: string,
    msg: string,
    amount: string,
    sender: string,
  ): Promise<number> {
    const message = JSON.parse(msg);
    const proposalTx = await this.cm.executeContract(
      this.dao.contracts.proposal_modules.single.pre_proposal_module.address,
      JSON.stringify({
        propose: {
          msg: {
            propose: {
              title: title,
              description: description,
              msgs: [message],
            },
          },
        },
      }),
      [{ denom: this.cm.cw.denom, amount: amount }],
      sender,
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
    sender: string = this.cm.wallet.address.toString(),
  ): Promise<InlineResponse20075TxResponse> {
    return await this.cm.executeContract(
      this.dao.contracts.proposal_modules.single.address,
      JSON.stringify({ execute: { proposal_id: proposalId } }),
      [],
      sender,
    );
  }

  async makeSingleChoiceProposalPass(
    loyalVoters: [DaoMember],
    title: string,
    description: string,
    msg: string,
    amount: string,
    sender: string,
  ) {
    const proposal_id = await this.submitSingleChoiceProposal(
      title,
      description,
      msg,
      amount,
      sender,
    );
    await loyalVoters[0].cm.cw.blockWaiter.waitBlocks(1);

    for (const voter of loyalVoters) {
      await voter.voteYes(proposal_id);
    }
    await this.executeProposal(proposal_id);

    await getWithAttempts(
      loyalVoters[0].cm.cw.blockWaiter,
      async () => await this.dao.queryProposal(proposal_id),
      async (response) => response.proposal.status === 'executed',
      20,
    );
  }

  async executeProposalWithAttempts(proposalId: number) {
    await this.executeProposal(proposalId);
    await getWithAttempts(
      this.cm.cw.blockWaiter,
      async () => await this.dao.queryProposal(proposalId),
      async (response) => response.proposal.status === 'executed',
      20,
    );
  }

  async executeMultiChoiceProposalWithAttempts(proposalId: number) {
    await this.executeMultiChoiceProposal(proposalId);
    await getWithAttempts(
      this.cm.cw.blockWaiter,
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
    sender: string = this.cm.wallet.address.toString(),
  ): Promise<any> {
    return await this.cm.executeContract(
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
    amount: string,
    to: string,
    sender: string = this.cm.wallet.address.toString(),
  ): Promise<number> {
    const message = JSON.stringify(
      sendProposal({ to, denom: this.cm.cw.denom, amount }),
    );
    return await this.submitSingleChoiceProposal(
      title,
      description,
      message,
      amount,
      sender,
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
    amount: string,
    sender: string = this.cm.wallet.address.toString(),
  ): Promise<number> {
    const message = JSON.stringify(
      paramChangeProposal({ title, description, subspace, key, value }),
    );
    return await this.submitSingleChoiceProposal(
      title,
      description,
      message,
      amount,
      sender,
    );
  }

  /**
   * submitMultiChoiceSendProposal creates parameter change proposal with multiple choices.
   */
  async submitMultiChoiceSendProposal(
    choices: SendProposalInfo[],
    title: string,
    description: string,
    amount: string,
    sender: string = this.cm.wallet.address.toString(),
  ): Promise<number> {
    const messages: MultiChoiceOption[] = choices.map((choice, idx) => ({
      description: 'choice' + idx,
      msgs: [sendProposal(choice)],
    }));
    return await this.submitMultiChoiceProposal(
      title,
      description,
      amount,
      sender,
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
    amount: string,
    sender: string = this.cm.wallet.address.toString(),
  ): Promise<number> {
    const messages: MultiChoiceOption[] = choices.map((choice, idx) => ({
      description: 'choice' + idx,
      msgs: [paramChangeProposal(choice)],
    }));
    return await this.submitMultiChoiceProposal(
      title,
      description,
      amount,
      sender,
      messages,
    );
  }

  /**
   * submitMultiChoiceProposal creates multi-choice proposal with given message.
   */
  async submitMultiChoiceProposal(
    title: string,
    description: string,
    amount: string,
    sender: string,
    options: MultiChoiceOption[],
  ): Promise<number> {
    const proposalTx = await this.cm.executeContract(
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
      [{ denom: this.cm.cw.denom, amount: amount }],
      sender,
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
    amount: string,
    sender: string = this.cm.wallet.address.toString(),
  ): Promise<number> {
    const message = JSON.stringify({
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
    });
    return await this.submitSingleChoiceProposal(
      title,
      description,
      message,
      amount,
      sender,
    );
  }

  /**
   * submitCancelSoftwareUpgradeProposal creates proposal.
   */
  async submitCancelSoftwareUpgradeProposal(
    title: string,
    description: string,
    amount: string,
    sender: string = this.cm.wallet.address.toString(),
  ): Promise<number> {
    const message = JSON.stringify({
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
    });
    return await this.submitSingleChoiceProposal(
      title,
      description,
      message,
      amount,
      sender,
    );
  }
}
