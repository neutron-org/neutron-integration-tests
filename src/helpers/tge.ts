import MerkleTree from 'merkletreejs';
import crypto from 'crypto';
import { CosmosWrapper, WalletWrapper, getEventAttribute } from './cosmos';
import { CodeId } from '../types';
import {
  NativeToken,
  Token,
  NeutronContract,
  nativeTokenInfo,
  vestingAccount,
  vestingSchedule,
  vestingSchedulePoint,
} from './types';
import {
  CreditsVaultConfig,
  LockdropVaultConfig,
  VestingLpVaultConfig,
} from './dao';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { msgMintDenom, msgCreateDenom } from './tokenfactory';

// subdenom of rewards asset distributed by the generator contract.
const ASTRO_SUBDENOM = 'uastro';
// total size of rewards allocated for generator contract.
const GENERATOR_REWARDS_TOTAL = 1000000;
// fraction of generator rewards allocated with each new block.
const GENERATOR_REWARDS_PER_BLOCK = 500;

const sha256 = (x: string): Buffer => {
  const hash = crypto.createHash('sha256');
  hash.update(x);
  return hash.digest();
};

export class Airdrop {
  private tree: MerkleTree;

  constructor(accounts: Array<{ address: string; amount: string }>) {
    const leaves = accounts.map((a) => sha256(a.address + a.amount));
    this.tree = new MerkleTree(leaves, sha256, { sort: true });
  }

  public getMerkleRoot(): string {
    return this.tree.getHexRoot().replace('0x', '');
  }

  public getMerkleProof(account: {
    address: string;
    amount: string;
  }): string[] {
    return this.tree
      .getHexProof(sha256(account.address + account.amount))
      .map((v) => v.replace('0x', ''));
  }
}

export const getTimestamp = (secondsFromNow: number): number =>
  (Date.now() / 1000 + secondsFromNow) | 0;

/*
 * This class is designed to make TGE deployment easy.
 * Current flow of using this class:
 *
 * let tge: Tge;
 * tge = new Tge(
 *   neutronChain,
 *   walletWrapperInstantiator,
 *   walletwrapperTokenManager,
 *   // just some address which will receive funds as it is a reserve
 *   reserveAddress,
 *   IBC_ATOM_DENOM,
 *   IBC_USDC_DENOM,
 *   NEUTON_DENOM,
 * );
 * this.airdropAccounts = [ { address: 'neutron1…', amount: '1000' } ];
 * tge.times.airdropStart = getTimestamp(0);
 * tge.times.airdropVestingStart = getTimestamp(300);
 * await tge.deployPreAuction();
 * tge.times.auctionInit = getTimestamp(30);
 * await tge.deployAuction();
 * tge.times.lockdropInit = getTimestamp(10);
 * await tge.deployLockdrop();
 * await tge.deployLockdropVault();
 *
 */
export class Tge {
  chain: CosmosWrapper;
  instantiator: WalletWrapper;
  tokenInfoManager: WalletWrapper;
  reserve: string;
  codeIds: Record<string, CodeId>;
  contracts: {
    airdrop: string;
    credits: string;
    creditsVault: string;
    priceFeed: string;
    coinRegistry: string;
    astroFactory: string;
    vestingAtomLp: string;
    vestingUsdcLp: string;
    vestingLpVault: string;
    auction: string;
    lockdrop: string;
    astroGenerator: string;
    astroVesting: string;
    lockdropVault: string;
    oracleAtom: string;
    oracleUsdc: string;
  };
  atomDenom: string;
  usdcDenom: string;
  neutronDenom: string;
  astroDenom: string;
  generatorRewardsTotal: number;
  generatorRewardsPerBlock: number;
  pairs: {
    atom_ntrn: { contract: string; liquidity: string };
    usdc_ntrn: { contract: string; liquidity: string };
  };
  times: Record<string, number>;
  lockdropVaultName: string;
  lockdropVaultDescription: string;
  airdropAccounts: {
    address: string;
    amount: string;
  }[];
  airdrop: Airdrop;
  vestingLpVaultName: string;
  vestingLpVaultDescription: string;
  creditsVaultName: string;
  creditsVaultDescription: string;

  constructor(
    chain: CosmosWrapper,
    instantiator: WalletWrapper,
    tokenInfoManager: WalletWrapper,
    reserve: string,
    atomDenom: string,
    usdcDenom: string,
    neutronDenom: string,
  ) {
    this.chain = chain;
    this.instantiator = instantiator;
    this.tokenInfoManager = tokenInfoManager;
    this.reserve = reserve;
    this.codeIds = {};
    this.contracts = {
      airdrop: null,
      credits: null,
      creditsVault: null,
      priceFeed: null,
      coinRegistry: null,
      astroFactory: null,
      vestingAtomLp: null,
      vestingUsdcLp: null,
      vestingLpVault: null,
      auction: null,
      lockdrop: null,
      astroGenerator: null,
      astroVesting: null,
      lockdropVault: null,
      oracleAtom: null,
      oracleUsdc: null,
    };
    this.atomDenom = atomDenom;
    this.usdcDenom = usdcDenom;
    this.neutronDenom = neutronDenom;
    this.generatorRewardsTotal = GENERATOR_REWARDS_TOTAL;
    this.generatorRewardsPerBlock = GENERATOR_REWARDS_PER_BLOCK;
    this.times = {};
    this.times.airdropStart = 0;
    this.times.airdropVestingStart = 0;
    this.times.vestingDuration = 3600 * 24 * 30;
    this.times.auctionInit = 0;
    this.times.auctionDepositWindow = 60;
    this.times.auctionWithdrawalWindow = 60;
    this.times.lockdropDepositDuration = 60;
    this.times.lockdropWithdrawalDuration = 60;
    this.times.auctionVestingLpDuration = 20;
    this.times.lockdropInit = 0;
    this.times.vestTimestamp = 0;
    this.lockdropVaultName = 'Lockdrop vault';
    this.lockdropVaultDescription = 'A lockdrop vault for testing purposes';
    this.vestingLpVaultName = 'Vesting LP vault';
    this.vestingLpVaultDescription = 'A vesting LP vault for testing purposes';
    this.creditsVaultName = 'Credits vault';
    this.creditsVaultDescription = 'A credits vault for testing purposes';
    this.airdropAccounts = [];
  }

  async deployPreAuction() {
    for (const contract of [
      'TGE_CREDITS',
      'TGE_AUCTION',
      'TGE_LOCKDROP',
      'TGE_AIRDROP',
      'TGE_PRICE_FEED_MOCK',
      'ASTRO_PAIR',
      'ASTRO_FACTORY',
      'ASTRO_TOKEN',
      'ASTRO_GENERATOR',
      'ASTRO_WHITELIST',
      'ASTRO_VESTING',
      'ASTRO_COIN_REGISTRY',
      'VESTING_LP',
      'LOCKDROP_VAULT',
      'CREDITS_VAULT',
      'VESTING_LP_VAULT',
      'ORACLE_HISTORY',
    ]) {
      const codeId = await this.instantiator.storeWasm(
        NeutronContract[contract],
      );
      expect(codeId).toBeGreaterThan(0);
      this.codeIds[contract] = codeId;
    }

    this.contracts.credits = await instantiateCredits(
      this.instantiator,
      this.codeIds.TGE_CREDITS,
      this.instantiator.wallet.address.toString(),
    );

    this.airdrop = new Airdrop(this.airdropAccounts);
    this.contracts.airdrop = await instantiateAirdrop(
      this.instantiator,
      this.codeIds.TGE_AIRDROP,
      this.contracts.credits,
      this.reserve,
      this.airdrop.getMerkleRoot(),
      this.times.airdropStart,
      this.times.airdropVestingStart,
      this.times.vestingDuration,
      null,
      null,
    );

    this.contracts.creditsVault = await instantiateCreditsVault(
      this.instantiator,
      this.codeIds.CREDITS_VAULT,
      this.creditsVaultName,
      this.creditsVaultDescription,
      this.contracts.credits,
      this.instantiator.wallet.address.toString(),
      this.contracts.airdrop,
    );

    this.contracts.priceFeed = await instantiatePriceFeed(
      this.instantiator,
      this.codeIds.TGE_PRICE_FEED_MOCK,
    );

    this.contracts.coinRegistry = await instantiateCoinRegistry(
      this.instantiator,
      this.codeIds.ASTRO_COIN_REGISTRY,
    );
    const res = await this.instantiator.executeContract(
      this.contracts.coinRegistry,
      JSON.stringify({
        add: {
          native_coins: [
            [this.atomDenom, 6],
            [this.usdcDenom, 6],
            [this.neutronDenom, 6],
          ],
        },
      }),
    );
    expect(res.code).toEqual(0);

    this.contracts.astroFactory = await instantiateAstroFactory(
      this.instantiator,
      this.codeIds.ASTRO_FACTORY,
      this.codeIds.ASTRO_PAIR,
      this.codeIds.ASTRO_TOKEN,
      this.contracts.coinRegistry,
    );

    await this.createNativeAstroDenom();

    this.contracts.astroVesting = await instantiateAstroVesting(
      this.instantiator,
      this.codeIds.ASTRO_VESTING,
      nativeTokenInfo(this.astroDenom),
    );

    this.contracts.astroGenerator = await instantiateAstroGenerator(
      this.instantiator,
      this.codeIds.ASTRO_GENERATOR,
      this.astroDenom,
      this.contracts.astroFactory,
      '1',
      this.generatorRewardsPerBlock.toString(),
      this.contracts.astroVesting,
      this.codeIds.ASTRO_WHITELIST,
    );

    await this.instantiator.executeContract(
      this.contracts.astroVesting,
      JSON.stringify({
        register_vesting_accounts: {
          vesting_accounts: [
            vestingAccount(this.contracts.astroGenerator, [
              vestingSchedule(
                vestingSchedulePoint(0, this.generatorRewardsTotal.toString()),
              ),
            ]),
          ],
        },
      }),
      [
        {
          denom: this.astroDenom,
          amount: this.generatorRewardsTotal.toString(),
        },
      ],
    );

    await this.instantiator.executeContract(
      this.contracts.astroFactory,
      JSON.stringify({
        update_config: {
          generator_address: this.contracts.astroGenerator,
        },
      }),
    );

    for (const denom of [this.atomDenom, this.usdcDenom]) {
      const res = await executeFactoryCreatePair(
        this.instantiator,
        this.contracts.astroFactory,
        denom,
        this.neutronDenom,
      );
      expect(res.code).toEqual(0);
    }

    const pairs = (
      await queryFactoryPairs(this.chain, this.contracts.astroFactory)
    ).pairs;
    expect(pairs).toHaveLength(2);
    this.pairs = {
      atom_ntrn: {
        contract: pairs[0].contract_addr,
        liquidity: pairs[0].liquidity_token,
      },
      usdc_ntrn: {
        contract: pairs[1].contract_addr,
        liquidity: pairs[1].liquidity_token,
      },
    };

    await this.instantiator.executeContract(
      this.contracts.astroGenerator,
      JSON.stringify({
        setup_pools: {
          pools: [
            [this.pairs.atom_ntrn.liquidity, '1'],
            [this.pairs.usdc_ntrn.liquidity, '1'],
          ],
        },
      }),
    );

    this.contracts.vestingAtomLp = await instantiateVestingLp(
      this.instantiator,
      this.codeIds.VESTING_LP,
      this.tokenInfoManager.wallet.address.toString(),
      'vesting_atom_lp',
    );
    this.contracts.vestingUsdcLp = await instantiateVestingLp(
      this.instantiator,
      this.codeIds.VESTING_LP,
      this.tokenInfoManager.wallet.address.toString(),
      'vesting_usdc_lp',
    );

    for (const [contract, liquidity] of [
      [this.contracts.vestingAtomLp, this.pairs.atom_ntrn.liquidity],
      [this.contracts.vestingUsdcLp, this.pairs.usdc_ntrn.liquidity],
    ]) {
      const res = await executeVestingLpSetVestingToken(
        this.instantiator,
        contract,
        liquidity,
      );
      expect(res.code).toEqual(0);
    }
  }

  async deployAuction() {
    this.contracts.auction = await instantiateAuction(
      this.instantiator,
      this.codeIds.TGE_AUCTION,
      null,
      this.tokenInfoManager.wallet.address.toString(),
      this.contracts.priceFeed,
      null,
      this.reserve,
      this.contracts.vestingUsdcLp,
      this.contracts.vestingAtomLp,
      this.times.lockdropDepositDuration +
        this.times.lockdropWithdrawalDuration,
      this.times.auctionInit,
      this.times.auctionDepositWindow,
      this.times.auctionWithdrawalWindow,
      1000,
      '100000',
      4,
      this.times.auctionVestingLpDuration,
    );

    const res = await executeAuctionSetTokenInfo(
      this.tokenInfoManager,
      this.contracts.auction,
      this.atomDenom,
      this.usdcDenom,
    );
    expect(res.code).toEqual(0);
  }

  async deployLockdrop() {
    this.contracts.lockdrop = await instantiateLockdrop(
      this.instantiator,
      this.codeIds.TGE_LOCKDROP,
      null,
      this.tokenInfoManager.wallet.address.toString(),
      this.contracts.credits,
      this.contracts.auction,
      this.times.lockdropInit,
      this.times.lockdropDepositDuration,
      this.times.lockdropWithdrawalDuration,
      1,
      2,
      3,
      [
        { duration: 1, coefficient: '0' },
        { duration: 2, coefficient: '1' },
      ],
    );

    let res = await executeLockdropSetTokenInfo(
      this.tokenInfoManager,
      this.contracts.lockdrop,
      this.pairs.atom_ntrn.liquidity,
      this.pairs.usdc_ntrn.liquidity,
      this.contracts.astroGenerator,
    );
    expect(res.code).toEqual(0);

    res = await executeAuctionUpdateConfig(
      this.instantiator,
      this.contracts.auction,
      this.contracts.lockdrop,
      {
        ntrn_usdc_pool_address: this.pairs.usdc_ntrn.contract,
        ntrn_atom_pool_address: this.pairs.atom_ntrn.contract,
        ntrn_usdc_lp_token_address: this.pairs.usdc_ntrn.liquidity,
        ntrn_atom_lp_token_address: this.pairs.atom_ntrn.liquidity,
      },
    );
    expect(res.code).toEqual(0);

    for (const contract of [
      this.contracts.vestingAtomLp,
      this.contracts.vestingUsdcLp,
    ]) {
      res = await executeVestingLpSetVestingManagers(
        this.instantiator,
        contract,
        [this.contracts.auction],
      );
      expect(res.code).toEqual(0);
    }

    res = await executeCreditsUpdateConfig(
      this.instantiator,
      this.contracts.credits,
      this.contracts.airdrop,
      this.contracts.lockdrop,
    );
    expect(res.code).toEqual(0);
    // 4000100 - users
    // 10000000 - extra to test its ignored in credits vault voting power
    res = await executeCreditsMint(
      this.instantiator,
      this.contracts.credits,
      this.neutronDenom,
      '14000100',
    );
    expect(res.code).toEqual(0);
  }

  async deployLockdropVault() {
    this.contracts.oracleAtom = await instantiateAstroportOracle(
      this.instantiator,
      this.codeIds.ORACLE_HISTORY,
      this.contracts.astroFactory,
      1,
      this.tokenInfoManager.wallet.address.toString(),
      'astroport_oracle_atom',
    );
    this.contracts.oracleUsdc = await instantiateAstroportOracle(
      this.instantiator,
      this.codeIds.ORACLE_HISTORY,
      this.contracts.astroFactory,
      1,
      this.tokenInfoManager.wallet.address.toString(),
      'astroport_oracle_usdc',
    );

    for (const [contract, denom1, denom2] of [
      [this.contracts.oracleAtom, this.atomDenom, this.neutronDenom],
      [this.contracts.oracleUsdc, this.usdcDenom, this.neutronDenom],
    ]) {
      const res = await executeAstroportOracleSetAssetInfos(
        this.tokenInfoManager,
        contract,
        denom1,
        denom2,
      );
      expect(res.code).toEqual(0);
    }

    this.contracts.lockdropVault = await instantiateLockdropVault(
      this.instantiator,
      this.codeIds.LOCKDROP_VAULT,
      this.lockdropVaultName,
      this.lockdropVaultDescription,
      this.contracts.lockdrop,
      this.contracts.oracleUsdc,
      this.contracts.oracleAtom,
      this.instantiator.wallet.address.toString(),
      this.tokenInfoManager.wallet.address.toString(),
    );

    this.contracts.vestingLpVault = await instantiateVestingLpVault(
      this.instantiator,
      this.codeIds.VESTING_LP_VAULT,
      this.vestingLpVaultName,
      this.vestingLpVaultDescription,
      this.contracts.lockdrop,
      this.contracts.oracleAtom,
      this.contracts.oracleUsdc,
      this.contracts.vestingAtomLp,
      this.contracts.vestingUsdcLp,
      this.instantiator.wallet.address.toString(),
      this.tokenInfoManager.wallet.address.toString(),
    );
  }

  async createNativeAstroDenom() {
    const data = await msgCreateDenom(
      this.instantiator,
      this.instantiator.wallet.address.toString(),
      ASTRO_SUBDENOM,
    );
    this.astroDenom = getEventAttribute(
      (data as any).events,
      'create_denom',
      'new_token_denom',
    );
    await msgMintDenom(
      this.instantiator,
      this.instantiator.wallet.address.toString(),
      {
        denom: this.astroDenom,
        amount: this.generatorRewardsTotal.toString(),
      },
    );
  }

  /**
   * retrieves user's ntrn and astro balances, lockdrop info and user's LP token balances.
   */
  async generatorRewardsState(user: string): Promise<GeneratorRewardsState> {
    const balanceNtrn = await this.chain.queryDenomBalance(
      user,
      this.neutronDenom,
    );
    const balanceAstro = await this.chain.queryDenomBalance(
      user,
      this.astroDenom,
    );
    const userInfo = await queryLockdropUserInfo(
      this.chain,
      this.contracts.lockdrop,
      user,
    );
    const atomNtrnLpTokenBalance = await this.chain.queryContract<{
      balance: string;
    }>(this.pairs.atom_ntrn.liquidity, {
      balance: {
        address: user,
      },
    });
    const usdcNtrnLpTokenBalance = await this.chain.queryContract<{
      balance: string;
    }>(this.pairs.usdc_ntrn.liquidity, {
      balance: {
        address: user,
      },
    });
    return {
      balanceNtrn,
      balanceAstro,
      userInfo,
      atomNtrnLpTokenBalance: +atomNtrnLpTokenBalance.balance,
      usdcNtrnLpTokenBalance: +usdcNtrnLpTokenBalance.balance,
    };
  }
}

export const instantiateAuction = async (
  cm: WalletWrapper,
  codeId: CodeId,
  ownerAddress: string | null,
  tokenInfoManager: string,
  priceFeedContract: string,
  lockdropContractAddress: string | null,
  reserveContractAddress: string,
  vestingUsdcContractAddress: string,
  vestingAtomContractAddress: string,
  lpTokensLockWindow: number,
  initTimestamp: number,
  depositWindow: number,
  withdrawalWindow: number,
  maxExchangeRateAge: number,
  minNtrnAmount: string,
  vestingMigrationPackSize: number,
  vestingLpDuration: number,
  label = 'auction',
) => {
  const res = await cm.instantiateContract(
    codeId,
    JSON.stringify({
      owner: ownerAddress,
      token_info_manager: tokenInfoManager,
      price_feed_contract: priceFeedContract,
      lockdrop_contract_address: lockdropContractAddress,
      reserve_contract_address: reserveContractAddress,
      vesting_usdc_contract_address: vestingUsdcContractAddress,
      vesting_atom_contract_address: vestingAtomContractAddress,
      lp_tokens_lock_window: lpTokensLockWindow,
      init_timestamp: initTimestamp,
      deposit_window: depositWindow,
      withdrawal_window: withdrawalWindow,
      max_exchange_rate_age: maxExchangeRateAge,
      min_ntrn_amount: minNtrnAmount,
      vesting_migration_pack_size: vestingMigrationPackSize,
      vesting_lp_duration: vestingLpDuration,
    }),
    label,
  );
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};

export const instantiateAirdrop = async (
  cm: WalletWrapper,
  codeId: CodeId,
  creditsAddress: string,
  reserveAddress: string,
  merkleRoot: string,
  airdropStart: number,
  vestingStart: number,
  vestingDurationSeconds: number,
  totalAmount: string | null,
  hrp: string | null,
  label = 'airdrop',
) => {
  const res = await cm.instantiateContract(
    codeId,
    JSON.stringify({
      credits_address: creditsAddress,
      reserve_address: reserveAddress,
      merkle_root: merkleRoot,
      airdrop_start: airdropStart,
      vesting_start: vestingStart,
      vesting_duration_seconds: vestingDurationSeconds,
      total_amount: totalAmount,
      hrp,
    }),
    label,
  );
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};

export const executeAuctionUpdateConfig = async (
  cm: WalletWrapper,
  contractAddress: string,
  lockdropAddress: string | null,
  poolInfo: {
    ntrn_usdc_pool_address: string;
    ntrn_atom_pool_address: string;
    ntrn_usdc_lp_token_address: string;
    ntrn_atom_lp_token_address: string;
  } | null,
) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({
      update_config: {
        new_config: {
          lockdrop_contract_address: lockdropAddress,
          pool_info: poolInfo,
        },
      },
    }),
  );

export const executeAuctionSetTokenInfo = async (
  cm: WalletWrapper,
  contractAddress: string,
  atomDenom: string,
  usdcDenom: string,
) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({
      set_token_info: {
        atom_denom: atomDenom,
        usdc_denom: usdcDenom,
      },
    }),
  );

export const instantiateCredits = async (
  cm: WalletWrapper,
  codeId: CodeId,
  daoAddress: string,
  label = 'credits',
) => {
  const res = await cm.instantiateContract(
    codeId,
    JSON.stringify({
      dao_address: daoAddress,
    }),
    label,
  );
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};

export const executeCreditsUpdateConfig = async (
  cm: WalletWrapper,
  contractAddress: string,
  airdrop: string,
  lockdrop: string,
) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({
      update_config: {
        config: {
          airdrop_address: airdrop,
          lockdrop_address: lockdrop,
        },
      },
    }),
  );

export const executeCreditsMint = async (
  cm: WalletWrapper,
  contractAddress: string,
  denom: string,
  amount: string,
) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({
      mint: {},
    }),
    [
      {
        amount,
        denom,
      },
    ],
  );

export const instantiateCreditsVault = async (
  cm: WalletWrapper,
  codeId: CodeId,
  name: string,
  description: string,
  creditsContract: string,
  owner: string,
  airdropContract: string,
  label = 'credits_vault',
) => {
  const res = await cm.instantiateContract(
    codeId,
    JSON.stringify({
      name,
      description,
      credits_contract_address: creditsContract,
      owner,
      airdrop_contract_address: airdropContract,
    }),
    label,
  );
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};

export const executeCreditsVaultUpdateConfig = async (
  cm: WalletWrapper,
  contractAddress: string,
  creditsContract: string | null,
  owner: string | null,
  name: string | null,
  description: string | null,
) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({
      update_config: {
        credits_contract_address: creditsContract,
        owner,
        name,
        description,
      },
    }),
  );

export const queryCreditsVaultConfig = async (
  cm: CosmosWrapper,
  contractAddress: string,
) =>
  cm.queryContract<CreditsVaultConfig>(contractAddress, {
    config: {},
  });

export type LockupRewardsInfo = {
  duration: number;
  coefficient: string;
};

export type LockdropLockUpInfoResponse = {
  astroport_lp_token: string;
  astroport_lp_transferred: string | null;
  astroport_lp_units: string | null;
  claimable_generator_astro_debt: string;
  claimable_generator_proxy_debt: unknown[];
  duration: number;
  generator_ntrn_debt: string;
  generator_proxy_debt: unknown[];
  lp_units_locked: string;
  ntrn_rewards: string;
  pool_type: string;
  unlock_timestamp: number;
  withdrawal_flag: boolean;
};

export type LockdropUserInfoResponse = {
  claimable_generator_ntrn_debt: string;
  lockup_infos: LockdropLockUpInfoResponse[];
  lockup_positions_index: number;
  ntrn_transferred: boolean;
  total_ntrn_rewards: string;
};

export const instantiateLockdrop = async (
  cm: WalletWrapper,
  codeId: CodeId,
  ownerAddress: string | null,
  tokenInfoManager: string,
  creditsContract: string,
  auctionContract: string,
  initTimestamp: number,
  lockWindow: number,
  withdrawalWindow: number,
  minLockDuration: number,
  maxLockDuration: number,
  maxPositionsPerUser: number,
  lockupRewardsInfo: LockupRewardsInfo[],
  label = 'credits',
) => {
  const res = await cm.instantiateContract(
    codeId,
    JSON.stringify({
      owner: ownerAddress,
      token_info_manager: tokenInfoManager,
      credits_contract: creditsContract,
      auction_contract: auctionContract,
      init_timestamp: initTimestamp,
      lock_window: lockWindow,
      withdrawal_window: withdrawalWindow,
      min_lock_duration: minLockDuration,
      max_lock_duration: maxLockDuration,
      max_positions_per_user: maxPositionsPerUser,
      lockup_rewards_info: lockupRewardsInfo,
    }),
    label,
  );
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};

export const queryLockdropUserInfo = async (
  chain: CosmosWrapper,
  contractAddress: string,
  userAddress: string,
) =>
  chain.queryContract<LockdropUserInfoResponse>(contractAddress, {
    user_info: { address: userAddress },
  });

export const executeLockdropUpdateConfig = async (
  cm: WalletWrapper,
  contractAddress: string,
  newGeneratorAddress: string,
) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({
      update_config: {
        new_config: {
          generator_address: newGeneratorAddress,
        },
      },
    }),
  );

export const executeLockdropSetTokenInfo = async (
  cm: WalletWrapper,
  contractAddress: string,
  atomToken: string,
  usdcToken: string,
  astroGenerator: string,
) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({
      set_token_info: {
        atom_token: atomToken,
        usdc_token: usdcToken,
        generator: astroGenerator,
      },
    }),
  );

export const instantiatePriceFeed = async (
  cm: WalletWrapper,
  codeId: CodeId,
  label = 'price_feed',
) => {
  const res = await cm.instantiateContract(codeId, JSON.stringify({}), label);
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};

export const instantiateCoinRegistry = async (
  cm: WalletWrapper,
  codeId: CodeId,
  label = 'coin_registry',
) => {
  const res = await cm.instantiateContract(
    codeId,
    JSON.stringify({
      owner: cm.wallet.address.toString(),
    }),
    label,
  );
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};

export const instantiateAstroFactory = async (
  cm: WalletWrapper,
  codeId: CodeId,
  astroPairCodeId: CodeId,
  astroTokenCodeId: CodeId,
  coinRegistryAddress: string,
  label = 'astro_factory',
) => {
  const res = await cm.instantiateContract(
    codeId,
    JSON.stringify({
      pair_configs: [
        {
          code_id: astroPairCodeId,
          pair_type: {
            xyk: {},
          },
          total_fee_bps: 0,
          maker_fee_bps: 0,
          is_disabled: false,
          is_generator_disabled: false,
        },
      ],
      token_code_id: astroTokenCodeId,
      owner: cm.wallet.address.toString(),
      whitelist_code_id: 0,
      coin_registry_address: coinRegistryAddress,
    }),
    label,
  );
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};

export const executeFactoryCreatePair = async (
  cm: WalletWrapper,
  contractAddress: string,
  denom1: string,
  denom2: string,
) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({
      create_pair: {
        pair_type: {
          xyk: {},
        },
        asset_infos: [
          {
            native_token: {
              denom: denom1,
            },
          },
          {
            native_token: {
              denom: denom2,
            },
          },
        ],
      },
    }),
  );

export type PairInfo = {
  asset_infos: Record<'native_token' | 'token', { denom: string }>[];
  contract_addr: string;
  liquidity_token: string;
  pair_type: Record<string, object>;
};

export type FactoryPairsResponse = {
  pairs: PairInfo[];
};

export const queryFactoryPairs = async (
  chain: CosmosWrapper,
  contractAddress: string,
) =>
  chain.queryContract<FactoryPairsResponse>(contractAddress, {
    pairs: {},
  });

export const instantiateAstroVesting = async (
  cm: WalletWrapper,
  codeId: CodeId,
  vestingToken: Token | NativeToken,
  label = 'astro_vesting',
) => {
  const res = await cm.instantiateContract(
    codeId,
    JSON.stringify({
      owner: cm.wallet.address.toString(),
      vesting_token: vestingToken,
    }),
    label,
  );
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};

export type VestingAccountResponse = {
  address: string;
  info: {
    released_amount: string;
    schedules: {
      end_point: { amount: string; time: number };
      start_point: { amount: string; time: number };
    }[];
  };
};

type GeneratorRewardsState = {
  balanceNtrn: number;
  balanceAstro: number;
  userInfo: LockdropUserInfoResponse;
  atomNtrnLpTokenBalance: number;
  usdcNtrnLpTokenBalance: number;
};

export const instantiateVestingLp = async (
  cm: WalletWrapper,
  codeId: CodeId,
  tokenInfoManager: string,
  label = 'vesting_lp',
) => {
  const res = await cm.instantiateContract(
    codeId,
    JSON.stringify({
      owner: cm.wallet.address.toString(),
      token_info_manager: tokenInfoManager,
      vesting_managers: [],
    }),
    label,
  );
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};

export const executeVestingLpSetVestingToken = async (
  cm: WalletWrapper,
  contractAddress: string,
  vestingTokenContract: string,
) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({
      set_vesting_token: {
        vesting_token: {
          token: {
            contract_addr: vestingTokenContract,
          },
        },
      },
    }),
  );

export const executeVestingLpSetVestingManagers = async (
  cm: WalletWrapper,
  contractAddress: string,
  managers: string[],
) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({
      with_managers_extension: {
        msg: {
          add_vesting_managers: {
            managers,
          },
        },
      },
    }),
  );

export const instantiateAstroGenerator = async (
  cm: WalletWrapper,
  codeId: CodeId,
  denom: string,
  factoryContract: string,
  startBlock: string,
  tokensPerBlock: string,
  vestingContract: string,
  whitelistCodeId: CodeId,
  label = 'astro_generator',
) => {
  const res = await cm.instantiateContract(
    codeId,
    JSON.stringify({
      astro_token: {
        native_token: {
          denom,
        },
      },
      factory: factoryContract,
      owner: cm.wallet.address.toString(),
      start_block: startBlock,
      tokens_per_block: tokensPerBlock,
      vesting_contract: vestingContract,
      whitelist_code_id: whitelistCodeId,
    }),
    label,
  );
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};

export const instantiateLockdropVault = async (
  cm: WalletWrapper,
  codeId: CodeId,
  name: string,
  description: string,
  lockdropContract: string,
  oracleUsdc: string,
  oracleAtom: string,
  owner: string,
  tokenInfoManager: string | null,
  label = 'lockdrop_vault',
) => {
  const res = await cm.instantiateContract(
    codeId,
    JSON.stringify({
      name: name,
      description: description,
      lockdrop_contract: lockdropContract,
      oracle_usdc_contract: oracleUsdc,
      oracle_atom_contract: oracleAtom,
      manager: tokenInfoManager,
      owner,
    }),
    label,
  );
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};

export const executeLockdropVaultUpdateConfig = async (
  cm: WalletWrapper,
  contractAddress: string,
  owner: string | null,
  lockdropContract: string | null,
  oracleUsdcContract: string | null,
  oracleAtomContract: string | null,
  name: string | null,
  description: string | null,
): Promise<InlineResponse20075TxResponse> =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({
      update_config: {
        owner: owner,
        lockdrop_contract: lockdropContract,
        oracle_usdc_contract: oracleUsdcContract,
        oracle_atom_contract: oracleAtomContract,
        name: name,
        description: description,
      },
    }),
  );

export const queryLockdropVaultConfig = async (
  cm: CosmosWrapper,
  contractAddress: string,
): Promise<LockdropVaultConfig> =>
  cm.queryContract<LockdropVaultConfig>(contractAddress, {
    config: {},
  });

export const executeVestingLpVaultUpdateConfig = async (
  cm: WalletWrapper,
  contractAddress: string,
  owner: string,
  atomVestingLp: string,
  atomOracle: string,
  usdcVestingLp: string,
  usdcOracle: string,
  name: string,
  description: string,
) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({
      update_config: {
        owner,
        atom_vesting_lp_contract: atomVestingLp,
        atom_oracle_contract: atomOracle,
        usdc_vesting_lp_contract: usdcVestingLp,
        usdc_oracle_contract: usdcOracle,
        name,
        description,
      },
    }),
  );

export const queryVestingLpVaultConfig = async (
  cm: CosmosWrapper,
  contractAddress: string,
) =>
  cm.queryContract<VestingLpVaultConfig>(contractAddress, {
    config: {},
  });

export const instantiateAstroportOracle = async (
  cm: WalletWrapper,
  codeId: CodeId,
  factoryContract: string,
  period: number,
  tokenInfoManager: string,
  label = 'astroport_oracle',
) => {
  const res = await cm.instantiateContract(
    codeId,
    JSON.stringify({
      factory_contract: factoryContract,
      period,
      manager: tokenInfoManager,
    }),
    label,
  );
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};

export const executeAstroportOracleSetAssetInfos = async (
  cm: WalletWrapper,
  contractAddress: string,
  denom1: string,
  denom2: string,
) =>
  cm.executeContract(
    contractAddress,
    JSON.stringify({
      set_asset_infos: [
        {
          native_token: {
            denom: denom1,
          },
        },
        {
          native_token: {
            denom: denom2,
          },
        },
      ],
    }),
  );

export const instantiateVestingLpVault = async (
  cm: WalletWrapper,
  codeId: CodeId,
  name: string,
  description: string,
  lockdrop: string,
  atomOracle: string,
  usdcOracle: string,
  atomVestingLp: string,
  usdcVestingLp: string,
  owner: string,
  tokenInfoManager: string,
  label = 'vesting_lp_vault',
) => {
  const res = await cm.instantiateContract(
    codeId,
    JSON.stringify({
      name,
      description,
      lockdrop_contract: lockdrop,
      atom_oracle_contract: atomOracle,
      usdc_oracle_contract: usdcOracle,
      atom_vesting_lp_contract: atomVestingLp,
      usdc_vesting_lp_contract: usdcVestingLp,
      owner: cm.wallet.address.toString(),
      manager: tokenInfoManager,
    }),
    label,
  );
  expect(res).toBeTruthy();
  return res[0]._contract_address;
};
