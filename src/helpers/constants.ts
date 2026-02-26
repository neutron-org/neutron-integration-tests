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
  TOKENFACTORY: 'tokenfactory.wasm',
  COINFACTORY: 'coinfactory.wasm',
  BEFORE_SEND_HOOK_TEST: 'before_send_hook_test.wasm',
  // https://github.com/CosmWasm/cosmwasm/tree/main/contracts/floaty
  FLOATY: '../contracts_thirdparty/floaty_2.0.wasm',
  DEX_GRPC: 'dex_grpc.wasm',
  CRON: 'cron.wasm',
  MARKETMAP: 'marketmap.wasm',
  ORACLE: 'oracle.wasm',
  IBC_RATE_LIMITER: 'rate_limiter.wasm',
};

export const NEUTRON_PREFIX = process.env.NEUTRON_ADDRESS_PREFIX || 'neutron';
export const COSMOS_PREFIX = process.env.COSMOS_ADDRESS_PREFIX || 'cosmos';
export const NEUTRON_RPC = process.env.NODE1_RPC || 'http://localhost:26657';
export const GAIA_RPC = process.env.NODE2_RPC || 'http://localhost:16657';
export const NEUTRON_REST = process.env.NODE1_URL || 'http://localhost:1317';
export const GAIA_REST = process.env.NODE2_URL || 'http://localhost:1316';
export const IBC_WEB_HOST = process.env.ICQ_WEB_HOST || 'http://localhost:9999';
export const GAIA_CONNECTION = 'connection-0';
export const WALLETS_SIGN_METHOD = process.env.WALLETS_SIGN_METHOD || 'random';

export const STAKING_VAULT =
  'neutron1jarq7kgdyd7dcfu2ezeqvg4w4hqdt3m5lv364d8mztnp9pzmwwwqjw7fvg';
export const STAKING_TRACKER =
  'neutron1nyuryl5u5z04dx4zsqgvsuw7fe8gl2f77yufynauuhklnnmnjncqcls0tj';
export const STAKING_REWARDS =
  'neutron1nhay73rdztlwwxnspup3y4uld59ylaumhddjt80eqmd0xl5e7mfqx0rnr3';
export const STAKING_INFO_PROXY =
  'neutron14xw3z6mhrhuckd46t2saxu7h90fzydnfu7xuewm4tmgl0dakkcjqxc3k6x';

export const VAL_MNEMONIC_1 =
  'clock post desk civil pottery foster expand merit dash seminar song memory figure uniform spice circle try happy obvious trash crime hybrid hood cushion';
export const VAL_MNEMONIC_2 =
  'angry twist harsh drastic left brass behave host shove marriage fall update business leg direct reward object ugly security warm tuna model broccoli choice';

export const SECOND_VALIDATOR_CONTAINER = 'neutron-node-1';
