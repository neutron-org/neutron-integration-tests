import { cosmos } from '../generated/ibc/proto';

// DEX msgs

export type Deposit = {
  receiver: string;
  token_a: string;
  token_b: string;
  amounts_a: string[]; // uint128
  amounts_b: string[]; // uint128
  tick_indexes_a_to_b: number[]; // i64
  fees: number[]; // u64
  options: DepositOption[];
};

export type DepositOption = {
  disable_swap: boolean;
};

export type Withdrawal = {
  receiver: string;
  token_a: string; // denom
  token_b: string; // denom
  shares_to_remove: string[]; // uint128
  tick_indexes_a_to_b: number[]; //i64
  fees: number[]; //u64
};

export type PlaceLimitOrder = {
  receiver: string;
  token_in: string;
  token_out: string;
  tick_index_in_to_out: number; // i64
  amount_in: string; // uint64
  order_type: LimitOrderType;
  // expirationTime is only valid iff orderType == GOOD_TIL_TIME.
  expiration_time?: number; //u64
  max_amount_out?: string; //uint128
};

export type WithdrawFilledLimitOrder = {
  tranche_key: string;
};

export type CancelLimitOrder = {
  tranche_key: string;
};

export type MultiHopSwap = {
  receiver: string;
  routes: MultiHopRoute[];
  amount_in: string; // Uint128
  // TODO: impl PrecDec
  exit_limit_price: string; // PrecDec - Dec256 with 26 digit precision
  pick_best_route: boolean;
};

// DEX queries

// Parameters queries the parameters of the module.
export type ParamsQuery = Record<string, never>;
export type ParamsResponse = {
  params: Params;
};

// Queries a LimitOrderTrancheUser by index.
export type LimitOrderTrancheUserQuery = {
  address: string;
  tranche_key: string;
};
export type LimitOrderTrancheUserResponse = {
  limit_order_tranche_user?: LimitOrderTrancheUser;
};

// Queries a list of LimitOrderTrancheMap items.
export type LimitOrderTrancheUserAllQuery = {
  pagination?: cosmos.base.query.v1beta1.PageRequest;
};
export type AllLimitOrderTrancheUserResponse = {
  limit_order_tranche_user: LimitOrderTrancheUser[];
  pagination?: cosmos.base.query.v1beta1.PageResponse;
};

// Queries a list of LimitOrderTrancheUser items for a given address.
export type LimitOrderTrancheUserAllByAddressQuery = {
  address: string;
  pagination?: cosmos.base.query.v1beta1.PageRequest;
};
export type AllUserLimitOrdersResponse = {
  limit_orders: LimitOrderTrancheUser[];
  pagination?: cosmos.base.query.v1beta1.PageRequest;
};

// Queries a LimitOrderTranche by index.
export type LimitOrderTrancheQuery = {
  pair_id: string;
  tick_index: number; //i64
  token_in: string;
  tranche_key: string;
};
export type LimitOrderTrancheResponse = {
  limit_order_tranche?: LimitOrderTranche;
};

// Queries a list of LimitOrderTranche items for a given pairID / TokenIn combination.
export type LimitOrderTrancheAllQuery = {
  pair_id: string;
  token_in: string;
  pagination?: cosmos.base.query.v1beta1.PageRequest;
};
export type AllLimitOrderTrancheResponse = {
  limit_order_tranche: LimitOrderTranche[];
  pagination?: cosmos.base.query.v1beta1.PageResponse;
};

// Queries a list of UserDeposits items.
export type UserDepositAllQuery = {
  address: string;
  pagination?: cosmos.base.query.v1beta1.PageRequest;
};
export type AllUserDepositsResponse = {
  deposits: DepositRecord[];
  pagination?: cosmos.base.query.v1beta1.PageResponse;
};

// Queries a list of TickLiquidity items.
export type TickLiquidityAllQuery = {
  pair_id: string;
  token_in: string;
  pagination?: cosmos.base.query.v1beta1.PageRequest;
};
export type AllTickLiquidityResponse = {
  tick_liquidity: TickLiquidity[];
  pagination?: cosmos.base.query.v1beta1.PageResponse;
};

// Queries a InactiveLimitOrderTranche by index.
export type InactiveLimitOrderTrancheQuery = {
  pair_id: string;
  tick_index: number; //i64
  token_in: string;
  tranche_key: string;
};
export type InactiveLimitOrderTrancheResponse = {
  inactive_limit_order_tranche: LimitOrderTranche;
};

// Queries a list of InactiveLimitOrderTranche items.
export type InactiveLimitOrderTrancheAllQuery = {
  pagination?: cosmos.base.query.v1beta1.PageRequest;
};
export type AllInactiveLimitOrderTrancheResponse = {
  inactive_limit_order_tranche: LimitOrderTranche[];
  pagination?: cosmos.base.query.v1beta1.PageResponse;
};

// Queries a list of PoolReserves items.
export type PoolReservesAllQuery = {
  pair_id: string;
  token_in: string;
  pagination?: cosmos.base.query.v1beta1.PageRequest;
};
export type AllPoolReservesResponse = {
  pool_reserves: PoolReserves[];
  pagination?: cosmos.base.query.v1beta1.PageResponse;
};

// Queries a PoolReserve by index
export type PoolReversesQuery = {
  pair_id: string;
  token_in: string;
  tick_index: number; //i64
  fee: number; //u64
};
export type PoolReservesResponse = {
  pool_reserves: PoolReserves;
};

// Queries the simulated result of a multihop swap
export type EstimateMultiHopSwapQuery = {
  creator: string;
  receiver: string;
  routes: MultiHopRoute[];
  amount_id: string; //Int128
  exit_limit_price: string; //PrecDec
  pick_best_route: boolean;
};
export type EstimateMultiHopSwapResponse = {
  coin_out: cosmos.base.v1beta1.Coin;
};

// Queries the simulated result of a PlaceLimit order
export type EstimatePlaceLimitOrderQuery = {
  creator: string;
  receiver: string;
  token_in: string;
  token_out: string;
  tick_index_in_to_out: string; //uint128
  order_type: LimitOrderType;
  // expirationTime is only valid iff orderType == GOOD_TIL_TIME.
  expiration_time?: number; //u64 - unixtime
  max_amount_out?: string; //Int128
};
export type EstimatePlaceLimitOrderResponse = {
  // Total amount of coin used for the limit order
  // You can derive makerLimitInCoin using the equation: totalInCoin = swapInCoin + makerLimitInCoin
  total_in_coin: cosmos.base.v1beta1.Coin;
  // Total amount of the token in that was immediately swapped for swapOutCoin
  swap_in_coin: cosmos.base.v1beta1.Coin;
  // Total amount of coin received from the taker portion of the limit order
  // This is the amount of coin immediately available in the users account after executing the
  // limit order. It does not include any future proceeds from the maker portion which will have withdrawn in the future
  swap_out_coin: cosmos.base.v1beta1.Coin;
};

// Queries a pool by pair, tick and fee
export type PoolQuery = {
  pair_id: string;
  tick_index: number; //i64
  fee: number; //u64
};

// Queries a pool by ID
export type PoolByIDQuery = {
  pool_id: number; //u64
};
export type PoolResponse = {
  pool: Pool;
};

// Queries a PoolMetadata by ID
export type PoolMetadataQuery = {
  id: number; //u64
};
export type PoolMetadataResponse = {
  pool_metadata: PoolMetadata;
};

// Queries a list of PoolMetadata items.
export type PoolMetadataAllQuery = {
  pagination?: cosmos.base.query.v1beta1.PageRequest;
};
export type AllPoolMetadataResponse = {
  pool_metadata: PoolMetadata[];
  pagination?: cosmos.base.query.v1beta1.PageResponse;
};

// types

export enum LimitOrderType {
  GoodTilCanceled = 0,
  FillOrKill = 1,
  ImmediateOrCancel = 2,
  JustInTime = 3,
  GoodTilTime = 4,
}

export type MultiHopRoute = {
  hops: string[];
};

export type LimitOrderTrancheUser = {
  trade_pair_id: TradePairID;
  tick_index_taker_to_maker: number; //u64
  tranche_key: string;
  address: string;
  shares_owned: string; // Int128
  shares_withdrawn: string; // Int128
  shares_cancelled: string; // Int128
  order_type: LimitOrderType;
};

export type TradePairID = {
  maker_denom: string;
  taker_denom: string;
};

export type Params = {
  fee_tiers: number[]; //u64
};

export type LimitOrderTranche = {
  key: LimitOrderTrancheKey;
  reserves_maker_denom: string; // Int128
  reserves_taker_denom: string; // Int128
  total_maker_denom: string; // Int128
  total_taker_denom: string; // Int128
  expiration_time: number; //u64
  price_taker_to_maker: string; //PrecDec
};

export type LimitOrderTrancheKey = {
  trade_pair_id: TradePairID;
  tick_index_taker_to_maker: number; //u64
  tranche_key: string;
};

export type DepositRecord = {
  pair_id: PairID;
  shares_owned: string; //Int128
  center_tick_index: number; // i64
  lower_tick_index: number; // i64
  ipper_tick_index: number; // i64
  fee: number; //u64
};

export type PairID = {
  tokeno: string;
  token1: string;
};

export type TickLiquidity = {
  liquidity:
    | { pool_reserves: PoolReserves }
    | { limit_order_tranche: LimitOrderTranche };
};

export type PoolReserves = {
  key: PoolReservesKey;
  reserves_maker_denom: number; //Int128;
  price_taker_to_maker: number; //Int128;
  price_opposite_taker_to_maker: number; //PrecDec;
};

export type PoolReservesKey = {
  trade_pair_id: TradePairID;
  tick_index_taker_to_maker: number; //i64,
  fee: number; //u64,
};

export type Pool = {
  id: number; //u64;
  lower_tick0: PoolReserves;
  lower_tick1: PoolReserves;
};

export type PoolMetadata = {
  id: number; //u64;
  tick: number; //i64;
  fee: number; //u64;
  pair_id: PairID;
};
