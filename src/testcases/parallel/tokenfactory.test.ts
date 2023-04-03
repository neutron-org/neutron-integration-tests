/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TestStateLocalCosmosTestNet } from './../common_localcosmosnet';
import {
  CosmosWrapper,
  getEventAttribute,
  NEUTRON_DENOM,
} from '../../helpers/cosmos';
import axios from 'axios';
import { Wallet } from '../../types';
import { cosmosclient } from '@cosmos-client/core';
import { cosmos, osmosis } from '../../generated/proto';
import Long from 'long';
import { InlineResponse20075TxResponse } from '@cosmos-client/core/cjs/openapi/api';

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
  let cmNeutron: CosmosWrapper;
  let ownerWallet: Wallet;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    owner_wallet = testState.wallets.qaNeutron.genQaWal1;
    cmNeutron = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      owner_wallet,
      NEUTRON_DENOM,
    );
  });

  test('tokenfactory module is added', async () => {
    const paramsPresent = await checkTokenfactoryParams(cmNeutron.sdk.url);
    expect(paramsPresent).toBeTruthy();
  });

  test('create denoms and check list', async () => {
    const denom = 'test1';

    const data = await msgCreateDenom(
      cmNeutron,
      owner_wallet.address.toString(),
      'test1',
    );

    const newTokenDenom = getEventAttribute(
      (data as any).events,
      'create_denom',
      'new_token_denom',
    );

    expect(newTokenDenom).toEqual(
      `factory/${owner_wallet.address.toString()}/${denom}`,
    );

    const denomsAfter = await getDenomsFromCreator(
      cmNeutron.sdk.url,
      owner_wallet.address.toString(),
    );

    expect(denomsAfter.denoms).toContainEqual(
      `factory/${owner_wallet.address.toString()}/${denom}`,
    );
  });

  test('create denom, mint', async () => {
    const denom = `test2`;

    const data = await msgCreateDenom(
      cmNeutron,
      owner_wallet.address.toString(),
      denom,
    );
    const newTokenDenom = getEventAttribute(
      (data as any).events,
      'create_denom',
      'new_token_denom',
    );

    await msgMintDenom(cmNeutron, owner_wallet.address.toString(), {
      denom: newTokenDenom,
      amount: '10000',
    });

    const balanceBefore = await cmNeutron.queryDenomBalance(
      owner_wallet.address.toString(),
      newTokenDenom,
    );

    expect(balanceBefore).toEqual(10000);
  });

  test('check authority metadata update', async () => {
    const denom = `test3`;

    const data = await msgCreateDenom(
      cmNeutron,
      owner_wallet.address.toString(),
      denom,
    );
    const newTokenDenom = getEventAttribute(
      (data as any).events,
      'create_denom',
      'new_token_denom',
    );

    const authorityMetadataBefore = await getAuthorityMetadata(
      cmNeutron.sdk.url,
      newTokenDenom,
    );

    expect(authorityMetadataBefore.authority_metadata).toEqual({
      Admin: owner_wallet.address.toString(),
    });

    const newAdmin = 'neutron1pyqyzrh6p4skmm43zrpt77wgrqq588vc8nhpfz';

    await msgChangeAdmin(
      cmNeutron,
      owner_wallet.address.toString(),
      newTokenDenom,
      newAdmin,
    );

    const authorityMetadataAfter = await getAuthorityMetadata(
      cmNeutron.sdk.url,
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
      cmNeutron,
      owner_wallet.address.toString(),
      denom,
    );
    const newTokenDenom = getEventAttribute(
      (data as any).events,
      'create_denom',
      'new_token_denom',
    );

    await msgMintDenom(cmNeutron, owner_wallet.address.toString(), {
      denom: newTokenDenom,
      amount: '10000',
    });

    const balanceBefore = await cmNeutron.queryDenomBalance(
      owner_wallet.address.toString(),
      newTokenDenom,
    );

    expect(balanceBefore).toEqual(10000);

    await msgBurn(
      cmNeutron,
      owner_wallet.address.toString(),
      newTokenDenom,
      '100',
    );

    const balanceAfter = await cmNeutron.queryDenomBalance(
      owner_wallet.address.toString(),
      newTokenDenom,
    );

    expect(balanceAfter).toEqual(9900);
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
  cmNeutron: CosmosWrapper,
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
      amount: [{ denom: cmNeutron.denom, amount: '1000' }],
    },
    [msgCreateDenom],
    10,
  );

  return res.tx_response!;
};

const msgCreateDenom = async (
  cmNeutron: CosmosWrapper,
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
      amount: [{ denom: cmNeutron.denom, amount: '1000' }],
    },
    [msgCreateDenom],
    10,
  );

  return res.tx_response!;
};

const msgBurn = async (
  cmNeutron: CosmosWrapper,
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
      amount: [{ denom: cmNeutron.denom, amount: '1000' }],
    },
    [msgBurn],
    10,
  );

  return res.tx_response!;
};

// Create MsgChangeAdmin message
const msgChangeAdmin = async (
  cmNeutron: CosmosWrapper,
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
      amount: [{ denom: cmNeutron.denom, amount: '1000' }],
    },
    [msgChangeAdmin],
    10,
  );

  return res.tx_response!;
};
