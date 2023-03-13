import axios from 'axios';
import { CosmosWrapper } from './cosmos';

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
): Promise<string> => {
  const voting_module_address = await cm.queryContract<string>(dao_address, {
    voting_module: {},
  });

  return voting_module_address;
};

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
