// vesting lp:
// 1. prerequisites: vesting-lp contract, atom oracle contract and usdc oracle contract
// 1.1. init vesting-lp, set asset_infos by manager, add vesting accounts
// 1.2. init pools, provide liquidity
// 1.3. init oracles aimed to pools

import { proto } from '@cosmos-client/core';
import _ from 'lodash';
import {
  CosmosWrapper,
  IBC_ATOM_DENOM,
  IBC_USDC_DENOM,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import {
  NeutronContract,
  nativeToken,
  PoolStatus,
  Asset,
  nativeTokenInfo,
} from '../../helpers/types';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';

// general contract keys used across the tests
const ASTRO_PAIR_CONTRACT_KEY = 'ASTRO_PAIR';
const ASTRO_FACTORY_CONTRACT_KEY = 'ASTRO_FACTORY';
const ASTRO_TOKEN_CONTRACT_KEY = 'ASTRO_TOKEN';
const ASTRO_COIN_REGISTRY_CONTRACT_KEY = 'ASTRO_COIN_REGISTRY';
const VESTING_LP_CONTRACT_KEY = 'VESTING_LP';
const VESTING_LP_VAULT_CONTRACT_KEY = 'VESTING_LP_VAULT';
const ORACLE_HISTORY_CONTRACT_KEY = 'ORACLE_HISTORY';
// specific contract keys used across the tests
const VESTING_LP_USDC_CONTRACT_KEY = 'VESTING_LP_USDC';
const VESTING_LP_ATOM_CONTRACT_KEY = 'VESTING_LP_ATOM';
const ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY = 'ORACLE_HISTORY_NTRN_USDC';
const ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY = 'ORACLE_HISTORY_NTRN_ATOM';
const NTRN_ATOM_PAIR_CONTRACT_KEY = 'NTRN_ATOM_PAIR';
const NTRN_ATOM_LP_TOKEN_CONTRACT_KEY = 'NTRN_ATOM_LP_TOKEN';
const NTRN_USDC_PAIR_CONTRACT_KEY = 'NTRN_USDC_PAIR';
const NTRN_USDC_LP_TOKEN_CONTRACT_KEY = 'NTRN_USDC_LP_TOKEN';

type PrecisionResponse = {
  denom: string;
  decimals: number;
};

type PairInfo = {
  asset_infos: Record<'native_token' | 'token', { denom: string }>[];
  contract_addr: string;
  liquidity_token: string;
  pair_type: Record<string, object>;
};

type VestingLpVaultConfig = {
  name: string;
  description: string;
  atom_vesting_lp_contract: string;
  atom_oracle_contract: string;
  usdc_vesting_lp_contract: string;
  usdc_oracle_contract: string;
  owner: string;
  manager: string | undefined;
};

describe('Neutron / TGE / Vesting vault', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let cmInstantiator: WalletWrapper;
  let cmManager: WalletWrapper;
  let cmStranger: WalletWrapper;
  let contractAddresses: Record<string, string> = {};

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    cmInstantiator = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    cmManager = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFour.genQaWal1,
    );
    cmStranger = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFive.genQaWal1,
    );
    contractAddresses = await deployContracts(
      neutronChain,
      cmInstantiator,
      cmManager,
    );
  });

  describe('vesting LP vault', () => {
    test('check initial config', async () => {
      const vault_address = contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY];
      const config = await neutronChain.queryContract<VestingLpVaultConfig>(
        vault_address,
        { get_config: {} },
      );
      expect(config.name).toEqual('Vesting lp vault ATOM');
      expect(config.description).toEqual('A vesting lp vault for ATOM');
      expect(config.atom_vesting_lp_contract).toEqual(
        contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
      );
      expect(config.atom_oracle_contract).toEqual(
        contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
      );
      expect(config.usdc_vesting_lp_contract).toEqual(
        contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
      );
      expect(config.usdc_oracle_contract).toEqual(
        contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
      );
      expect(config.owner).toEqual(cmInstantiator.wallet.address.toString());
      expect(config.manager).toEqual(cmManager.wallet.address.toString());
    });

    test('make sure bonding is disabled', async () => {
      const vault_address = contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY];
      await expect(
        neutronChain.queryContract(vault_address, { list_bonders: {} }),
      ).rejects.toThrow(/Bonding is not available for this contract/);

      await expect(
        neutronChain.queryContract(vault_address, {
          bonding_status: { address: 'addr' },
        }),
      ).rejects.toThrow(/Bonding is not available for this contract/);

      await expect(
        cmInstantiator.executeContract(
          vault_address,
          JSON.stringify({ bond: {} }),
        ),
      ).rejects.toThrow(/Bonding is not available for this contract/);

      await expect(
        cmInstantiator.executeContract(
          vault_address,
          JSON.stringify({ unbond: { amount: '1000' } }),
        ),
      ).rejects.toThrow(/Direct unbonding is not available for this contract/);
    });

    describe('prepare oracles', () => {
      const ntrn_atom_provide_ratio = 1 / 5;
      const ntrn_provide_amount = 500_000;
      const atom_provide_amount = ntrn_provide_amount * ntrn_atom_provide_ratio;
      test('provide liquidity to NTRN_ATOM pool', async () => {
        const provided_assets = [
          nativeToken(IBC_ATOM_DENOM, atom_provide_amount.toString()),
          nativeToken(NEUTRON_DENOM, ntrn_provide_amount.toString()),
        ];
        const res = await cmInstantiator.executeContract(
          contractAddresses[NTRN_ATOM_PAIR_CONTRACT_KEY],
          JSON.stringify({ provide_liquidity: { assets: provided_assets } }),
          [
            { amount: atom_provide_amount.toString(), denom: IBC_ATOM_DENOM },
            { amount: ntrn_provide_amount.toString(), denom: NEUTRON_DENOM },
          ],
        );
        expect(res.code).toBe(0);

        expect(
          await neutronChain.queryContract<PoolStatus>(
            contractAddresses[NTRN_ATOM_PAIR_CONTRACT_KEY],
            { pool: {} },
          ),
        ).toEqual({
          assets: provided_assets,
          total_share: Math.floor(
            Math.sqrt(atom_provide_amount * ntrn_provide_amount),
          ).toString(),
        });
      });

      const ntrn_usdc_provide_ratio = 20;
      const usdc_provide_amount = ntrn_provide_amount * ntrn_usdc_provide_ratio;
      test('provide liquidity to NTRN_USDC pool', async () => {
        const provided_assets = [
          nativeToken(IBC_USDC_DENOM, usdc_provide_amount.toString()),
          nativeToken(NEUTRON_DENOM, ntrn_provide_amount.toString()),
        ];
        const res = await cmInstantiator.executeContract(
          contractAddresses[NTRN_USDC_PAIR_CONTRACT_KEY],
          JSON.stringify({ provide_liquidity: { assets: provided_assets } }),
          [
            { amount: usdc_provide_amount.toString(), denom: IBC_USDC_DENOM },
            { amount: ntrn_provide_amount.toString(), denom: NEUTRON_DENOM },
          ],
        );
        expect(res.code).toBe(0);

        expect(
          await neutronChain.queryContract<PoolStatus>(
            contractAddresses[NTRN_USDC_PAIR_CONTRACT_KEY],
            { pool: {} },
          ),
        ).toEqual({
          assets: provided_assets,
          total_share: Math.floor(
            Math.sqrt(usdc_provide_amount * ntrn_provide_amount),
          ).toString(),
        });
      });

      test('set asset infos for oracles', async () => {
        let res = await cmManager.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
          JSON.stringify({
            set_asset_infos: [
              nativeTokenInfo(IBC_ATOM_DENOM),
              nativeTokenInfo(NEUTRON_DENOM),
            ],
          }),
        );
        expect(res.code).toBe(0);

        res = await cmManager.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
          JSON.stringify({
            set_asset_infos: [
              nativeTokenInfo(IBC_USDC_DENOM),
              nativeTokenInfo(NEUTRON_DENOM),
            ],
          }),
        );
        expect(res.code).toBe(0);
      });

      test('call NTRN_ATOM oracle update', async () => {
        let res = await cmInstantiator.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
          JSON.stringify({ update: {} }),
        );
        expect(res.code).toBe(0);
        let res2 = await neutronChain.queryContract<{}>(
          contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
          {
            consult: {
              token: nativeTokenInfo(NEUTRON_DENOM),
              amount: '100',
            },
          },
        );
        console.log(res2);
        let res3 = await neutronChain.queryContract<{}>(
          contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
          {
            consult: {
              token: nativeTokenInfo(IBC_ATOM_DENOM),
              amount: '100',
            },
          },
        );
        console.log(res3);
      });

      test('call NTRN_USDC oracle update', async () => {
        let res = await cmInstantiator.executeContract(
          contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
          JSON.stringify({ update: {} }),
        );
        expect(res.code).toBe(0);
        let res2 = await neutronChain.queryContract<{}>(
          contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
          {
            consult: {
              token: nativeTokenInfo(NEUTRON_DENOM),
              amount: '100',
            },
          },
        );
        console.log(res2);
        let res3 = await neutronChain.queryContract<{}>(
          contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
          {
            consult: {
              token: nativeTokenInfo(IBC_USDC_DENOM),
              amount: '100',
            },
          },
        );
        console.log(res3);
      });
    });
  });
});

const deployContracts = async (
  chain: CosmosWrapper,
  instantiator: WalletWrapper,
  cmManager: WalletWrapper,
): Promise<Record<string, string>> => {
  const codeIds: Record<string, string> = {};
  for (const contract of [
    ASTRO_PAIR_CONTRACT_KEY,
    ASTRO_FACTORY_CONTRACT_KEY,
    ASTRO_TOKEN_CONTRACT_KEY,
    ASTRO_COIN_REGISTRY_CONTRACT_KEY,
    VESTING_LP_CONTRACT_KEY,
    VESTING_LP_VAULT_CONTRACT_KEY,
    ORACLE_HISTORY_CONTRACT_KEY,
  ]) {
    const codeId = parseInt(
      await instantiator.storeWasm(NeutronContract[contract]),
    );
    expect(codeId).toBeGreaterThan(0);
    codeIds[contract] = codeId.toString();
  }

  const contractAddresses: Record<string, string> = {};

  await deployCoinRegistry(instantiator, codeIds, contractAddresses);
  await storeTokensPrecision(chain, instantiator, contractAddresses);
  await deployFactory(instantiator, codeIds, contractAddresses);
  await deployOracles(instantiator, cmManager, codeIds, contractAddresses);
  await deployPairs(chain, instantiator, contractAddresses);
  await deployVestingLpContracts(
    instantiator,
    cmManager,
    codeIds,
    contractAddresses,
  );
  await setVestingLpAssets(instantiator, contractAddresses);
  await deployVestingLpVaultContract(
    instantiator,
    cmManager,
    codeIds,
    contractAddresses,
  );
  return contractAddresses;
};

const deployCoinRegistry = async (
  instantiator: WalletWrapper,
  codeIds: Record<string, string>,
  contractAddresses: Record<string, string>,
) => {
  const res = await instantiator.instantiateContract(
    codeIds[ASTRO_COIN_REGISTRY_CONTRACT_KEY],
    JSON.stringify({
      owner: instantiator.wallet.address.toString(),
    }),
    'coin_registry',
  );
  expect(res).toBeTruthy();
  contractAddresses[ASTRO_COIN_REGISTRY_CONTRACT_KEY] =
    res[0]._contract_address;
};

const storeTokensPrecision = async (
  chain: CosmosWrapper,
  instantiator: WalletWrapper,
  contractAddresses: Record<string, string>,
) => {
  const res = await instantiator.executeContract(
    contractAddresses[ASTRO_COIN_REGISTRY_CONTRACT_KEY],
    JSON.stringify({
      add: {
        native_coins: [
          [IBC_ATOM_DENOM, 6],
          [IBC_USDC_DENOM, 6],
          [NEUTRON_DENOM, 6],
        ],
      },
    }),
  );
  expect(res.code).toBe(0);

  expect(
    await chain.queryContract<PrecisionResponse[]>(
      contractAddresses[ASTRO_COIN_REGISTRY_CONTRACT_KEY],
      { native_tokens: {} },
    ),
  ).toEqual([
    { denom: IBC_ATOM_DENOM, decimals: 6 },
    { denom: IBC_USDC_DENOM, decimals: 6 },
    { denom: NEUTRON_DENOM, decimals: 6 },
  ]);
};

const deployFactory = async (
  instantiator: WalletWrapper,
  codeIds: Record<string, string>,
  contractAddresses: Record<string, string>,
) => {
  const instantiateMsg = {
    pair_configs: [
      {
        code_id: parseInt(codeIds[ASTRO_PAIR_CONTRACT_KEY]),
        pair_type: {
          xyk: {},
        },
        total_fee_bps: 0,
        maker_fee_bps: 0,
        is_disabled: false,
        is_generator_disabled: false,
      },
    ],
    token_code_id: parseInt(codeIds[ASTRO_TOKEN_CONTRACT_KEY]),
    owner: instantiator.wallet.address.toString(),
    whitelist_code_id: 0,
    coin_registry_address: contractAddresses[ASTRO_COIN_REGISTRY_CONTRACT_KEY],
  };
  const res = await instantiator.instantiateContract(
    codeIds[ASTRO_FACTORY_CONTRACT_KEY],
    JSON.stringify(instantiateMsg),
    'astro_factory',
  );
  expect(res).toBeTruthy();
  contractAddresses[ASTRO_FACTORY_CONTRACT_KEY] = res[0]._contract_address;
};

const deployOracles = async (
  instantiator: WalletWrapper,
  cmManager: WalletWrapper,
  codeIds: Record<string, string>,
  contractAddresses: Record<string, string>,
) => {
  let res = await instantiator.instantiateContract(
    codeIds[ORACLE_HISTORY_CONTRACT_KEY],
    JSON.stringify({
      factory_contract: contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
      period: 1,
      manager: cmManager.wallet.address.toString(),
    }),
    'oracle usdc',
  );
  expect(res).toBeTruthy();
  contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY] =
    res[0]._contract_address;

  res = await instantiator.instantiateContract(
    codeIds[ORACLE_HISTORY_CONTRACT_KEY],
    JSON.stringify({
      factory_contract: contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
      period: 1,
      manager: cmManager.wallet.address.toString(),
    }),
    'oracle atom',
  );
  expect(res).toBeTruthy();
  contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY] =
    res[0]._contract_address;
};

const deployPairs = async (
  chain: CosmosWrapper,
  instantiator: WalletWrapper,
  contractAddresses: Record<string, string>,
) => {
  let createMsg = {
    create_pair: {
      pair_type: {
        xyk: {},
      },
      asset_infos: [
        {
          native_token: {
            denom: IBC_ATOM_DENOM,
          },
        },
        {
          native_token: {
            denom: NEUTRON_DENOM,
          },
        },
      ],
    },
  };

  let res = await instantiator.executeContract(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    JSON.stringify(createMsg),
  );
  expect(res.code).toBe(0);

  createMsg = {
    create_pair: {
      pair_type: {
        xyk: {},
      },
      asset_infos: [
        {
          native_token: {
            denom: IBC_USDC_DENOM,
          },
        },
        {
          native_token: {
            denom: NEUTRON_DENOM,
          },
        },
      ],
    },
  };

  res = await instantiator.executeContract(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    JSON.stringify(createMsg),
  );
  expect(res.code).toBe(0);

  const pairs = await chain.queryContract<{ pairs: PairInfo[] }>(
    contractAddresses[ASTRO_FACTORY_CONTRACT_KEY],
    {
      pairs: {},
    },
  );
  expect(pairs.pairs).toHaveLength(2);
  contractAddresses[NTRN_ATOM_PAIR_CONTRACT_KEY] = pairs.pairs[0].contract_addr;
  contractAddresses[NTRN_ATOM_LP_TOKEN_CONTRACT_KEY] =
    pairs.pairs[0].liquidity_token;
  contractAddresses[NTRN_USDC_PAIR_CONTRACT_KEY] = pairs.pairs[1].contract_addr;
  contractAddresses[NTRN_USDC_LP_TOKEN_CONTRACT_KEY] =
    pairs.pairs[1].liquidity_token;
};

const deployVestingLpContracts = async (
  instantiator: WalletWrapper,
  cmManager: WalletWrapper,
  codeIds: Record<string, string>,
  contractAddresses: Record<string, string>,
) => {
  let msg = {
    owner: instantiator.wallet.address.toString(),
    token_info_manager: cmManager.wallet.address.toString(),
    vesting_managers: [],
  };
  let res = await instantiator.instantiateContract(
    codeIds[VESTING_LP_CONTRACT_KEY],
    JSON.stringify(msg),
    'vesting_atom_lp',
  );
  expect(res).toBeTruthy();
  contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY] = res[0]._contract_address;

  msg = {
    owner: instantiator.wallet.address.toString(),
    token_info_manager: cmManager.wallet.address.toString(),
    vesting_managers: [],
  };
  res = await instantiator.instantiateContract(
    codeIds[VESTING_LP_CONTRACT_KEY],
    JSON.stringify(msg),
    'vesting_usdc_lp',
  );
  expect(res).toBeTruthy();
  contractAddresses[VESTING_LP_USDC_CONTRACT_KEY] = res[0]._contract_address;
};

const setVestingLpAssets = async (
  instantiator: WalletWrapper,
  contractAddresses: Record<string, string>,
) => {
  let res = await instantiator.executeContract(
    contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
    JSON.stringify({
      set_vesting_token: {
        vesting_token: {
          token: {
            contract_addr: contractAddresses[NTRN_ATOM_LP_TOKEN_CONTRACT_KEY],
          },
        },
      },
    }),
  );
  expect(res.code).toBe(0);

  res = await instantiator.executeContract(
    contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
    JSON.stringify({
      set_vesting_token: {
        vesting_token: {
          token: {
            contract_addr: contractAddresses[NTRN_USDC_LP_TOKEN_CONTRACT_KEY],
          },
        },
      },
    }),
  );
  expect(res.code).toBe(0);
};

const deployVestingLpVaultContract = async (
  instantiator: WalletWrapper,
  cmManager: WalletWrapper,
  codeIds: Record<string, string>,
  contractAddresses: Record<string, string>,
) => {
  let res = await instantiator.instantiateContract(
    codeIds[VESTING_LP_VAULT_CONTRACT_KEY],
    JSON.stringify({
      name: 'Vesting lp vault ATOM',
      description: 'A vesting lp vault for ATOM',
      atom_vesting_lp_contract: contractAddresses[VESTING_LP_ATOM_CONTRACT_KEY],
      atom_oracle_contract:
        contractAddresses[ORACLE_HISTORY_NTRN_ATOM_CONTRACT_KEY],
      usdc_vesting_lp_contract: contractAddresses[VESTING_LP_USDC_CONTRACT_KEY],
      usdc_oracle_contract:
        contractAddresses[ORACLE_HISTORY_NTRN_USDC_CONTRACT_KEY],
      owner: {
        address: {
          addr: instantiator.wallet.address.toString(),
        },
      },
      manager: cmManager.wallet.address.toString(),
    }),
    'vesting_lp_vault_atom',
  );
  expect(res).toBeTruthy();
  contractAddresses[VESTING_LP_VAULT_CONTRACT_KEY] = res[0]._contract_address;
};
