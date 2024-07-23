import {
  CosmosWrapper,
  filterIBCDenoms,
  getEventAttribute,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { waitForICQResultWithRemoteHeight } from '@neutron-org/neutronjsplus/dist/icq';
import { paramChangeProposal } from '@neutron-org/neutronjsplus/dist/proposal';
import { WalletWrapper } from '@neutron-org/neutronjsplus/dist/walletWrapper';
import {
  CosmWasmClient,
  SigningCosmWasmClient,
} from '@cosmjs/cosmwasm-stargate';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { ProtobufRpcClient } from '@cosmjs/stargate';
import { getWithAttempts } from './misc';
import axios, { AxiosResponse } from 'axios';
import { WasmWrapper } from './wasmClient';
import { SigningNeutronClient } from './signing_neutron_client';

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
  user: string,
  client: SigningCosmWasmClient,
  rpcClient: ProtobufRpcClient,
  title: string,
  description: string,
  key: string,
  value: string,
) => {
  const daoCoreAddress = await getNeutronDAOCore(client, rpcClient);
  const daoContracts = await getDaoContracts(client, daoCoreAddress);
  const dao = new Dao(client, daoContracts);
  const daoMember = new DaoMember(dao, client, user, NEUTRON_DENOM);

  const queryClient = new AdminQueryClient(rpcClient);
  const admins = await queryClient.admins();
  const chainManagerAddress = admins.admins[0];
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
  await makeSingleChoiceProposalPass(
    client,
    dao,
    [daoMember],
    title,
    description,
    [message],
    '1000',
  );
};

// TODO: move somewhere
// TODO: move to neutron-integration-tests dao helpers
const makeSingleChoiceProposalPass = async (
  client: CosmWasmClient,
  dao: Dao,
  loyalVoters: DaoMember[],
  title: string,
  description: string,
  msgs: any[],
  deposit: string,
) => {
  const proposalId = await loyalVoters[0].submitSingleChoiceProposal(
    title,
    description,
    msgs,
    deposit,
  );
  await waitBlocks(1, client);

  for (const voter of loyalVoters) {
    await voter.voteYes(proposalId);
  }
  await loyalVoters[0].executeProposal(proposalId);

  await getWithAttempts(
    client,
    async () => await dao.queryProposal(proposalId),
    async (response) => response.proposal.status === 'executed',
    20,
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

/**
 * getRegisteredQuery queries the contract for a registered query details registered by the given
 * queryId.
 */
export const getRegisteredQuery = (
  ww: SigningNeutronClient,
  contractAddress: string,
  queryId: number,
) =>
  ww.client.queryContractSmart<{
    registered_query: {
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
    };
  }>(contractAddress, {
    get_registered_query: {
      query_id: queryId,
    },
  });

// TODO: move to helpers for neutron_interchain_queries contract
/**
 * @deprecated since version 0.5.0
 *
 * waitForICQResultWithRemoteHeight waits until ICQ gets updated to
 * reflect data corresponding to remote height `>= targetHeight`
 */
export const waitForICQResultWithRemoteHeight = (
  ww: WasmWrapper,
  contractAddress: string,
  queryId: number,
  targetHeight: number,
  numAttempts = 20,
) =>
  getWithAttempts(
    ww.client,
    () => getRegisteredQuery(ww, contractAddress, queryId),
    async (query) =>
      query.registered_query.last_submitted_result_remote_height
        .revision_height >= targetHeight,
    numAttempts,
  );

/**
 * queryTransfersNumber queries the contract for recorded transfers number.
 */
export const queryTransfersNumber = (
  ww: SigningNeutronClient,
  contractAddress: string,
) =>
  ww.client.queryContractSmart<{
    transfers_number: number;
  }>(contractAddress, {
    get_transfers_number: {},
  });

/**
 * waitForTransfersAmount waits until contract has `expectedTransfersAmount`
 * number of incoming transfers stored.
 */
export const waitForTransfersAmount = (
  ww: SigningNeutronClient,
  contractAddress: string,
  expectedTransfersAmount: number,
  numAttempts = 50,
) =>
  getWithAttempts(
    ww.client,
    async () =>
      (await queryTransfersNumber(ww, contractAddress)).transfers_number,
    async (amount) => amount == expectedTransfersAmount,
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
  cm: SigningNeutronClient,
  contractAddress: string,
  connectionId: string,
  updatePeriod: number,
  recipient: string,
) => {
  const res = await cm.execute(contractAddress, {
    register_transfers_query: {
      connection_id: connectionId,
      update_period: updatePeriod,
      recipient: recipient,
    },
  });

  if (res.code != 0) {
    throw new Error('res.code != 0');
  }
};

/**
 * queryRecipientTxs queries the contract for recorded transfers to the given recipient address.
 */
export const queryRecipientTxs = (
  cm: SigningNeutronClient,
  contractAddress: string,
  recipient: string,
) =>
  cm.client.queryContractSmart<{
    transfers: [
      recipient: string,
      sender: string,
      denom: string,
      amount: string,
    ];
  }>(contractAddress, {
    get_recipient_txs: {
      recipient: recipient,
    },
  });
