import {
  CosmosWrapper,
  IBC_ATOM_DENOM,
  IBC_USDC_DENOM,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import { NeutronContract } from '../../helpers/types';
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import { CodeId } from '../../types';

const MIN_LIQUDITY = 1000;
const ATOM_DEPOSIT_AMOUNT = 10000;
const USDC_DEPOSIT_AMOUNT = 90000;
const NTRN_AMOUNT = 200000;
const ATOM_RATE = 10000000;
const USDC_RATE = 1000000;

const getLpSize = (token1: number, token2: number) =>
  (Math.sqrt(token1 * token2) - MIN_LIQUDITY) | 0;

type PairInfo = {
  asset_infos: Record<'native_token' | 'token', { denom: string }>[];
  contract_addr: string;
  liquidity_token: string;
  pair_type: Record<string, object>;
};

type UserInfoResponse = {
  usdc_deposited: string;
  atom_deposited: string;
  withdrawn: boolean;
  atom_lp_amount: string;
  usdc_lp_amount: string;
  atom_lp_locked: string;
  usdc_lp_locked: string;
};

type LockDropInfoResponse = {
  claimable_generator_ntrn_debt: string;
  lockup_infos: {
    astroport_lp_token: string;
    astroport_lp_transferred: boolean | null;
    astroport_lp_units: string;
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
  }[];
  lockup_positions_index: number;
  ntrn_transferred: boolean;
  total_ntrn_rewards: string;
};

type PoolInfoResponse = {
  assets: { amount: string; info: { native_token: { denom: string } } }[];
  total_share: string;
};

type AuctionStateResponse = {
  /// Total USDC deposited to the contract
  total_usdc_deposited: string;
  /// Total ATOM deposited to the contract
  total_atom_deposited: string;
  is_rest_lp_vested: boolean;
  /// Total LP shares minted post liquidity addition to the NTRN-USDC Pool
  lp_usdc_shares_minted?: string;
  /// Total LP shares minted post liquidity addition to the NTRN-ATOM Pool
  lp_atom_shares_minted?: string;
  /// Timestamp at which liquidity was added to the NTRN-ATOM and NTRN-USDC LP Pool
  pool_init_timestamp: number;
  /// USDC NTRN amount
  usdc_ntrn_size: string;
  /// ATOM NTRN amount
  atom_ntrn_size: string;
  /// LP count for USDC amount
  usdc_lp_size: string;
  /// LP count for ATOM amount
  atom_lp_size: string;
  /// locked USDC LP shares
  usdc_lp_locked: string;
  /// locked ATOM LP shares
  atom_lp_locked: string;
};

type BalanceResponse = {
  balance: string;
};

type VestingAccountResponse = {
  address: string;
  info: {
    released_amount: string;
    schedules: {
      end_point: { amount: string; time: number };
      start_point: { amount: string; time: number };
    }[];
  };
};

const waitTill = (timestamp: number): Promise<void> => {
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    throw new Error('timestamp is not a number');
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timestamp * 1000 - Date.now());
  });
};

describe('Neutron / TGE / Auction', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let cmInstantiator: WalletWrapper;
  let cmTokenManager: WalletWrapper;
  let cmStranger: WalletWrapper;
  const codeIds: Record<string, CodeId> = {};
  const contractAddresses: Record<string, string> = {};
  let pairs: {
    atom_ntrn: { contract: string; liqiudity: string };
    usdc_ntrn: { contract: string; liqiudity: string };
  };
  const times: Record<string, number> = {};
  let reserveAddress: string;
  let atomBalance = 0;
  let usdcBalance = 0;
  let ntrnAtomSize = 0;
  let ntrnUsdcSize = 0;
  let atomLpSize = 0;
  let usdcLpSize = 0;
  let atomLpLocked = 0;
  let usdcLpLocked = 0;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    reserveAddress =
      testState.wallets.qaNeutronThree.genQaWal1.address.toString();
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    cmInstantiator = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutron.genQaWal1,
    );
    cmTokenManager = new WalletWrapper(
      neutronChain,
      testState.wallets.qaNeutronFour.genQaWal1,
    );
    cmStranger = new WalletWrapper(
      neutronChain,

      testState.wallets.qaNeutronFive.genQaWal1,
    );
  });

  describe('Deploy', () => {
    it('should be able to send fake ibc tokens', async () => {
      await cmInstantiator.msgSend(
        testState.wallets.qaNeutronFour.genQaWal1.address.toString(),
        { amount: '1000', denom: IBC_ATOM_DENOM },
      );
      await cmInstantiator.msgSend(
        testState.wallets.qaNeutronFour.genQaWal1.address.toString(),
        { amount: '1000', denom: IBC_USDC_DENOM },
      );
    });
    it('should store contracts', async () => {
      for (const contract of [
        'TGE_CREDITS',
        'TGE_AIRDROP',
        'TGE_AUCTION',
        'TGE_LOCKDROP',
        'TGE_PRICE_FEED_MOCK',
        'ASTRO_PAIR',
        'ASTRO_FACTORY',
        'ASTRO_TOKEN',
        'ASTRO_GENERATOR',
        'ASTRO_WHITELIST',
        'ASTRO_COIN_REGISTRY',
        'VESTING_LP',
      ]) {
        const codeId = await cmInstantiator.storeWasm(
          NeutronContract[contract],
        );
        expect(codeId).toBeGreaterThan(0);
        codeIds[contract] = codeId;
      }
    });
    it('should instantiate credits contract', async () => {
      const res = await cmInstantiator.instantiateContract(
        codeIds['TGE_CREDITS'],
        JSON.stringify({
          dao_address: cmInstantiator.wallet.address.toString(),
        }),
        'credits',
      );
      expect(res).toBeTruthy();
      contractAddresses.TGE_CREDITS = res[0]._contract_address;
    });
    it('should instantiate price feed contract', async () => {
      const res = await cmInstantiator.instantiateContract(
        codeIds['TGE_PRICE_FEED_MOCK'],
        '{}',
        'price_feed',
      );
      expect(res).toBeTruthy();
      contractAddresses['TGE_PRICE_FEED_MOCK'] = res[0]._contract_address;
    });
    it('should instantiate coin registry', async () => {
      const res = await cmInstantiator.instantiateContract(
        codeIds['ASTRO_COIN_REGISTRY'],
        JSON.stringify({
          owner: cmInstantiator.wallet.address.toString(),
        }),
        'coin_registry',
      );
      expect(res).toBeTruthy();
      contractAddresses['ASTRO_COIN_REGISTRY'] = res[0]._contract_address;
    });
    it('should instantiate astro pair astro factory', async () => {
      const instantiateMsg = {
        pair_configs: [
          {
            code_id: codeIds.ASTRO_PAIR,
            pair_type: {
              xyk: {},
            },
            total_fee_bps: 0,
            maker_fee_bps: 0,
            is_disabled: false,
            is_generator_disabled: false,
          },
        ],
        token_code_id: codeIds.ASTRO_TOKEN,
        owner: cmInstantiator.wallet.address.toString(),
        whitelist_code_id: 0,
        coin_registry_address: contractAddresses['ASTRO_COIN_REGISTRY'],
      };
      const res = await cmInstantiator.instantiateContract(
        codeIds.ASTRO_FACTORY,
        JSON.stringify(instantiateMsg),
        'astro_factory',
      );
      expect(res).toBeTruthy();
      contractAddresses['ASTRO_FACTORY'] = res[0]._contract_address;
    });
    it('should create pair ATOM/NTRN', async () => {
      const createMsg = {
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

      const res = await cmInstantiator.executeContract(
        contractAddresses.ASTRO_FACTORY,
        JSON.stringify(createMsg),
      );
      expect(res.code).toBe(0);
    });
    it('should create pair USDC/NTRN', async () => {
      const createMsg = {
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

      const res = await cmInstantiator.executeContract(
        contractAddresses.ASTRO_FACTORY,
        JSON.stringify(createMsg),
      );
      expect(res.code).toBe(0);
    });
    it('retrieve pair addresses', async () => {
      const res = await neutronChain.queryContract<{ pairs: PairInfo[] }>(
        contractAddresses.ASTRO_FACTORY,
        {
          pairs: {},
        },
      );
      expect(res.pairs).toHaveLength(2);
      pairs = {
        atom_ntrn: {
          contract: res.pairs[0].contract_addr,
          liqiudity: res.pairs[0].liquidity_token,
        },
        usdc_ntrn: {
          contract: res.pairs[1].contract_addr,
          liqiudity: res.pairs[1].liquidity_token,
        },
      };
    });
    it('should instantiate vesting contracts', async () => {
      let msg = {
        owner: cmInstantiator.wallet.address.toString(),
        token_info_manager:
          testState.wallets.qaNeutronFour.genQaWal1.address.toString(),
        vesting_managers: [],
      };
      const res = await cmInstantiator.instantiateContract(
        codeIds['VESTING_LP'],
        JSON.stringify(msg),
        'vesting_atom_lp',
      );
      expect(res).toBeTruthy();
      contractAddresses['VESTING_ATOM'] = res[0]._contract_address;
      msg = {
        owner: cmInstantiator.wallet.address.toString(),
        token_info_manager:
          testState.wallets.qaNeutronFour.genQaWal1.address.toString(),
        vesting_managers: [],
      };
      const res2 = await cmInstantiator.instantiateContract(
        codeIds['VESTING_LP'],
        JSON.stringify(msg),
        'vesting_usdc_lp',
      );
      expect(res2).toBeTruthy();
      contractAddresses['VESTING_USDC'] = res2[0]._contract_address;
    });
    it('should not be able to set token info by stranger', async () => {
      await expect(
        cmStranger.executeContract(
          contractAddresses['VESTING_ATOM'],
          JSON.stringify({
            set_vesting_token: {
              vesting_token: {
                token: { contract_addr: pairs.usdc_ntrn.liqiudity },
              },
            },
          }),
        ),
      ).rejects.toThrowError(/Unauthorized/);
    });
    it('should set vesting tokens by token info manager', async () => {
      const res1 = await cmInstantiator.executeContract(
        contractAddresses['VESTING_ATOM'],
        JSON.stringify({
          set_vesting_token: {
            vesting_token: {
              token: { contract_addr: pairs.atom_ntrn.liqiudity },
            },
          },
        }),
      );
      expect(res1.code).toBe(0);
      const res2 = await cmInstantiator.executeContract(
        contractAddresses['VESTING_USDC'],
        JSON.stringify({
          set_vesting_token: {
            vesting_token: {
              token: { contract_addr: pairs.usdc_ntrn.liqiudity },
            },
          },
        }),
      );
      expect(res2.code).toBe(0);
    });
    it('should instantiate auction contract', async () => {
      times.auctionInitTs = (Date.now() / 1000 + 20) | 0;
      times.auctionDepositWindow = 30;
      times.auctionWithdrawalWindow = 30;
      times.auctionLpLockWindow = 40;
      times.auctionVestingLpDuration = 20;
      const res = await cmInstantiator.instantiateContract(
        codeIds.TGE_AUCTION,
        JSON.stringify({
          denom_manager: cmTokenManager.wallet.address.toString(),
          price_feed_contract: contractAddresses.TGE_PRICE_FEED_MOCK,
          reserve_contract_address: reserveAddress,
          vesting_usdc_contract_address: contractAddresses.VESTING_USDC,
          vesting_atom_contract_address: contractAddresses.VESTING_ATOM,
          lp_tokens_lock_window: times.auctionLpLockWindow,
          init_timestamp: times.auctionInitTs,
          deposit_window: times.auctionDepositWindow,
          withdrawal_window: times.auctionWithdrawalWindow,
          max_exchange_rate_age: 1000,
          min_ntrn_amount: '100000',
          vesting_migration_pack_size: 1,
          vesting_lp_duration: times.auctionVestingLpDuration,
        }),
        'auction',
      );
      contractAddresses.TGE_AUCTION = res[0]._contract_address;
    });
    it('should not be able to set denoms by stranger', async () => {
      await expect(
        cmStranger.executeContract(
          contractAddresses.TGE_AUCTION,
          JSON.stringify({
            set_denoms: {
              atom_denom: IBC_ATOM_DENOM,
              usdc_denom: IBC_USDC_DENOM,
            },
          }),
        ),
      ).rejects.toThrowError(/Only owner and denom_manager can update denoms/);
    });
    it('should set denoms by denom manager', async () => {
      const res = await cmTokenManager.executeContract(
        contractAddresses.TGE_AUCTION,
        JSON.stringify({
          set_denoms: {
            atom_denom: IBC_ATOM_DENOM,
            usdc_denom: IBC_USDC_DENOM,
          },
        }),
      );
      expect(res.code).toEqual(0);
    });
    it('should instantiate lockdrop contract', async () => {
      times.lockdropInitTs = (Date.now() / 1000 + 10) | 0;
      const msg = {
        credits_contract: contractAddresses.TGE_CREDITS,
        auction_contract: contractAddresses.TGE_AUCTION,
        init_timestamp: times.lockdropInitTs,
        token_info_manager: cmTokenManager.wallet.address.toString(),
        // atom_token: pairs.atom_ntrn.liqiudity,
        // usdc_token: pairs.usdc_ntrn.liqiudity,
        deposit_window: 20,
        withdrawal_window: 40,
        min_lock_duration: 1,
        max_lock_duration: 2,
        max_positions_per_user: 2,
        lock_window: 1000,
        lockup_rewards_info: [{ duration: 1, coefficient: '0' }],
      };
      const res = await cmInstantiator.instantiateContract(
        codeIds['TGE_LOCKDROP'],
        JSON.stringify(msg),
        'lockdrop',
      );
      expect(res).toBeTruthy();
      contractAddresses.TGE_LOCKDROP = res[0]._contract_address;
    });
    it('should instantiate astro generator', async () => {
      const msg = {
        astro_token: {
          native_token: {
            denom: NEUTRON_DENOM,
          },
        },
        factory: contractAddresses.ASTRO_FACTORY,
        owner: cmInstantiator.wallet.address.toString(),
        start_block: '1',
        tokens_per_block: '100',
        vesting_contract:
          'neutron1ell22k43hs2jtx8x50jz96agaqju5jwn87ued0mzcfglzlw6um0ssqx6x5',
        whitelist_code_id: codeIds.ASTRO_WHITELIST,
      };
      const res = await cmInstantiator.instantiateContract(
        codeIds.ASTRO_GENERATOR,
        JSON.stringify(msg),
        'astro_generator',
      );
      expect(res).toBeTruthy();
      contractAddresses['ASTRO_GENERATOR'] = res[0]._contract_address;
    });
    it('should not be able to set token info by stranger', async () => {
      await expect(
        cmStranger.executeContract(
          contractAddresses.TGE_LOCKDROP,
          JSON.stringify({
            set_token_info: {
              atom_token: pairs.atom_ntrn.liqiudity,
              usdc_token: pairs.usdc_ntrn.liqiudity,
              generator: contractAddresses.ASTRO_GENERATOR,
            },
          }),
        ),
      ).rejects.toThrowError(/Unauthorized/);
    });
    it('should set to set tokens info by token info manager', async () => {
      const res = await cmTokenManager.executeContract(
        contractAddresses.TGE_LOCKDROP,
        JSON.stringify({
          set_token_info: {
            atom_token: pairs.atom_ntrn.liqiudity,
            usdc_token: pairs.usdc_ntrn.liqiudity,
            generator: contractAddresses.ASTRO_GENERATOR,
          },
        }),
      );
      expect(res.code).toEqual(0);
    });
    it('sets lockdrop address', async () => {
      const res = await cmInstantiator.executeContract(
        contractAddresses.TGE_AUCTION,
        JSON.stringify({
          update_config: {
            new_config: {
              lockdrop_contract_address: contractAddresses.TGE_LOCKDROP,
              pool_info: {
                ntrn_usdc_pool_address: pairs.usdc_ntrn.contract,
                ntrn_atom_pool_address: pairs.atom_ntrn.contract,
                ntrn_usdc_lp_token_address: pairs.usdc_ntrn.liqiudity,
                ntrn_atom_lp_token_address: pairs.atom_ntrn.liqiudity,
              },
            },
          },
        }),
      );
      expect(res.code).toEqual(0);
    });
    it('sets vesting manager for vesting contracts', async () => {
      const res1 = await cmInstantiator.executeContract(
        contractAddresses.VESTING_ATOM,
        JSON.stringify({
          add_vesting_managers: {
            managers: [contractAddresses.TGE_AUCTION],
          },
        }),
      );
      expect(res1.code).toEqual(0);
      const res2 = await cmInstantiator.executeContract(
        contractAddresses.VESTING_USDC,
        JSON.stringify({
          add_vesting_managers: {
            managers: [contractAddresses.TGE_AUCTION],
          },
        }),
      );
      expect(res2.code).toEqual(0);
    });
  });

  describe('Auction', () => {
    describe('Phase 1', () => {
      it('should not allow deposit before init', async () => {
        await expect(
          cmInstantiator.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              deposit: {},
            }),
            [
              {
                amount: '10000',
                denom: IBC_ATOM_DENOM,
              },
            ],
          ),
        ).rejects.toThrow(/Deposit window closed/);
      });
      it('should allow deposit ATOM', async () => {
        await waitTill(times.auctionInitTs + 10);
        const atomBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          contractAddresses.TGE_AUCTION,
          JSON.stringify({
            deposit: {},
          }),
          [
            {
              amount: ATOM_DEPOSIT_AMOUNT.toString(),
              denom: IBC_ATOM_DENOM,
            },
          ],
        );
        expect(res.code).toEqual(0);
        const info = await neutronChain.queryContract<UserInfoResponse>(
          contractAddresses.TGE_AUCTION,
          {
            user_info: {
              address: cmInstantiator.wallet.address.toString(),
            },
          },
        );
        const atomBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        expect(info.atom_deposited).toEqual(ATOM_DEPOSIT_AMOUNT.toString());
        expect(atomBalanceAfter).toEqual(
          atomBalanceBefore - ATOM_DEPOSIT_AMOUNT,
        );
        atomBalance += ATOM_DEPOSIT_AMOUNT;
      });
      it('should allow deposit USDC', async () => {
        const usdcBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          contractAddresses.TGE_AUCTION,
          JSON.stringify({
            deposit: {},
          }),
          [
            {
              amount: USDC_DEPOSIT_AMOUNT.toString(),
              denom: IBC_USDC_DENOM,
            },
          ],
        );
        expect(res.code).toEqual(0);
        const info = await neutronChain.queryContract<UserInfoResponse>(
          contractAddresses.TGE_AUCTION,
          {
            user_info: {
              address: cmInstantiator.wallet.address.toString(),
            },
          },
        );
        const usdcBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        expect(info.usdc_deposited).toEqual(USDC_DEPOSIT_AMOUNT.toString());
        expect(usdcBalanceAfter).toEqual(
          usdcBalanceBefore - USDC_DEPOSIT_AMOUNT,
        );
        usdcBalance += USDC_DEPOSIT_AMOUNT;
      });
      it('should be able to witdraw', async () => {
        const atomBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const usdcBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          contractAddresses.TGE_AUCTION,
          JSON.stringify({
            withdraw: {
              amount_usdc: '5000',
              amount_atom: '5000',
            },
          }),
        );
        expect(res.code).toEqual(0);
        const info = await neutronChain.queryContract<UserInfoResponse>(
          contractAddresses.TGE_AUCTION,
          {
            user_info: {
              address: cmInstantiator.wallet.address.toString(),
            },
          },
        );
        const atomBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const usdcBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        atomBalance -= 5000;
        usdcBalance -= 5000;
        expect(info.atom_deposited).toEqual(atomBalance.toString());
        expect(info.usdc_deposited).toEqual(usdcBalance.toString());
        expect(atomBalanceAfter).toEqual(atomBalanceBefore + 5000);
        expect(usdcBalanceAfter).toEqual(usdcBalanceBefore + 5000);
      });
    });
    describe('Phase 2', () => {
      it('should not allow deposit when deposit window is closed', async () => {
        await waitTill(times.auctionInitTs + times.auctionDepositWindow + 5);
        await expect(
          cmInstantiator.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              deposit: {},
            }),
            [
              {
                amount: '10000',
                denom: IBC_ATOM_DENOM,
              },
            ],
          ),
        ).rejects.toThrow(/Deposit window closed/);
      });
      it('should not be able to withdraw mode than 50% of current deposit', async () => {
        await expect(
          cmInstantiator.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              withdraw: {
                amount_usdc: '5000',
                amount_atom: '5000',
              },
            }),
          ),
        ).rejects.toThrow(
          /Amount exceeds maximum allowed withdrawal limit of 0.5/,
        );
      });
      it('should be able to withdraw', async () => {
        const atomBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const usdcBalanceBefore = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        const res = await cmInstantiator.executeContract(
          contractAddresses.TGE_AUCTION,
          JSON.stringify({
            withdraw: {
              amount_usdc: '1000',
              amount_atom: '1000',
            },
          }),
        );
        expect(res.code).toEqual(0);
        atomBalance -= 1000;
        usdcBalance -= 1000;
        const info = await neutronChain.queryContract<UserInfoResponse>(
          contractAddresses.TGE_AUCTION,
          {
            user_info: {
              address: cmInstantiator.wallet.address.toString(),
            },
          },
        );
        const atomBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_ATOM_DENOM,
        );
        const usdcBalanceAfter = await neutronChain.queryDenomBalance(
          cmInstantiator.wallet.address.toString(),
          IBC_USDC_DENOM,
        );
        expect(info.atom_deposited).toEqual(atomBalance.toString());
        expect(info.usdc_deposited).toEqual(usdcBalance.toString());
        expect(info.withdrawn).toEqual(true);
        expect(atomBalanceAfter).toEqual(atomBalanceBefore + 1000);
        expect(usdcBalanceAfter).toEqual(usdcBalanceBefore + 1000);
      });
      it('should not allow to withdraw more than once', async () => {
        await expect(
          cmInstantiator.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              withdraw: {
                amount_usdc: '1000',
                amount_atom: '1000',
              },
            }),
          ),
        ).rejects.toThrow(/Max 1 withdrawal allowed/);
      });
    });
    describe('Phase 3', () => {
      describe('set_pool_size', () => {
        it('should not be able to set pool size before withdrawal_window is closed', async () => {
          await expect(
            cmInstantiator.executeContract(
              contractAddresses.TGE_AUCTION,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Deposit\/withdrawal windows are still open/);
        });
        it('should not be able to set pool size bc of wrong price feed data', async () => {
          await waitTill(
            times.auctionInitTs +
              times.auctionDepositWindow +
              times.auctionWithdrawalWindow +
              5,
          );
          await expect(
            cmInstantiator.executeContract(
              contractAddresses.TGE_AUCTION,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Invalid price feed data/);
        });
        it('should not be able to set pool size (no NTRN)', async () => {
          const time = (Date.now() / 1000) | 0;
          const r1 = await cmInstantiator.executeContract(
            contractAddresses.TGE_PRICE_FEED_MOCK,
            JSON.stringify({
              set_rate: {
                symbol: 'ATOM',
                rate: {
                  rate: '13891850',
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            }),
          );
          expect(r1.code).toEqual(0);
          const r2 = await cmInstantiator.executeContract(
            contractAddresses.TGE_PRICE_FEED_MOCK,
            JSON.stringify({
              set_rate: {
                symbol: 'USDT',
                rate: {
                  rate: '999950',
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            }),
          );
          expect(r2.code).toEqual(0);
          await expect(
            cmInstantiator.executeContract(
              contractAddresses.TGE_AUCTION,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Not enough NTRN in the contract/);
        });
        it('should not be able to set pool size when price feed data is set but too old', async () => {
          await cmInstantiator.msgSend(contractAddresses.TGE_AUCTION, {
            amount: NTRN_AMOUNT.toString(),
          });
          const time = (Date.now() / 1000 - 10000) | 0;
          const r1 = await cmInstantiator.executeContract(
            contractAddresses.TGE_PRICE_FEED_MOCK,
            JSON.stringify({
              set_rate: {
                symbol: 'ATOM',
                rate: {
                  rate: '10000000',
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            }),
          );
          expect(r1.code).toEqual(0);
          const r2 = await cmInstantiator.executeContract(
            contractAddresses.TGE_PRICE_FEED_MOCK,
            JSON.stringify({
              set_rate: {
                symbol: 'USDT',
                rate: {
                  rate: '1000000',
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            }),
          );
          expect(r2.code).toEqual(0);

          await expect(
            cmInstantiator.executeContract(
              contractAddresses.TGE_AUCTION,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Price feed data is too old/);
        });
        it('should be able to set pool size', async () => {
          const time = (Date.now() / 1000) | 0;
          const r1 = await cmInstantiator.executeContract(
            contractAddresses.TGE_PRICE_FEED_MOCK,
            JSON.stringify({
              set_rate: {
                symbol: 'ATOM',
                rate: {
                  rate: ATOM_RATE.toString(),
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            }),
          );
          expect(r1.code).toEqual(0);
          const r2 = await cmInstantiator.executeContract(
            contractAddresses.TGE_PRICE_FEED_MOCK,
            JSON.stringify({
              set_rate: {
                symbol: 'USDT',
                rate: {
                  rate: USDC_RATE.toString(),
                  resolve_time: time.toString(),
                  request_id: '1',
                },
              },
            }),
          );
          expect(r2.code).toEqual(0);

          const res = await cmInstantiator.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              set_pool_size: {},
            }),
          );
          expect(res.code).toEqual(0);
          const state = await neutronChain.queryContract<AuctionStateResponse>(
            contractAddresses.TGE_AUCTION,
            {
              state: {},
            },
          );

          const usdcToAtomRate = ATOM_RATE / USDC_RATE;
          const totalInUSDC = usdcToAtomRate * atomBalance + usdcBalance;
          ntrnAtomSize = Math.floor(
            NTRN_AMOUNT * ((atomBalance * usdcToAtomRate) / totalInUSDC),
          );
          ntrnUsdcSize = NTRN_AMOUNT - ntrnAtomSize;
          atomLpSize = getLpSize(atomBalance, ntrnAtomSize);
          usdcLpSize = getLpSize(usdcBalance, ntrnUsdcSize);

          expect(parseInt(state.atom_ntrn_size)).toBeCloseTo(ntrnAtomSize, -1);
          expect(parseInt(state.usdc_ntrn_size)).toBeCloseTo(ntrnUsdcSize, -1);
          expect(parseInt(state.atom_lp_size)).toBeCloseTo(atomLpSize, -1);
          expect(parseInt(state.usdc_lp_size)).toBeCloseTo(usdcLpSize, -1);

          expect(state).toMatchObject({
            atom_lp_locked: '0',
            is_rest_lp_vested: false,
            lp_atom_shares_minted: null,
            lp_usdc_shares_minted: null,
            pool_init_timestamp: 0,
            total_atom_deposited: atomBalance.toString(),
            total_usdc_deposited: usdcBalance.toString(),
            usdc_lp_locked: '0',
          });
        });
        it('should not be able to set pool size twice', async () => {
          await expect(
            cmInstantiator.executeContract(
              contractAddresses.TGE_AUCTION,
              JSON.stringify({
                set_pool_size: {},
              }),
            ),
          ).rejects.toThrow(/Pool size has already been set/);
        });
      });
      describe('lock_lp', () => {
        it('should be able to lock ATOM LP tokens', async () => {
          const res = await cmInstantiator.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              lock_lp: {
                amount: '77',
                asset: 'ATOM',
                duration: 1,
              },
            }),
          );
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            contractAddresses.TGE_AUCTION,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(res.code).toEqual(0);
          expect(parseInt(userInfo.atom_lp_locked)).toEqual(77);
          atomLpLocked += 77;
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            contractAddresses.TGE_LOCKDROP,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(info.lockup_infos).toHaveLength(1);
          expect(info.lockup_infos[0]).toMatchObject({
            lp_units_locked: atomLpLocked.toString(),
            pool_type: 'ATOM',
          });
        });
        it('should be able to lock USDC LP tokens', async () => {
          const res = await cmInstantiator.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              lock_lp: {
                amount: '100',
                asset: 'USDC',
                duration: 1,
              },
            }),
          );
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            contractAddresses.TGE_AUCTION,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(res.code).toEqual(0);
          usdcLpLocked += 100;
          expect(parseInt(userInfo.usdc_lp_locked)).toEqual(100);
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            contractAddresses.TGE_LOCKDROP,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(info.lockup_infos).toHaveLength(2);
          expect(info.lockup_infos[1]).toMatchObject({
            lp_units_locked: usdcLpLocked.toString(),
            pool_type: 'USDC',
          });
        });
        it('should not be able to lock ATOM LP tokens more than have', async () => {
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            contractAddresses.TGE_AUCTION,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          await expect(
            cmInstantiator.executeContract(
              contractAddresses.TGE_AUCTION,
              JSON.stringify({
                lock_lp: {
                  amount: userInfo.atom_lp_amount,
                  asset: 'ATOM',
                  duration: 1,
                },
              }),
            ),
          ).rejects.toThrow(/Not enough ATOM LP/);
        });
        it('should not be able to lock USDC LP tokens more than have', async () => {
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            contractAddresses.TGE_AUCTION,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          await expect(
            cmInstantiator.executeContract(
              contractAddresses.TGE_AUCTION,
              JSON.stringify({
                lock_lp: {
                  amount: userInfo.usdc_lp_amount,
                  asset: 'USDC',
                  duration: 1,
                },
              }),
            ),
          ).rejects.toThrow(/Not enough USDC LP/);
        });
        it('should be able to withdraw ATOM LP tokens', async () => {
          const res = await cmInstantiator.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              withdraw_lp: {
                asset: 'ATOM',
                amount: '10',
                duration: 1,
              },
            }),
          );
          expect(res.code).toEqual(0);
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            contractAddresses.TGE_LOCKDROP,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          atomLpLocked -= 10;
          expect(info.lockup_infos[0]).toMatchObject({
            lp_units_locked: atomLpLocked.toString(),
            pool_type: 'ATOM',
          });
          const userInfo = await neutronChain.queryContract<UserInfoResponse>(
            contractAddresses.TGE_AUCTION,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(res.code).toEqual(0);
          expect(parseInt(userInfo.atom_lp_locked)).toEqual(67);
        });
        it('should be able to withdraw USDC LP tokens', async () => {
          const res = await cmInstantiator.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              withdraw_lp: {
                asset: 'USDC',
                amount: '10',
                duration: 1,
              },
            }),
          );
          expect(res.code).toEqual(0);
          usdcLpLocked -= 10;
          const info = await neutronChain.queryContract<LockDropInfoResponse>(
            contractAddresses.TGE_LOCKDROP,
            {
              user_info: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          );
          expect(info.lockup_infos[1]).toMatchObject({
            lp_units_locked: usdcLpLocked.toString(),
            pool_type: 'USDC',
          });
        });
        it('should not be able to lock tokens when time is up', async () => {
          await waitTill(
            times.auctionInitTs +
              times.auctionDepositWindow +
              times.auctionWithdrawalWindow +
              times.auctionLpLockWindow +
              5,
          );
          await expect(
            cmInstantiator.executeContract(
              contractAddresses.TGE_AUCTION,
              JSON.stringify({
                lock_lp: {
                  amount: '100',
                  asset: 'ATOM',
                  duration: 1,
                },
              }),
            ),
          ).rejects.toThrow(/Lock window is closed/);
        });
      });
      it('should set generator to lockdrop', async () => {
        const res = await cmInstantiator.executeContract(
          contractAddresses.TGE_LOCKDROP,
          JSON.stringify({
            update_config: {
              new_config: {
                generator_address: contractAddresses.ASTRO_GENERATOR,
              },
            },
          }),
        );
        expect(res.code).toEqual(0);
      });
    });
    describe('Init pool', () => {
      it('should init pool', async () => {
        const res = await cmInstantiator.executeContract(
          contractAddresses.TGE_AUCTION,
          JSON.stringify({
            init_pool: {},
          }),
        );
        expect(res.code).toEqual(0);
        const [
          auctionState,
          atomPoolInfo,
          usdcPoolInfo,
          reserveLPBalanceAtomNtrn,
          reserveLPBalanceUsdcNtrn,
          auctionLPBalanceAtomNtrn,
          auctionLPBalanceUsdcNtrn,
          lockdropLPBalanceAtomNtrn,
          lockdropLPBalanceUsdcNtrn,
          generatorLPBalanceAtomNtrn,
          generatorLPBalanceUsdcNtrn,
        ] = await Promise.all([
          neutronChain.queryContract<AuctionStateResponse>(
            contractAddresses.TGE_AUCTION,
            {
              state: {},
            },
          ),
          neutronChain.queryContract<PoolInfoResponse>(
            pairs.atom_ntrn.contract,
            {
              pool: {},
            },
          ),
          neutronChain.queryContract<PoolInfoResponse>(
            pairs.usdc_ntrn.contract,
            {
              pool: {},
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            pairs.atom_ntrn.liqiudity,
            {
              balance: {
                address: reserveAddress,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            pairs.usdc_ntrn.liqiudity,
            {
              balance: {
                address: reserveAddress,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            pairs.atom_ntrn.liqiudity,
            {
              balance: {
                address: contractAddresses.TGE_AUCTION,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            pairs.usdc_ntrn.liqiudity,
            {
              balance: {
                address: contractAddresses.TGE_AUCTION,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            pairs.atom_ntrn.liqiudity,
            {
              balance: {
                address: contractAddresses.TGE_LOCKDROP,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            pairs.usdc_ntrn.liqiudity,
            {
              balance: {
                address: contractAddresses.TGE_LOCKDROP,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            pairs.atom_ntrn.liqiudity,
            {
              balance: {
                address: contractAddresses.ASTRO_GENERATOR,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            pairs.usdc_ntrn.liqiudity,
            {
              balance: {
                address: contractAddresses.ASTRO_GENERATOR,
              },
            },
          ),
        ]);
        expect(auctionState.pool_init_timestamp).toBeGreaterThan(0);
        expect(
          Math.abs(
            parseInt(reserveLPBalanceAtomNtrn.balance) -
              parseInt(auctionState.atom_lp_size) / 2,
          ),
        ).toBeLessThan(1);
        expect(
          Math.abs(
            parseInt(reserveLPBalanceUsdcNtrn.balance) -
              parseInt(auctionState.usdc_lp_size) / 2,
          ),
        ).toBeLessThan(1);

        expect(generatorLPBalanceAtomNtrn).toEqual({
          balance: auctionState.atom_lp_locked,
        });
        expect(generatorLPBalanceUsdcNtrn).toEqual({
          balance: auctionState.usdc_lp_locked,
        });
        expect(lockdropLPBalanceAtomNtrn).toEqual({
          balance: '0',
        });
        expect(lockdropLPBalanceUsdcNtrn).toEqual({
          balance: '0',
        });

        expect(
          Math.abs(
            parseInt(auctionLPBalanceAtomNtrn.balance) -
              (parseInt(auctionState.atom_lp_size) / 2 -
                parseInt(auctionState.atom_lp_locked)),
          ),
        ).toBeLessThan(1);
        expect(
          Math.abs(
            parseInt(auctionLPBalanceUsdcNtrn.balance) -
              (parseInt(auctionState.usdc_lp_size) / 2 -
                parseInt(auctionState.usdc_lp_locked)),
          ),
        ).toBeLessThan(1);

        expect(atomPoolInfo.assets[0].amount).toEqual(atomBalance.toString());
        expect(parseInt(atomPoolInfo.assets[1].amount)).toBeCloseTo(
          ntrnAtomSize,
          -1,
        );
        expect(parseInt(atomPoolInfo.total_share)).toEqual(
          parseInt(auctionState.atom_lp_size) + MIN_LIQUDITY,
        );

        expect(usdcPoolInfo.assets[0].amount).toEqual(usdcBalance.toString());
        expect(parseInt(usdcPoolInfo.assets[1].amount)).toBeCloseTo(
          ntrnUsdcSize,
          -1,
        );
        expect(parseInt(usdcPoolInfo.total_share)).toEqual(
          parseInt(auctionState.usdc_lp_size) + MIN_LIQUDITY,
        );
        expect(atomLpSize).toBeCloseTo(
          parseInt(atomPoolInfo.total_share) - MIN_LIQUDITY,
          -1,
        );
        expect(usdcLpSize).toBeCloseTo(
          parseInt(usdcPoolInfo.total_share) - MIN_LIQUDITY,
          -1,
        );
      });
      it('should not be able to init pool twice', async () => {
        await expect(
          cmInstantiator.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              init_pool: {},
            }),
          ),
        ).rejects.toThrow(/Liquidity already added/);
      });
    });
    describe('Vest LP', () => {
      let claimAtomLP: number;
      let claimUsdcLP: number;
      it('should vest LP', async () => {
        const res = await cmInstantiator.executeContract(
          contractAddresses.TGE_AUCTION,
          JSON.stringify({
            migrate_to_vesting: {},
          }),
        );
        expect(res.code).toEqual(0);
        times.vestTimestamp = Date.now();
      });
      it('should not vest LP as we had only one user', async () => {
        await expect(
          cmInstantiator.executeContract(
            contractAddresses.TGE_AUCTION,
            JSON.stringify({
              migrate_to_vesting: {},
            }),
          ),
        ).rejects.toThrow(/No users to migrate/);
      });
      it('should validate numbers', async () => {
        const [
          vestingInfoAtom,
          vestingInfoUsdc,
          lpAuctionBalanceAtom,
          lpAuctionBalanceUsdc,
        ] = await Promise.all([
          neutronChain.queryContract<VestingAccountResponse>(
            contractAddresses.VESTING_ATOM,
            {
              vesting_account: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
          neutronChain.queryContract<VestingAccountResponse>(
            contractAddresses.VESTING_USDC,
            {
              vesting_account: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            pairs.atom_ntrn.liqiudity,
            {
              balance: {
                address: contractAddresses.TGE_AUCTION,
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            pairs.usdc_ntrn.liqiudity,
            {
              balance: {
                address: contractAddresses.TGE_AUCTION,
              },
            },
          ),
        ]);
        expect(parseInt(lpAuctionBalanceUsdc.balance)).toBeLessThanOrEqual(1);
        expect(parseInt(lpAuctionBalanceAtom.balance)).toBeLessThanOrEqual(1);
        expect(vestingInfoAtom.address).toEqual(
          cmInstantiator.wallet.address.toString(),
        );
        expect(vestingInfoUsdc.address).toEqual(
          cmInstantiator.wallet.address.toString(),
        );
        expect(vestingInfoAtom.info.released_amount).toEqual('0');
        expect(vestingInfoUsdc.info.released_amount).toEqual('0');
        expect(
          parseInt(vestingInfoAtom.info.schedules[0].end_point.amount),
        ).toBeCloseTo(atomLpSize / 2 - atomLpLocked, -1);
        claimAtomLP = parseInt(
          vestingInfoAtom.info.schedules[0].end_point.amount,
        );
        expect(
          parseInt(vestingInfoUsdc.info.schedules[0].end_point.amount),
        ).toBeCloseTo(usdcLpSize / 2 - usdcLpLocked, -1);
        claimUsdcLP = parseInt(
          vestingInfoUsdc.info.schedules[0].end_point.amount,
        );
      });
      it('should be able to claim lpATOM_NTRN vesting after vesting period', async () => {
        await waitTill(
          times.vestTimestamp / 1000 + times.auctionVestingLpDuration + 10,
        );
        const [avaliableAtomLp, avaliableUsdcLp] = await Promise.all([
          neutronChain.queryContract<string>(contractAddresses.VESTING_ATOM, {
            available_amount: {
              address: cmInstantiator.wallet.address.toString(),
            },
          }),
          neutronChain.queryContract<string>(contractAddresses.VESTING_USDC, {
            available_amount: {
              address: cmInstantiator.wallet.address.toString(),
            },
          }),
        ]);
        expect(avaliableAtomLp).toEqual(claimAtomLP.toString());
        expect(avaliableUsdcLp).toEqual(claimUsdcLP.toString());
        const resAtom = await cmInstantiator.executeContract(
          contractAddresses.VESTING_ATOM,
          JSON.stringify({
            claim: {},
          }),
        );
        expect(resAtom.code).toEqual(0);
        const resUsdc = await cmInstantiator.executeContract(
          contractAddresses.VESTING_USDC,
          JSON.stringify({
            claim: {},
          }),
        );
        expect(resUsdc.code).toEqual(0);

        const [lpBalanceAtom, lpBalanceUsdc] = await Promise.all([
          neutronChain.queryContract<BalanceResponse>(
            pairs.atom_ntrn.liqiudity,
            {
              balance: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
          neutronChain.queryContract<BalanceResponse>(
            pairs.usdc_ntrn.liqiudity,
            {
              balance: {
                address: cmInstantiator.wallet.address.toString(),
              },
            },
          ),
        ]);
        expect(parseInt(lpBalanceAtom.balance)).toBeCloseTo(claimAtomLP, -1);
        expect(parseInt(lpBalanceUsdc.balance)).toBeCloseTo(claimUsdcLP, -1);
      });
    });
  });
});
