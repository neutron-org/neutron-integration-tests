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
    readonly votes: {
      yes: string;
      no: string;
      abstain: string;
    };
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
  REFLECT: 'reflect.wasm',
  DISTRIBUTION: 'neutron_distribution.wasm',
  DAO_CORE: 'cwd_core.wasm',
  DAO_PROPOSAL_SINGLE: 'cwd_proposal_single.wasm',
  DAO_PROPOSAL_MULTI: 'cwd_proposal_multiple.wasm',
  DAO_PREPROPOSAL_SINGLE: 'cwd_pre_propose_single.wasm',
  DAO_PREPROPOSAL_MULTI: 'cwd_pre_propose_multiple.wasm',
  DAO_PREPROPOSAL_OVERRULE: 'cwd_pre_propose_overrule.wasm',
  VOTING_REGISTRY: 'neutron_voting_registry.wasm',
  NEUTRON_VAULT: 'neutron_vault.wasm',
  RESERVE: 'neutron_reserve.wasm',
  SUBDAO_CORE: 'cwd_subdao_core.wasm',
  SUBDAO_PREPROPOSE: 'cwd_subdao_pre_propose_single.wasm',
  SUBDAO_PROPOSAL: 'cwd_subdao_proposal_single.wasm',
  SUBDAO_TIMELOCK: 'cwd_subdao_timelock_single.wasm',
  LOCKDROP_VAULT_V2: 'lockdrop_vault.wasm',
  LOCKDROP_VAULT: '../contracts_thirdparty/lockdrop_vault.wasm',
  ORACLE_HISTORY: 'astroport_oracle.wasm',
  TGE_CREDITS: 'credits.wasm',
  TGE_AIRDROP: 'cw20_merkle_airdrop.wasm',
  CW4_VOTING: '../contracts_thirdparty/cw4_voting.wasm',
  CW4_GROUP: '../contracts_thirdparty/cw4_group.wasm',
  CW20_BASE: '../contracts_thirdparty/cw20_base.wasm',
  TGE_AUCTION: 'neutron_auction.wasm',
  TGE_LOCKDROP: '../contracts_thirdparty/neutron_lockdrop.wasm',
  TGE_LOCKDROP_V2: 'neutron_lockdrop.wasm',
  TGE_PRICE_FEED_MOCK: 'neutron_price_feed_mock.wasm',
  ASTRO_PAIR: '../contracts_thirdparty/astroport_pair.wasm',
  ASTRO_PAIR_CL: '../contracts_thirdparty/astroport_pair_concentrated.wasm',
  ASTRO_COIN_REGISTRY:
    '../contracts_thirdparty/astroport_native_coin_registry.wasm',
  ASTRO_FACTORY: '../contracts_thirdparty/astroport_factory.wasm',
  ASTRO_TOKEN: '../contracts_thirdparty/astroport_token.wasm',
  ASTRO_GENERATOR: '../contracts_thirdparty/astroport_generator.wasm',
  ASTRO_WHITELIST: '../contracts_thirdparty/astroport_whitelist.wasm',
  ASTRO_VESTING: '../contracts_thirdparty/astroport_vesting.wasm',
  VESTING_LP: 'vesting_lp.wasm',
  VESTING_LP_VAULT: 'vesting_lp_vault.wasm',
  CREDITS_VAULT: 'credits_vault.wasm',
  VESTING_INVESTORS: 'vesting_investors.wasm',
  INVESTORS_VESTING_VAULT: 'investors_vesting_vault.wasm',
  TOKENFACTORY: 'tokenfactory.wasm',
};

export type MultiChoiceOption = {
  description: string;
  msgs: any[];
};

// https://github.com/cosmos/cosmos-sdk/blob/main/proto/cosmos/upgrade/v1beta1/query.proto#L53
export type CurrentPlanResponse = {
  plan: Plan | null;
};

// https://github.com/cosmos/cosmos-sdk/blob/main/proto/cosmos/upgrade/v1beta1/upgrade.proto#L14
export type Plan = {
  name: string;
  height: string;
  info: string;
};

export const nativeToken = (denom: string, amount: string): Asset => ({
  info: nativeTokenInfo(denom),
  amount: amount,
});

export const token = (contractAddr: string, amount: string): Asset => ({
  info: tokenInfo(contractAddr),
  amount: amount,
});

export const nativeTokenInfo = (denom: string): NativeToken => ({
  native_token: {
    denom: denom,
  },
});

export const tokenInfo = (contractAddr: string): Token => ({
  token: {
    contract_addr: contractAddr,
  },
});

export const vestingAccount = (
  addr: string,
  schedules: VestingSchedule[],
): VestingAccount => ({
  address: addr,
  schedules: schedules,
});

export const vestingSchedule = (
  startPoint: VestingSchedulePoint,
  endPoint?: VestingSchedulePoint,
): VestingSchedule => ({
  start_point: startPoint,
  end_point: endPoint,
});

export const vestingSchedulePoint = (
  time: number,
  amount: string,
): VestingSchedulePoint => ({
  time: time,
  amount: amount,
});

export type PoolStatus = {
  assets: Asset[];
  total_share: string;
};

export type Asset = {
  info: Token | NativeToken;
  amount: string;
};

export type Token = {
  token: {
    contract_addr: string;
  };
};

export type NativeToken = {
  native_token: {
    denom: string;
  };
};

export type VestingAccount = {
  address: string;
  schedules: VestingSchedule[];
};

export type VestingSchedule = {
  start_point: VestingSchedulePoint;
  end_point: VestingSchedulePoint | undefined;
};

export type VestingSchedulePoint = {
  time: number;
  amount: string;
};

export type PinnedCodesResponse = {
  code_ids: number[];
};

export type IcaHostParamsResponse = {
  params: {
    host_enabled: boolean;
  };
};

export type ContractAdminResponse = {
  contract_info: {
    admin: string;
  };
};
