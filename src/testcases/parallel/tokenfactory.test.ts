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
import { cosmosclient } from '@cosmos-client/core';
import { cosmos, osmosis } from '../../generated/proto';
import Long from 'long';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';
import { NeutronContract } from '../../helpers/types';
import ICoin = cosmos.base.v1beta1.ICoin;

cosmosclient.codec.register(
  '/osmosis.tokenfactory.v1beta1.MsgCreateDenom',
  osmosis.tokenfactory.v1beta1.MsgCreateDenom,
);
cosmosclient.codec.register(
  '/osmosis.tokenfactory.v1beta1.MsgMint',
  osmosis.tokenfactory.v1beta1.MsgMint,
);
cosmosclient.codec.register(
  '/osmosis.tokenfactory.v1beta1.MsgBurn',
  osmosis.tokenfactory.v1beta1.MsgBurn,
);
cosmosclient.codec.register(
  '/osmosis.tokenfactory.v1beta1.MsgChangeAdmin',
  osmosis.tokenfactory.v1beta1.MsgChangeAdmin,
);

interface DenomsFromCreator {
  readonly denoms: readonly string[];
}

interface AuthorityMetadata {
  readonly authority_metadata: { readonly Admin: string };
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

const msgMintDenom = async (
  cmNeutron: WalletWrapper,
  creator: string,
  amount: ICoin,
): Promise<InlineResponse20075TxResponse> => {
  const msgCreateDenom = new osmosis.tokenfactory.v1beta1.MsgMint({
    sender: creator,
    amount,
  });
  const res = await cmNeutron.execTx(
    {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: cmNeutron.chain.denom, amount: '1000' }],
    },
    [msgCreateDenom],
    10,
  );

  return res.tx_response!;
};

const msgCreateDenom = async (
  cmNeutron: WalletWrapper,
  creator: string,
  subdenom: string,
): Promise<InlineResponse20075TxResponse> => {
  const msgCreateDenom = new osmosis.tokenfactory.v1beta1.MsgCreateDenom({
    sender: creator,
    subdenom,
  });
  const res = await cmNeutron.execTx(
    {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: cmNeutron.chain.denom, amount: '1000' }],
    },
    [msgCreateDenom],
    10,
  );

  return res.tx_response!;
};

const msgBurn = async (
  cmNeutron: WalletWrapper,
  creator: string,
  denom: string,
  amountToBurn: string,
): Promise<InlineResponse20075TxResponse> => {
  const msgBurn = new osmosis.tokenfactory.v1beta1.MsgBurn({
    sender: creator,
    amount: {
      denom: denom,
      amount: amountToBurn,
    },
  });
  const res = await cmNeutron.execTx(
    {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: cmNeutron.chain.denom, amount: '1000' }],
    },
    [msgBurn],
    10,
  );

  return res.tx_response!;
};

// Create MsgChangeAdmin message
const msgChangeAdmin = async (
  cmNeutron: WalletWrapper,
  creator: string,
  denom: string,
  newAdmin: string,
): Promise<InlineResponse20075TxResponse> => {
  const msgChangeAdmin = new osmosis.tokenfactory.v1beta1.MsgChangeAdmin({
    sender: creator,
    denom,
    newAdmin,
  });
  const res = await cmNeutron.execTx(
    {
      gas_limit: Long.fromString('200000'),
      amount: [{ denom: cmNeutron.chain.denom, amount: '1000' }],
    },
    [msgChangeAdmin],
    10,
  );

  return res.tx_response!;
};
