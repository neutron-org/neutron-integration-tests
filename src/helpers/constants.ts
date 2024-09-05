export const NEUTRON_DENOM = 'untrn';
export const IBC_ATOM_DENOM = 'uibcatom';
export const IBC_USDC_DENOM = 'uibcusdc';
export const COSMOS_DENOM = 'uatom';
export const IBC_RELAYER_NEUTRON_ADDRESS =
  'neutron1mjk79fjjgpplak5wq838w0yd982gzkyf8fxu8u';
export const CONTRACTS = {
  IBC_TRANSFER: 'ibc_transfer.wasm',
  MSG_RECEIVER: 'msg_receiver.wasm',
  GRPC_QUERIER: 'grpc_querier.wasm',
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
  SUBDAO_PREPROPOSE_NO_TIMELOCK: 'cwd_security_subdao_pre_propose.wasm',
  SUBDAO_PROPOSAL: 'cwd_subdao_proposal_single.wasm',
  SUBDAO_TIMELOCK: 'cwd_subdao_timelock_single.wasm',
  LOCKDROP_VAULT: 'lockdrop_vault.wasm',
  ORACLE_HISTORY: 'astroport_oracle.wasm',
  TGE_CREDITS: 'credits.wasm',
  TGE_AIRDROP: 'cw20_merkle_airdrop.wasm',
  CW4_VOTING: '../contracts_thirdparty/cw4_voting.wasm',
  CW4_GROUP: '../contracts_thirdparty/cw4_group.wasm',
  CW20_BASE: '../contracts_thirdparty/cw20_base.wasm',
  TGE_AUCTION: 'neutron_auction.wasm',
  TGE_LOCKDROP: 'neutron_lockdrop.wasm',
  TGE_LOCKDROP_PCL: 'neutron_lockdrop_pcl.wasm',
  TGE_PRICE_FEED_MOCK: 'neutron_price_feed_mock.wasm',
  ASTRO_PAIR_XYK: '../contracts_thirdparty/astroport_pair.wasm',
  ASTRO_PAIR_PCL: '../contracts_thirdparty/astroport_pair_concentrated.wasm',
  ASTRO_COIN_REGISTRY:
    '../contracts_thirdparty/astroport_native_coin_registry.wasm',
  ASTRO_FACTORY: '../contracts_thirdparty/astroport_factory.wasm',
  ASTRO_TOKEN: '../contracts_thirdparty/astroport_xastro_token.wasm',
  ASTRO_GENERATOR: '../contracts_thirdparty/astroport_generator.wasm',
  ASTRO_INCENTIVES: '../contracts_thirdparty/astroport_incentives.wasm',
  ASTRO_WHITELIST: '../contracts_thirdparty/astroport_whitelist.wasm',
  ASTRO_VESTING: '../contracts_thirdparty/astroport_vesting.wasm',
  VESTING_LP_PCL: 'vesting_lp_pcl.wasm',
  VESTING_LP: 'vesting_lp.wasm',
  VESTING_LP_VAULT: 'vesting_lp_vault.wasm',
  CREDITS_VAULT: 'credits_vault.wasm',
  VESTING_INVESTORS: 'vesting_investors.wasm',
  INVESTORS_VESTING_VAULT: 'investors_vesting_vault.wasm',
  TOKENFACTORY: 'tokenfactory.wasm',
  BEFORE_SEND_HOOK_TEST: 'before_send_hook_test.wasm',
  // https://github.com/CosmWasm/cosmwasm/tree/main/contracts/floaty
  FLOATY: '../contracts_thirdparty/floaty_2.0.wasm',
  DEX_GRPC: 'dex_grpc.wasm',
  DEX_DEV: 'dex.wasm',
  CRON: 'cron.wasm',

  // TGE liquidity migration related contracts with fixed versions

  // pre-migration mainnet version of the lockdrop contract
  TGE_LOCKDROP_CURRENT:
    '../contracts_tge_migration/current_neutron_lockdrop.wasm',
  // pre-migration mainnet version of the vesting lp contract
  VESTING_LP_CURRENT: '../contracts_tge_migration/current_vesting_lp.wasm',
  // pre-migration mainnet version of the reserve contract
  RESERVE_CURRENT: '../contracts_tge_migration/current_neutron_reserve.wasm',

  VESTING_LP_VAULT_CL: 'vesting_lp_vault_for_cl_pools.wasm',
  LOCKDROP_VAULT_CL: 'lockdrop_vault_for_cl_pools.wasm',
  MARKETMAP: 'marketmap.wasm',
  ORACLE: 'oracle.wasm',
};

export const NEUTRON_PREFIX = process.env.NEUTRON_ADDRESS_PREFIX || 'neutron';
export const COSMOS_PREFIX = process.env.COSMOS_ADDRESS_PREFIX || 'cosmos';
