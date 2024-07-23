import { PageResponse } from '@neutron-org/cosmjs-types/cosmos/base/query/v1beta1/pagination';
import { Coin } from '@neutron-org/cosmjs-types/cosmos/base/v1beta1/coin';

// DEX queries

export type ParamsResponse = {
  params: Params;
};

export type LimitOrderTrancheUserResponse = {
  limit_order_tranche_user?: LimitOrderTrancheUser;
  withdrawable_shares?: string;
};

export type AllLimitOrderTrancheUserResponse = {
  limit_order_tranche_user: LimitOrderTrancheUser[];
  pagination?: PageResponse;
};

export type AllUserLimitOrdersResponse = {
  limit_orders: LimitOrderTrancheUser[];
  pagination?: PageResponse;
};

export type LimitOrderTrancheResponse = {
  limit_order_tranche?: LimitOrderTranche;
};

export type AllLimitOrderTrancheResponse = {
  limit_order_tranche: LimitOrderTranche[];
  pagination?: PageResponse;
};

export type AllUserDepositsResponse = {
  deposits: DepositRecord[];
  pagination?: PageResponse;
};

export type AllTickLiquidityResponse = {
  tick_liquidity: TickLiquidity[];
  pagination?: PageResponse;
};

export type InactiveLimitOrderTrancheResponse = {
  inactive_limit_order_tranche: LimitOrderTranche;
};

export type AllInactiveLimitOrderTrancheResponse = {
  inactive_limit_order_tranche: LimitOrderTranche[];
  pagination?: PageResponse;
};

export type AllPoolReservesResponse = {
  pool_reserves: PoolReserves[];
  pagination?: PageResponse;
};

export type PoolReservesResponse = {
  pool_reserves: PoolReserves;
};

export type EstimateMultiHopSwapResponse = {
  coin_out: Coin;
};

export type EstimatePlaceLimitOrderResponse = {
  // Total amount of coin used for the limit order
  // You can derive makerLimitInCoin using the equation: totalInCoin = swapInCoin + makerLimitInCoin
  total_in_coin: Coin;
  // Total amount of the token in that was immediately swapped for swapOutCoin
  swap_in_coin: Coin;
  // Total amount of coin received from the taker portion of the limit order
  // This is the amount of coin immediately available in the users account after executing the
  // limit order. It does not include any future proceeds from the maker portion which will have withdrawn in the future
  swap_out_coin: Coin;
};

export type PoolResponse = {
  pool: Pool;
};

export type PoolMetadataResponse = {
  pool_metadata: PoolMetadata;
};

export type AllPoolMetadataResponse = {
  pool_metadata: PoolMetadata[];
  pagination?: PageResponse;
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

/**
 * @deprecated since version 0.5.0
 */
export type LimitOrderTrancheUser = {
  trade_pair_id: TradePairID;
  tick_index_taker_to_maker: string; // Int64
  tranche_key: string;
  address: string;
  shares_owned: string; // Int128
  shares_withdrawn: string; // Int128
  shares_cancelled: string; // Int128
  order_type: LimitOrderType;
};

/**
 * @deprecated since version 0.5.0
 */
export type TradePairID = {
  maker_denom: string;
  taker_denom: string;
};

/**
 * @deprecated since version 0.5.0
 */
export type Params = {
  fee_tiers: string[]; // Uint64
  max_true_taker_spread: string; // PrecDec
};

/**
 * @deprecated since version 0.5.0
 */
export type LimitOrderTranche = {
  key: LimitOrderTrancheKey;
  reserves_maker_denom: string; // Int128
  reserves_taker_denom: string; // Int128
  total_maker_denom: string; // Int128
  total_taker_denom: string; // Int128
  expiration_time?: string; // Option<Int64>
  price_taker_to_maker: string; // PrecDec
};

/**
 * @deprecated since version 0.5.0
 */
export type LimitOrderTrancheKey = {
  trade_pair_id: TradePairID;
  tick_index_taker_to_maker: string; // Int64
  tranche_key: string;
};

/**
 * @deprecated since version 0.5.0
 */
export type DepositRecord = {
  pair_id: PairID;
  shares_owned: string; // Int128
  center_tick_index: string; // Int64
  lower_tick_index: string; // Int64
  upper_tick_index: string; // Int64
  fee?: string; // Option<Int64>
  total_shares?: string; // Option<Int128>
  pool?: Pool; // Option<Pool>
};

/**
 * @deprecated since version 0.5.0
 */
export type PairID = {
  token0: string;
  token1: string;
};

/**
 * @deprecated since version 0.5.0
 */
export type TickLiquidity =
  | { pool_reserves: PoolReserves }
  | { limit_order_tranche: LimitOrderTranche };

/**
 * @deprecated since version 0.5.0
 */
export type PoolReserves = {
  key: PoolReservesKey;
  reserves_maker_denom: string; // Int128
  price_taker_to_maker: string; // PrecDec
  price_opposite_taker_to_maker: string; // PrecDec
};

/**
 * @deprecated since version 0.5.0
 */
export type PoolReservesKey = {
  trade_pair_id: TradePairID;
  tick_index_taker_to_maker: string; // Int64
  fee?: string; // Option<Uint64>
};

/**
 * @deprecated since version 0.5.0
 */
export type Pool = {
  id: string; // Uint64
  lower_tick0: PoolReserves;
  lower_tick1: PoolReserves;
};

/**
 * @deprecated since version 0.5.0
 */
export type PoolMetadata = {
  id: string; // Uint64
  tick: string; // Int64
  fee: string; // Uint64
  pair_id: PairID;
};
