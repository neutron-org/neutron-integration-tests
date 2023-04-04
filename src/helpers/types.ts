export type AcknowledgementResult =
  | { success: string[] }
  | { error: string[] }
  | { timeout: string };

export type ChannelsList = {
  channels: {
    state: string;
    ordering: string;
    counterparty: {
      port_id: string;
      channel_id: string;
    };
    connection_hops: string[];
    version: string;
    port_id: string;
    channel_id: string;
  }[];
};

// SingleChoiceProposal represents a single governance proposal item (partial object).
export type SingleChoiceProposal = {
  readonly title: string;
  readonly description: string;
  /// The address that created this proposal.
  readonly proposer: string;
  /// The block height at which this proposal was created. Voting
  /// power queries should query for voting power at this block
  /// height.
  readonly start_height: number;
  /// The threshold at which this proposal will pass.
  /// proposal's creation.
  readonly total_power: string;
  readonly proposal: {
    status:
      | 'open'
      | 'rejected'
      | 'passed'
      | 'executed'
      | 'closed'
      | 'execution_failed';
  };
};

export type TotalPowerAtHeightResponse = {
  readonly height: string;
  readonly power: number;
};

export type VotingPowerAtHeightResponse = {
  readonly height: string;
  readonly power: number;
};

// PageRequest is the params of pagination for request
export type PageRequest = {
  'pagination.key'?: string;
  'pagination.offset'?: string;
  'pagination.limit'?: string;
  'pagination.count_total'?: boolean;
};

// AckFailuresResponse is the response model for the contractmanager failures.
export type AckFailuresResponse = {
  failures: Failure[];
  pagination: {
    next_key: string;
    total: string;
  };
};

// Failure represents a single contractmanager failure
type Failure = {
  address: string;
  id: number;
  ack_id: number;
  ack_type: string;
};

export type ScheduleResponse = {
  schedules: Schedule[];
  pagination: {
    next_key: string;
    total: string;
  };
};

// Schedule represents a single cron added schedule
type Schedule = {
  name: string;
  period: number;
  msgs: any[];
};

// BalancesResponse is the response model for the bank balances query.
export type PauseInfoResponse = {
  paused: {
    until_height: number;
  };
  unpaused: Record<string, never>;
};

export const NeutronContract = {
  IBC_TRANSFER: 'ibc_transfer.wasm',
  MSG_RECEIVER: 'msg_receiver.wasm',
  INTERCHAIN_QUERIES: 'neutron_interchain_queries.wasm',
  INTERCHAIN_TXS: 'neutron_interchain_txs.wasm',
  MSG_RECEIVER: 'msg_receiver.wasm',
  REFLECT: 'reflect.wasm',
  TREASURY: 'neutron_treasury.wasm',
  DISTRIBUTION: 'neutron_distribution.wasm',
  DAO_CORE: 'cwd_core.wasm',
  DAO_PROPOSAL_SINGLE: 'cwd_proposal_single.wasm',
  DAO_PROPOSAL_MULTI: 'cwd_proposal_multiple.wasm',
  DAO_PREPROPOSAL_SINGLE: 'cwd_pre_propose_single.wasm',
  DAO_PREPROPOSAL_MULTI: 'cwd_pre_propose_multiple.wasm',
  DAO_PREPROPOSAL_OVERRULE: 'cwd_pre_propose_overrule.wasm',
  NEUTRON_VAULT: 'neutron_vault.wasm',
  RESERVE: 'neutron_reserve.wasm',
  SUBDAO_CORE: 'cwd_subdao_core.wasm',
  SUBDAO_PREPROPOSE: 'cwd_subdao_pre_propose_single.wasm',
  SUBDAO_PROPOSAL: 'cwd_subdao_proposal_single.wasm',
  SUBDAO_TIMELOCK: 'cwd_subdao_timelock_single.wasm',
  LOCKDROP_VAULT: 'lockdrop_vault.wasm',
  TGE_CREDITS: 'credits.wasm',
  TGE_AIRDROP: 'cw20_merkle_airdrop.wasm',
};

export type MultiChoiceOption = {
  description: string;
  msgs: any[];
};
