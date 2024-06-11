import {
  CosmosWrapper,
  filterIBCDenoms,
  getEventAttribute,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import {
  Dao,
  DaoMember,
  getDaoContracts,
} from '@neutron-org/neutronjsplus/dist/dao';
import { waitForICQResultWithRemoteHeight } from '@neutron-org/neutronjsplus/dist/icq';
import { paramChangeProposal } from '@neutron-org/neutronjsplus/dist/proposal';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';
import axios from 'axios';

export const getKvCallbackStatus = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    last_update_height: number;
  }>(contractAddress, {
    kv_callback_stats: {
      query_id: queryId,
    },
  });

export const watchForKvCallbackUpdates = async (
  neutronCm: CosmosWrapper,
  targetCm: CosmosWrapper,
  contractAddress: string,
  queryIds: number[],
) => {
  const statusPrev = await Promise.all(
    queryIds.map((i) => getKvCallbackStatus(neutronCm, contractAddress, i)),
  );
  const targetHeight = await targetCm.getHeight();
  await Promise.all(
    queryIds.map((i) =>
      waitForICQResultWithRemoteHeight(
        neutronCm,
        contractAddress,
        i,
        targetHeight,
      ),
    ),
  );
  const status = await Promise.all(
    queryIds.map((i) => getKvCallbackStatus(neutronCm, contractAddress, i)),
  );
  for (const i in status) {
    expect(statusPrev[i].last_update_height).toBeLessThan(
      status[i].last_update_height,
    );
  }
};

export const getQueryBalanceResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    balances: {
      coins: {
        denom: string;
        amount: string;
      }[];
    };
    last_submitted_local_height: number;
  }>(contractAddress, {
    balance: {
      query_id: queryId,
    },
  });

export const getValidatorsSigningInfosResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    signing_infos: {
      signing_infos: {
        address: string;
        start_height: string;
        index_offset: string;
        jailed_until: string;
        tombstoned: boolean;
        missed_blocks_counter: number;
      }[];
    };
    last_submitted_local_height: number;
  }>(contractAddress, {
    validators_signing_infos: {
      query_id: queryId,
    },
  });

export const getDelegatorUnbondingDelegationsResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    unbonding_delegations: {
      unbonding_responses: {
        delegator_address: string;
        validator_address: string;
        entries: {
          balance: string;
          completion_time: string | null;
          creation_height: number;
          initial_balance: string;
        }[];
      }[];
    };
    last_submitted_local_height: number;
  }>(contractAddress, {
    get_unbonding_delegations: {
      query_id: queryId,
    },
  });

export const getCosmosSigningInfosResult = async (sdkUrl: string) => {
  try {
    return (await axios.get(`${sdkUrl}/cosmos/slashing/v1beta1/signing_infos`))
      .data;
  } catch (e) {
    return null;
  }
};

export const getQueryDelegatorDelegationsResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    delegations: {
      delegator: string;
      validator: string;
      amount: {
        denom: string;
        amount: string;
      };
    }[];
    last_submitted_local_height: number;
  }>(contractAddress, {
    get_delegations: {
      query_id: queryId,
    },
  });

export const registerBalancesQuery = async (
  cm: WalletWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  denoms: string[],
  addr: string,
) => {
  const txResult = await cm.executeContract(contractAddress, {
    register_balances_query: {
      connection_id: connectionId,
      denoms: denoms,
      addr: addr,
      update_period: updatePeriod,
    },
  });

  const attribute = getEventAttribute(txResult.events, 'neutron', 'query_id');

  const queryId = parseInt(attribute);
  expect(queryId).toBeGreaterThanOrEqual(0);

  return queryId;
};

export const registerSigningInfoQuery = async (
  cm: WalletWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  valcons: string,
) => {
  const txResult = await cm.executeContract(contractAddress, {
    register_validators_signing_info_query: {
      connection_id: connectionId,
      validators: [valcons],
      update_period: updatePeriod,
    },
  });

  const attribute = getEventAttribute(txResult.events, 'neutron', 'query_id');

  const queryId = parseInt(attribute);
  expect(queryId).toBeGreaterThanOrEqual(0);

  return queryId;
};

export const registerUnbondingDelegationsQuery = async (
  cm: WalletWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  delegator: string,
  validator: string,
) => {
  const txResult = await cm.executeContract(contractAddress, {
    register_delegator_unbonding_delegations_query: {
      connection_id: connectionId,
      delegator,
      validators: [validator],
      update_period: updatePeriod,
    },
  });

  const attribute = getEventAttribute(txResult.events, 'neutron', 'query_id');

  const queryId = parseInt(attribute);
  expect(queryId).toBeGreaterThanOrEqual(0);

  return queryId;
};

export const acceptInterchainqueriesParamsChangeProposal = async (
  cm: WalletWrapper,
  title: string,
  description: string,
  key: string,
  value: string,
) => {
  const daoCoreAddress = await cm.chain.getNeutronDAOCore();
  const daoContracts = await getDaoContracts(cm.chain, daoCoreAddress);
  const dao = new Dao(cm.chain, daoContracts);
  const daoMember = new DaoMember(cm, dao);
  const chainManagerAddress = (await cm.chain.getChainAdmins())[0];
  const message = paramChangeProposal(
    {
      title,
      description,
      subspace: 'interchainqueries',
      key,
      value,
    },
    chainManagerAddress,
  );
  await dao.makeSingleChoiceProposalPass(
    [daoMember],
    title,
    description,
    [message],
    '1000',
  );
};

export const removeQuery = async (
  cm: WalletWrapper,
  contractAddress: string,
  queryId: number,
) =>
  await cm.executeContract(
    contractAddress,
    {
      remove_interchain_query: {
        query_id: queryId,
      },
    },
    [],
  );

export const removeQueryViaTx = async (
  cm: WalletWrapper,
  queryId: bigint,
  sender: string = cm.wallet.address,
) => await cm.msgRemoveInterchainQuery(queryId, sender);

export const registerDelegatorDelegationsQuery = async (
  cm: WalletWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  delegator: string,
  validators: string[],
) => {
  await cm.executeContract(contractAddress, {
    register_delegator_delegations_query: {
      delegator: delegator,
      validators: validators,
      connection_id: connectionId,
      update_period: updatePeriod,
    },
  });
};

export const validateBalanceQuery = async (
  neutronCm: CosmosWrapper,
  targetCm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
  address: string,
) => {
  const res = await getQueryBalanceResult(neutronCm, contractAddress, queryId);
  const directQueryResult = await targetCm.queryBalances(address);
  expect(filterIBCDenoms(res.balances.coins)).toEqual(
    filterIBCDenoms(directQueryResult),
  );
};

export const registerProposalVotesQuery = async (
  cm: WalletWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  proposalId: number,
  voters: string[],
) => {
  const txResult = await cm.executeContract(contractAddress, {
    register_government_proposal_votes_query: {
      connection_id: connectionId,
      update_period: updatePeriod,
      proposals_ids: [proposalId],
      voters: voters,
    },
  });

  const attribute = getEventAttribute(txResult.events, 'neutron', 'query_id');

  const queryId = parseInt(attribute);
  expect(queryId).toBeGreaterThanOrEqual(0);

  return queryId;
};

export const getProposalVotesResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    votes: {
      proposal_votes: {
        proposal_id: number;
        voter: string;
        options: any;
      }[];
    };
    last_submitted_local_height: number;
  }>(contractAddress, {
    government_proposal_votes: {
      query_id: queryId,
    },
  });

export const registerGovProposalsQuery = async (
  cm: WalletWrapper,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  proposalsIds: number[],
) => {
  const txResult = await cm.executeContract(contractAddress, {
    register_government_proposals_query: {
      connection_id: connectionId,
      update_period: updatePeriod,
      proposals_ids: proposalsIds,
    },
  });

  const attribute = getEventAttribute(txResult.events, 'neutron', 'query_id');

  const queryId = parseInt(attribute);
  expect(queryId).toBeGreaterThanOrEqual(0);

  return queryId;
};

export const getProposalsResult = (
  cm: CosmosWrapper,
  contractAddress: string,
  queryId: number,
) =>
  cm.queryContract<{
    proposals: {
      proposals: any[];
    };
    last_submitted_local_height: number;
  }>(contractAddress, {
    government_proposals: {
      query_id: queryId,
    },
  });
