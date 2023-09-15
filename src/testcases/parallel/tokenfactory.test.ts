/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TestStateLocalCosmosTestNet } from '../common_localcosmosnet';
import {
  CosmosWrapper,
  getEventAttribute,
  NEUTRON_DENOM,
  WalletWrapper,
} from '../../helpers/cosmos';
import axios from 'axios';
import { Wallet } from '../../types';
import { NeutronContract } from '../../helpers/types';
import {
  msgBurn,
  msgChangeAdmin,
  msgCreateDenom,
  msgMintDenom,
  msgSetBeforeSendHook,
} from '../../helpers/tokenfactory';

interface DenomsFromCreator {
  readonly denoms: readonly string[];
}

interface AuthorityMetadata {
  readonly authority_metadata: { readonly Admin: string };
}

interface BeforeSendHook {
  readonly cosmwasm_address: string;
}

describe('Neutron / Tokenfactory', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let ownerWallet: Wallet;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    ownerWallet = testState.wallets.qaNeutron.genQaWal1;
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new WalletWrapper(neutronChain, ownerWallet);
  });

  test('tokenfactory module is added', async () => {
    const paramsPresent = await checkTokenfactoryParams(neutronChain.sdk.url);
    expect(paramsPresent).toBeTruthy();
  });

  describe('Module itself', () => {
    test('create denoms and check list', async () => {
      const denom = 'test1';
      const data = await msgCreateDenom(
        neutronAccount,
        ownerWallet.address.toString(),
        'test1',
      );

      const newTokenDenom = getEventAttribute(
        (data as any).events,
        'create_denom',
        'new_token_denom',
      );

      expect(newTokenDenom).toEqual(
        `factory/${ownerWallet.address.toString()}/${denom}`,
      );

      const denomsAfter = await getDenomsFromCreator(
        neutronChain.sdk.url,
        ownerWallet.address.toString(),
      );

      expect(denomsAfter.denoms).toContainEqual(
        `factory/${ownerWallet.address.toString()}/${denom}`,
      );
    });

    test('create denom, mint', async () => {
      const denom = `test2`;

      const data = await msgCreateDenom(
        neutronAccount,
        ownerWallet.address.toString(),
        denom,
      );
      const newTokenDenom = getEventAttribute(
        (data as any).events,
        'create_denom',
        'new_token_denom',
      );

      await msgMintDenom(neutronAccount, ownerWallet.address.toString(), {
        denom: newTokenDenom,
        amount: '10000',
      });

      const balanceBefore = await neutronChain.queryDenomBalance(
        ownerWallet.address.toString(),
        newTokenDenom,
      );

      expect(balanceBefore).toEqual(10000);
    });

    test('check authority metadata update', async () => {
      const denom = `test3`;

      const data = await msgCreateDenom(
        neutronAccount,
        ownerWallet.address.toString(),
        denom,
      );
      const newTokenDenom = getEventAttribute(
        (data as any).events,
        'create_denom',
        'new_token_denom',
      );

      const authorityMetadataBefore = await getAuthorityMetadata(
        neutronChain.sdk.url,
        newTokenDenom,
      );

      expect(authorityMetadataBefore.authority_metadata).toEqual({
        Admin: ownerWallet.address.toString(),
      });

      const newAdmin = 'neutron1pyqyzrh6p4skmm43zrpt77wgrqq588vc8nhpfz';

      await msgChangeAdmin(
        neutronAccount,
        ownerWallet.address.toString(),
        newTokenDenom,
        newAdmin,
      );

      const authorityMetadataAfter = await getAuthorityMetadata(
        neutronChain.sdk.url,
        newTokenDenom,
      );

      expect(authorityMetadataAfter.authority_metadata).toEqual({
        Admin: newAdmin,
      });
    });

    // Test denom creation, mint some coins and burn some of them
    test('create denom, mint and burn', async () => {
      const denom = `test4`;

      const data = await msgCreateDenom(
        neutronAccount,
        ownerWallet.address.toString(),
        denom,
      );
      const newTokenDenom = getEventAttribute(
        (data as any).events,
        'create_denom',
        'new_token_denom',
      );
      await msgMintDenom(neutronAccount, ownerWallet.address.toString(), {
        denom: newTokenDenom,
        amount: '10000',
      });

      const balanceBefore = await neutronChain.queryDenomBalance(
        ownerWallet.address.toString(),
        newTokenDenom,
      );

      expect(balanceBefore).toEqual(10000);

      await msgBurn(
        neutronAccount,
        ownerWallet.address.toString(),
        newTokenDenom,
        '100',
      );

      const balanceAfter = await neutronChain.queryDenomBalance(
        ownerWallet.address.toString(),
        newTokenDenom,
      );

      expect(balanceAfter).toEqual(9900);
    });
    test('create denom, set before send hook', async () => {
      const codeId = await neutronAccount.storeWasm(
        NeutronContract.BEFORE_SEND_HOOK_TEST,
      );
      expect(codeId).toBeGreaterThan(0);

      const res = await neutronAccount.instantiateContract(
        codeId,
        '{}',
        'before_send_hook_test',
      );
      const contractAddress = res[0]._contract_address;

      const denom = `test5`;

      const data = await msgCreateDenom(
        neutronAccount,
        ownerWallet.address.toString(),
        denom,
      );
      const newTokenDenom = getEventAttribute(
        (data as any).events,
        'create_denom',
        'new_token_denom',
      );

      await msgMintDenom(neutronAccount, ownerWallet.address.toString(), {
        denom: newTokenDenom,
        amount: '10000',
      });

      const balanceBefore = await neutronChain.queryDenomBalance(
        ownerWallet.address.toString(),
        newTokenDenom,
      );

      expect(balanceBefore).toEqual(10000);

      await neutronAccount.msgSend(contractAddress, {
        amount: '666',
        denom: newTokenDenom,
      });

      const contractBalance = await neutronChain.queryDenomBalance(
        contractAddress,
        newTokenDenom,
      );
      expect(contractBalance).toEqual(666);

      let queryBlock = await neutronChain.queryContract<{
        block: { received: boolean };
      }>(contractAddress, {
        sudo_result_block_before: {},
      });
      console.log(queryBlock);

      let queryTrack = await neutronChain.queryContract<{
        track: { received: boolean };
      }>(contractAddress, {
        sudo_result_track_before: {},
      });
      console.log(queryTrack);

      await msgSetBeforeSendHook(
        neutronAccount,
        ownerWallet.address.toString(),
        newTokenDenom,
        contractAddress,
      );

      const hookAfter = await getBeforeSendHook(
        neutronChain.sdk.url,
        newTokenDenom,
      );
      expect(hookAfter.cosmwasm_address).toEqual(contractAddress);

      await neutronAccount.msgSend(contractAddress, {
        amount: '1',
        denom: newTokenDenom,
      });

      const contractBalanceAfter = await neutronChain.queryDenomBalance(
        contractAddress,
        newTokenDenom,
      );
      expect(contractBalanceAfter).toEqual(667);

      const balanceAfter = await neutronChain.queryDenomBalance(
        ownerWallet.address.toString(),
        newTokenDenom,
      );
      expect(balanceAfter).toEqual(9333);

      queryBlock = await neutronChain.queryContract<{
        block: { received: boolean };
      }>(contractAddress, {
        sudo_result_block_before: {},
      });

      queryTrack = await neutronChain.queryContract<{
        track: { received: boolean };
      }>(contractAddress, {
        sudo_result_track_before: {},
      });

      expect(queryTrack.track.received).toEqual(true);
      expect(queryBlock.block.received).toEqual(true);
    });
  });

  describe('wasmbindings', () => {
    let contractAddress: string;
    const subdenom = 'mycoin';
    let denom: string;
    let amount = 10000000;
    const toBurn = 1000000;

    test('setup contract', async () => {
      const codeId = await neutronAccount.storeWasm(
        NeutronContract.TOKENFACTORY,
      );
      expect(codeId).toBeGreaterThan(0);

      const res = await neutronAccount.instantiateContract(
        codeId,
        '{}',
        'tokenfactory',
      );
      contractAddress = res[0]._contract_address;

      await neutronAccount.msgSend(contractAddress, {
        amount: '10000000',
        denom: 'untrn',
      });
    });

    test('create denom', async () => {
      const res = await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          create_denom: {
            subdenom,
          },
        }),
      );
      denom = res.logs[0].events
        ?.find((event) => event.type == 'create_denom')
        ?.attributes?.find(
          (attribute) => attribute.key == 'new_token_denom',
        )?.value;
    });

    test('mint coins', async () => {
      await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          mint_tokens: {
            denom,
            amount: amount.toString(),
          },
        }),
      );

      const balance = await neutronChain.queryDenomBalance(
        contractAddress,
        denom,
      );
      expect(balance).toEqual(amount);
    });

    test('burn coins', async () => {
      await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          burn_tokens: {
            denom,
            amount: toBurn.toString(),
          },
        }),
      );
      amount -= toBurn;

      const balance = await neutronChain.queryDenomBalance(
        contractAddress,
        denom,
      );
      expect(balance).toEqual(amount);
    });

    test('full denom query', async () => {
      const res = await neutronChain.queryContract<{ denom: string }>(
        contractAddress,
        {
          full_denom: { creator_addr: contractAddress, subdenom },
        },
      );
      expect(res.denom).toEqual(denom);
    });

    test('denom admin query', async () => {
      const res = await neutronChain.queryContract<{ admin: string }>(
        contractAddress,
        {
          denom_admin: {
            subdenom: denom,
          },
        },
      );
      expect(res.admin).toEqual(contractAddress);
    });
    test('set_before_send_hook', async () => {
      await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          set_before_send_hook: {
            denom,
            cosm_wasm_addr: contractAddress,
          },
        }),
      );
      const res = await neutronChain.queryContract<{
        contract_addr: string;
      }>(contractAddress, {
        before_send_hook: {
          denom,
        },
      });
      expect(res.contract_addr).toEqual(contractAddress);

      await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          set_before_send_hook: {
            denom,
            cosm_wasm_addr: '',
          },
        }),
      );
    });

    test('change admin', async () => {
      await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          send_tokens: {
            recipient: neutronAccount.wallet.address.toString(),
            denom,
            amount: amount.toString(),
          },
        }),
      );
      await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          change_admin: {
            denom,
            new_admin_address: neutronAccount.wallet.address.toString(),
          },
        }),
      );

      const balance = await neutronChain.queryDenomBalance(
        neutronAccount.wallet.address.toString(),
        denom,
      );
      expect(balance).toEqual(amount);
      const res = await neutronChain.queryContract<{ admin: string }>(
        contractAddress,
        {
          denom_admin: {
            subdenom: denom,
          },
        },
      );
      expect(res.admin).toEqual(neutronAccount.wallet.address.toString());
    });
  });
});

const checkTokenfactoryParams = async (sdkUrl: string): Promise<boolean> => {
  try {
    await axios.get(`${sdkUrl}/osmosis/tokenfactory/v1beta1/params`);
    return true;
  } catch (e) {
    return false;
  }
};

const getDenomsFromCreator = async (
  sdkUrl: string,
  creator: string,
): Promise<DenomsFromCreator> => {
  const res = await axios.get<DenomsFromCreator>(
    `${sdkUrl}/osmosis/tokenfactory/v1beta1/denoms_from_creator/${creator}`,
  );

  return res.data;
};

const getAuthorityMetadata = async (
  sdkUrl: string,
  denom: string,
): Promise<AuthorityMetadata> => {
  const res = await axios.get<AuthorityMetadata>(
    `${sdkUrl}/osmosis/tokenfactory/v1beta1/denoms/${denom}/authority_metadata`,
  );

  return res.data;
};

const getBeforeSendHook = async (
  sdkUrl: string,
  denom: string,
): Promise<BeforeSendHook> => {
  const res = await axios.get<BeforeSendHook>(
    `${sdkUrl}/osmosis/tokenfactory/v1beta1/denoms/${denom}/before_send_hook`,
  );

  return res.data;
};
