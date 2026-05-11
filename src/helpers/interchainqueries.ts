import { getEventAttribute } from '@neutron-org/neutronjsplus/dist/cosmos';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import { SigningStargateClient } from '@cosmjs/stargate';
import { getWithAttempts } from './misc';
import axios, { AxiosResponse } from 'axios';
import { NeutronTestClient } from './neutron_test_client';
import { IBC_ATOM_DENOM, IBC_USDC_DENOM, NEUTRON_DENOM } from './constants';
import { Coin } from '@neutron-org/neutronjs/cosmos/base/v1beta1/coin';
import { QueryClientImpl as BankQuerier } from 'cosmjs-types/cosmos/bank/v1beta1/query';
import {
  MsgRemoveInterchainQueryRequest,
  MsgUpdateParams,
} from '@neutron-org/neutronjs/neutron/interchainqueries/tx';
import { Params } from '@neutron-org/neutronjs/neutron/interchainqueries/params';
import { expect } from 'vitest';
import { executeMsgSubmitProposalV1, executeMsgVoteNeutron } from './gov';
import { Wallet } from './wallet';

const GOV_MODULE_ADDRESS = 'neutron10d07y265gmmuvt4z0w9aw880jnsr700j7a68v5';

const ICQ_PARAMS_GOV_DEPOSIT = [{ denom: NEUTRON_DENOM, amount: '60000000' }];
const ICQ_PARAMS_GOV_FEE = {
  gas: '4000000',
  amount: [{ denom: NEUTRON_DENOM, amount: '10000' }],
};

/**
 * Submits and passes via x/gov a full interchainqueries module params update (`MsgUpdateParams`).
 * Callers supply the final `params` object in full (typically `Params.fromPartial({ ...await querier.params().params, ... })` in tests).
 */
export const submitInterchainQueriesParamsGovProposal = async (
  govClient: NeutronTestClient,
  govWallet: Wallet,
  title: string,
  summary: string,
  params: Params,
): Promise<void> => {
  const res = await executeMsgSubmitProposalV1(
    govClient,
    govWallet,
    title,
    summary,
    '',
    [
      {
        typeUrl: MsgUpdateParams.typeUrl,
        value: MsgUpdateParams.encode(
          MsgUpdateParams.fromPartial({
            authority: GOV_MODULE_ADDRESS,
            params,
          }),
        ).finish(),
      },
    ],
    ICQ_PARAMS_GOV_DEPOSIT,
    true,
    ICQ_PARAMS_GOV_FEE,
  );
  expect(res.code).toEqual(0);
  const proposalId = parseInt(
    getEventAttribute(res.events, 'submit_proposal', 'proposal_id') || '0',
    10,
  );
  const voteRes = await executeMsgVoteNeutron(govClient, govWallet, proposalId);
  expect(voteRes.code).toEqual(0);
  await waitSeconds(15);
};

export const getKvCallbackStatus = async (
  client: NeutronTestClient,
  contractAddress: string,
  queryId: number,
): Promise<{
  last_update_height: number;
}> =>
  client.queryContractSmart(contractAddress, {
    kv_callback_stats: {
      query_id: queryId,
    },
  });

export const filterIBCDenoms = (list: Coin[]): Coin[] =>
  list.filter(
    (coin) =>
      coin.denom && ![IBC_ATOM_DENOM, IBC_USDC_DENOM].includes(coin.denom),
  );

export const watchForKvCallbackUpdates = async (
  neutronClient: NeutronTestClient,
  targetClient: SigningStargateClient,
  contractAddress: string,
  queryIds: number[],
) => {
  const statusPrev = await Promise.all(
    queryIds.map((i) => getKvCallbackStatus(neutronClient, contractAddress, i)),
  );
  const targetHeight = await targetClient.getHeight();
  await Promise.all(
    queryIds.map((i) =>
      waitForICQResultWithRemoteHeight(
        neutronClient,
        contractAddress,
        i,
        targetHeight,
      ),
    ),
  );
  const status = await Promise.all(
    queryIds.map((i) => getKvCallbackStatus(neutronClient, contractAddress, i)),
  );
  for (const i in status) {
    expect(statusPrev[i].last_update_height).toBeLessThan(
      status[i].last_update_height,
    );
  }
};

export const getQueryBalanceResult = async (
  client: CosmWasmClient,
  contractAddress: string,
  queryId: number,
): Promise<{
  balances: {
    coins: {
      denom: string;
      amount: string;
    }[];
  };
  last_submitted_local_height: number;
}> =>
  client.queryContractSmart(contractAddress, {
    balance: {
      query_id: queryId,
    },
  });

export const getValidatorsSigningInfosResult = async (
  client: CosmWasmClient,
  contractAddress: string,
  queryId: number,
): Promise<{
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
}> =>
  client.queryContractSmart(contractAddress, {
    validators_signing_infos: {
      query_id: queryId,
    },
  });

export const getDelegatorUnbondingDelegationsResult = async (
  client: CosmWasmClient,
  contractAddress: string,
  queryId: number,
): Promise<{
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
}> =>
  client.queryContractSmart(contractAddress, {
    get_unbonding_delegations: {
      query_id: queryId,
    },
  });

export const getQueryDelegatorDelegationsResult = async (
  client: NeutronTestClient,
  contractAddress: string,
  queryId: number,
): Promise<{
  delegations: {
    delegator: string;
    validator: string;
    amount: {
      denom: string;
      amount: string;
    };
  }[];
  last_submitted_local_height: number;
}> =>
  client.queryContractSmart(contractAddress, {
    get_delegations: {
      query_id: queryId,
    },
  });

export const registerBalancesQuery = async (
  client: NeutronTestClient,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  denoms: string[],
  addr: string,
) => {
  const txResult = await client.execute(contractAddress, {
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
  client: NeutronTestClient,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  validatorCons: string,
) => {
  const txResult = await client.execute(contractAddress, {
    register_validators_signing_info_query: {
      connection_id: connectionId,
      validators: [validatorCons],
      update_period: updatePeriod,
    },
  });

  const attribute = getEventAttribute(txResult.events, 'neutron', 'query_id');

  const queryId = parseInt(attribute);
  expect(queryId).toBeGreaterThanOrEqual(0);

  return queryId;
};

export const registerUnbondingDelegationsQuery = async (
  client: NeutronTestClient,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  delegator: string,
  validator: string,
) => {
  const txResult = await client.execute(contractAddress, {
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

export const removeQuery = async (
  client: NeutronTestClient,
  contractAddress: string,
  queryId: number,
) =>
  await client.execute(
    contractAddress,
    {
      remove_interchain_query: {
        query_id: queryId,
      },
    },
    [],
  );

export const removeQueryViaTx = async (
  client: NeutronTestClient,
  queryId: bigint,
  sender: string = client.sender,
) =>
  await client.signAndBroadcast(
    [
      {
        typeUrl: MsgRemoveInterchainQueryRequest.typeUrl,
        value: MsgRemoveInterchainQueryRequest.fromPartial({
          queryId: queryId,
          sender: sender,
        }),
      },
    ],
    {
      gas: '200000',
      amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
    },
  );

export const registerDelegatorDelegationsQuery = async (
  client: NeutronTestClient,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  delegator: string,
  validators: string[],
) => {
  await client.execute(contractAddress, {
    register_delegator_delegations_query: {
      delegator: delegator,
      validators: validators,
      connection_id: connectionId,
      update_period: updatePeriod,
    },
  });
};

export const validateBalanceQuery = async (
  neutronClient: NeutronTestClient,
  bankQuerier: BankQuerier,
  contractAddress: string,
  queryId: number,
  address: string,
) => {
  const res = await getQueryBalanceResult(
    neutronClient,
    contractAddress,
    queryId,
  );

  const balances = await bankQuerier.AllBalances({
    address: address,
    resolveDenom: false,
  });

  expect(filterIBCDenoms(res.balances.coins)).toEqual(
    filterIBCDenoms(balances.balances),
  );
};

export const registerProposalVotesQuery = async (
  client: NeutronTestClient,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  proposalId: number,
  voters: string[],
) => {
  const txResult = await client.execute(contractAddress, {
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
  client: NeutronTestClient,
  contractAddress: string,
  queryId: number,
): Promise<{
  votes: {
    proposal_votes: {
      proposal_id: number;
      voter: string;
      options: any;
    }[];
  };
  last_submitted_local_height: number;
}> =>
  client.queryContractSmart(contractAddress, {
    government_proposal_votes: {
      query_id: queryId,
    },
  });

export const registerGovProposalsQuery = async (
  client: NeutronTestClient,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  proposalsIds: number[],
) => {
  const txResult = await client.execute(contractAddress, {
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
  client: NeutronTestClient,
  contractAddress: string,
  queryId: number,
): Promise<{
  proposals: {
    proposals: any[];
  };
  last_submitted_local_height: number;
}> =>
  client.queryContractSmart(contractAddress, {
    government_proposals: {
      query_id: queryId,
    },
  });

/**
 * getRegisteredQuery queries the contract for a registered query details registered by the given
 * queryId.
 */
export const getRegisteredQuery = async (
  client: NeutronTestClient,
  contractAddress: string,
  queryId: number,
): Promise<{
  id: number;
  owner: string;
  keys: {
    path: string;
    key: string;
  }[];
  query_type: string;
  transactions_filter: string;
  connection_id: string;
  update_period: number;
  last_submitted_result_local_height: number;
  last_submitted_result_remote_height: {
    revision_number: number;
    revision_height: number;
  };
  deposit: { denom: string; amount: string }[];
  submit_timeout: number;
  registered_at_height: number;
}> =>
  client.queryContractSmart(contractAddress, {
    get_registered_query: {
      query_id: queryId,
    },
  });

export const waitForICQResultWithRemoteHeight = (
  client: NeutronTestClient,
  contractAddress: string,
  queryId: number,
  targetHeight: number,
  numAttempts = 20,
) =>
  getWithAttempts(
    client,
    () => getRegisteredQuery(client, contractAddress, queryId),
    async (query) =>
      +query.last_submitted_result_remote_height.revision_height >=
      targetHeight,
    numAttempts,
  );

/**
 * queryTransfersNumber queries the contract for recorded transfers number.
 */
export const queryTransfersNumber = (
  client: NeutronTestClient,
  contractAddress: string,
): Promise<{
  transfers_number: number;
}> =>
  client.queryContractSmart(contractAddress, {
    get_transfers_number: {},
  });

/**
 * waitForTransfersAmount waits until contract has `expectedTransfersAmount`
 * number of incoming transfers stored.
 */
export const waitForTransfersAmount = (
  client: NeutronTestClient,
  contractAddress: string,
  expectedTransfersAmount: number,
  numAttempts = 50,
) =>
  getWithAttempts(
    client,
    async () =>
      (await queryTransfersNumber(client, contractAddress)).transfers_number,
    async (amount) => amount.toString() == expectedTransfersAmount.toString(),
    numAttempts,
  );

// TODO: description
type UnsuccessfulSubmitIcqTx = {
  // QueryID is the query_id transactions was submitted for
  query_id: number;
  // SubmittedTxHash is the hash of the *remote fetched transaction* was submitted
  submitted_tx_hash: string;
  // NeutronHash is the hash of the *neutron chain transaction* which is responsible for delivering remote transaction to neutron
  neutron_hash: string;
  // ErrorTime is the time when the error was added
  error_time: string;
  // Status is the status of unsuccessful tx
  status: string;
  // Message is the more descriptive message for the error
  message: string;
};

// TODO: description
export type ResubmitQuery = {
  query_id: number;
  hash: string;
};

// TODO: description
export const getUnsuccessfulTxs = async (
  icqWebHost: string,
): Promise<Array<UnsuccessfulSubmitIcqTx>> => {
  const url = `${icqWebHost}/unsuccessful-txs`;
  const req = await axios.get<Array<UnsuccessfulSubmitIcqTx>>(url);
  return req.data;
};

// TODO: description
export const postResubmitTxs = async (
  icqWebHost: string,
  txs: Array<ResubmitQuery>,
): Promise<AxiosResponse> => {
  const url = `${icqWebHost}/resubmit-txs`;
  const data = { txs: txs };
  return await axios.post(url, data);
};

/**
 * registerTransfersQuery sends a register_transfers_query execute msg to the contractAddress with
 * the given parameters and checks the tx result to be successful.
 */
export const registerTransfersQuery = async (
  client: NeutronTestClient,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  recipients: string[],
) => {
  const res = await client.execute(contractAddress, {
    register_transfers_query: {
      connection_id: connectionId,
      update_period: updatePeriod,
      recipients: recipients,
    },
  });

  if (res.code != 0) {
    throw new Error('res.code != 0');
  }
};

/**
 * queryRecipientTxs queries the contract for recorded transfers to the given recipient address.
 */
export const queryRecipientTxs = async (
  client: NeutronTestClient,
  contractAddress: string,
  recipient: string,
): Promise<{
  transfers: [recipient: string, sender: string, denom: string, amount: string];
}> =>
  client.queryContractSmart(contractAddress, {
    get_recipient_txs: {
      recipient: recipient,
    },
  });
