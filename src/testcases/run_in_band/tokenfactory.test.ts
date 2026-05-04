import '@neutron-org/neutronjsplus';
import { getEventAttribute } from '@neutron-org/neutronjsplus/dist/cosmos';
import { LocalState } from '../../helpers/local_state';
import { RunnerTestSuite, inject } from 'vitest';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import {
  MsgBurn,
  MsgChangeAdmin,
  MsgCreateDenom,
  MsgMint,
  MsgSetBeforeSendHook,
} from '@neutron-org/neutronjs/osmosis/tokenfactory/v1beta1/tx';
import { QueryClientImpl as BankQueryClient } from '@neutron-org/neutronjs/cosmos/bank/v1beta1/query.rpc.Query';
import { createRPCQueryClient as createOsmosisClient } from '@neutron-org/neutronjs/osmosis/rpc.query';
import { OsmosisQuerier } from '@neutron-org/neutronjs/querier_types';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus/dist/constants';
import { QueryDenomAuthorityMetadataResponse } from '@neutron-org/neutronjs/osmosis/tokenfactory/v1beta1/query';
import { CONTRACTS } from '../../helpers/constants';
import { Wallet } from '../../helpers/wallet';
import config from '../../config.json';
import { delegateTokens } from '../../helpers/staking';
import {
  executeMsgSubmitProposalV1,
  executeMsgVoteNeutron,
} from '../../helpers/gov';
import { BinaryWriter } from '@neutron-org/neutronjs/binary';
import { Params } from '@neutron-org/neutronjs/osmosis/tokenfactory/params';

const GOV_MODULE_ADDRESS = 'neutron10d07y265gmmuvt4z0w9aw880jnsr700j7a68v5';

function encodeTokenfactoryMsgUpdateParams(
  authority: string,
  params: {
    denomCreationFee: { denom: string; amount: string }[];
    denomCreationGasConsume?: bigint;
    feeCollectorAddress: string;
    whitelistedHooks: { codeId: bigint; denomCreator: string }[];
  },
): Uint8Array {
  const writer = BinaryWriter.create();
  if (authority !== '') writer.uint32(10).string(authority);
  Params.encode(Params.fromPartial(params), writer.uint32(18).fork()).ldelim();
  return writer.finish();
}

async function whitelistTokenfactoryHook(
  govClient: NeutronTestClient,
  govWallet: Wallet,
  codeID: number,
  denomCreator: string,
) {
  const res = await executeMsgSubmitProposalV1(
    govClient,
    govWallet,
    'whitelist TF hook proposal',
    'whitelist tokenfactory hook. Will pass',
    '',
    [
      {
        typeUrl: '/osmosis.tokenfactory.v1beta1.MsgUpdateParams',
        value: encodeTokenfactoryMsgUpdateParams(GOV_MODULE_ADDRESS, {
          denomCreationFee: [],
          denomCreationGasConsume: BigInt(0),
          feeCollectorAddress: '',
          whitelistedHooks: [{ codeId: BigInt(codeID), denomCreator }],
        }),
      },
    ],
    [{ denom: NEUTRON_DENOM, amount: '60000000' }],
    true,
    { gas: '4000000', amount: [{ denom: NEUTRON_DENOM, amount: '10000' }] },
  );
  expect(res.code).toEqual(0);
  const proposalId = parseInt(
    getEventAttribute(res.events, 'submit_proposal', 'proposal_id') || '1',
    10,
  );
  const voteRes = await executeMsgVoteNeutron(govClient, govWallet, proposalId);
  expect(voteRes.code).toEqual(0);
  await waitSeconds(15);
}

function unpackDenom(
  fullDenom: string,
): { creator: string; subdenom: string } | null {
  const prefix = 'factory/';
  if (fullDenom.startsWith(prefix)) {
    const parts = fullDenom.substring(prefix.length).split('/');
    if (parts.length === 2) {
      const [creator, subdenom] = parts;
      return { creator, subdenom };
    }
  }
  return null;
}

describe('Neutron / Tokenfactory', () => {
  let testState: LocalState;
  let neutronClient: NeutronTestClient;
  let neutronWallet: Wallet;
  let govWallet: Wallet;
  let govClient: NeutronTestClient;
  let fee: { gas: string; amount: { denom: string; amount: string }[] };
  let osmosisQuerier: OsmosisQuerier;
  let bankQuerier: BankQueryClient;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);
    neutronWallet = await testState.nextNeutronWallet();
    neutronClient = await NeutronTestClient.connectWithSigner(neutronWallet);
    govWallet = await testState.nextSecp256k1SignNeutronWallet();
    govClient = await NeutronTestClient.connectWithSigner(govWallet);
    const neutronRpcClient = await testState.rpcClient('neutron');
    osmosisQuerier = await createOsmosisClient({
      rpcEndpoint: testState.rpcNeutron,
    });
    bankQuerier = new BankQueryClient(neutronRpcClient);

    const govDelegateRes = await delegateTokens(
      govClient,
      govWallet.address,
      testState.wallets.neutron.val1.valAddress,
      '5000000000',
    );
    expect(govDelegateRes.code).toEqual(0);

    fee = {
      gas: '200000',
      amount: [{ denom: NEUTRON_DENOM, amount: '1250' }],
    };
  });

  test('tokenfactory module is added', async () => {
    const paramsPresent =
      await osmosisQuerier.osmosis.tokenfactory.v1beta1.params();
    expect(paramsPresent).toBeTruthy();
  });

  describe('Module itself', () => {
    test('create denoms and check list', async () => {
      const denom = 'test1';
      const createRes = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgCreateDenom.typeUrl,
            value: MsgCreateDenom.fromPartial({
              sender: neutronWallet.address,
              subdenom: 'test1',
            }),
          },
        ],
        fee,
      );

      expect(createRes.code).toBe(0);

      const newTokenDenom = getEventAttribute(
        createRes.events,
        'create_denom',
        'new_token_denom',
      );

      expect(newTokenDenom).toEqual(
        `factory/${neutronWallet.address}/${denom}`,
      );

      const denomsAfter =
        await osmosisQuerier.osmosis.tokenfactory.v1beta1.denomsFromCreator({
          creator: neutronWallet.address,
        });

      expect(denomsAfter.denoms).toContainEqual(
        `factory/${neutronWallet.address}/${denom}`,
      );
    });

    test('create denom, mint', async () => {
      const denom = `test2`;
      const fee = {
        gas: '500000',
        amount: [{ denom: NEUTRON_DENOM, amount: '1250' }],
      };
      const data = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgCreateDenom.typeUrl,
            value: MsgCreateDenom.fromPartial({
              sender: neutronWallet.address,
              subdenom: denom,
            }),
          },
        ],
        fee,
      );
      const newTokenDenom = getEventAttribute(
        data.events,
        'create_denom',
        'new_token_denom',
      );

      const mintRes = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgMint.typeUrl,
            value: {
              sender: neutronWallet.address,
              amount: {
                denom: newTokenDenom,
                amount: '10000',
              },
            },
          },
        ],
        fee,
      );

      expect(mintRes.code).toBe(0);

      const balanceBefore = parseInt(
        (await neutronClient.getBalance(neutronWallet.address, newTokenDenom))
          .amount,
        10,
      );

      expect(balanceBefore).toEqual(10000);
    });

    test('check authority metadata update', async () => {
      const denom = `test3`;

      const data = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgCreateDenom.typeUrl,
            value: MsgCreateDenom.fromPartial({
              sender: neutronWallet.address,
              subdenom: denom,
            }),
          },
        ],
        fee,
      );
      const newTokenDenom = getEventAttribute(
        data.events,
        'create_denom',
        'new_token_denom',
      );
      const unpackedDenom = unpackDenom(newTokenDenom);
      const authorityMetadataBefore =
        await osmosisQuerier.osmosis.tokenfactory.v1beta1.denomAuthorityMetadata(
          { subdenom: unpackedDenom.subdenom, creator: unpackedDenom.creator },
        );

      expect(authorityMetadataBefore.authorityMetadata).toEqual({
        admin: neutronWallet.address,
      });

      const newAdmin = 'neutron1pyqyzrh6p4skmm43zrpt77wgrqq588vc8nhpfz';

      const changeAdminRes = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgChangeAdmin.typeUrl,
            value: MsgChangeAdmin.fromPartial({
              sender: neutronWallet.address,
              denom: newTokenDenom,
              newAdmin: newAdmin,
            }),
          },
        ],
        fee,
      );
      expect(changeAdminRes.code).toEqual(0);

      const authorityMetadataAfter: QueryDenomAuthorityMetadataResponse =
        await osmosisQuerier.osmosis.tokenfactory.v1beta1.denomAuthorityMetadata(
          { subdenom: unpackedDenom.subdenom, creator: unpackedDenom.creator },
        );

      expect(authorityMetadataAfter.authorityMetadata).toEqual({
        admin: newAdmin,
      });
    });

    // Test denom creation, mint some coins and burn some of them
    test('create denom, mint and burn', async () => {
      const denom = `test4`;

      const data = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgCreateDenom.typeUrl,
            value: MsgCreateDenom.fromPartial({
              sender: neutronWallet.address,
              subdenom: denom,
            }),
          },
        ],
        fee,
      );
      const newTokenDenom = getEventAttribute(
        data.events,
        'create_denom',
        'new_token_denom',
      );

      const mintRes = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgMint.typeUrl,
            value: {
              sender: neutronWallet.address,
              amount: {
                denom: newTokenDenom,
                amount: '10000',
              },
            },
          },
        ],
        fee,
      );
      expect(mintRes.code).toEqual(0);

      const balanceBefore = parseInt(
        (await neutronClient.getBalance(neutronWallet.address, newTokenDenom))
          .amount,
        10,
      );
      expect(balanceBefore).toEqual(10000);

      const burnRes = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgBurn.typeUrl,
            value: {
              sender: neutronWallet.address,
              amount: {
                denom: newTokenDenom,
                amount: '100',
              },
            },
          },
        ],
        fee,
      );
      expect(burnRes.code).toBe(0);

      const balanceAfter = parseInt(
        (await neutronClient.getBalance(neutronWallet.address, newTokenDenom))
          .amount,
        10,
      );

      expect(balanceAfter).toEqual(9900);
    });
    test('set non-whitelisted hook fails', async () => {
      const contractAddress = await neutronClient.create(
        CONTRACTS.BEFORE_SEND_HOOK_TEST,
        {},
        'before_send_hook_test',
      );

      const denom = `test5`;

      const data = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgCreateDenom.typeUrl,
            value: MsgCreateDenom.fromPartial({
              sender: neutronWallet.address,
              subdenom: denom,
            }),
          },
        ],
        fee,
      );
      const newTokenDenom = getEventAttribute(
        data.events,
        'create_denom',
        'new_token_denom',
      );

      const res2 = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgSetBeforeSendHook.typeUrl,
            value: MsgSetBeforeSendHook.fromPartial({
              sender: neutronWallet.address,
              denom: newTokenDenom,
              contractAddr: contractAddress,
            }),
          },
        ],
        fee,
      );
      expect(res2.code).toEqual(14); // "beforeSendHook is not whitelisted"
    });
    test('create denom, set before send hook', async () => {
      const codeId = await neutronClient.upload(
        CONTRACTS.BEFORE_SEND_HOOK_TEST,
      );
      expect(codeId).toBeGreaterThan(0);

      const contractAddress = await neutronClient.instantiate(
        codeId,
        {},
        'before_send_hook_test',
      );

      const denom = `test6`;

      const data = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgCreateDenom.typeUrl,
            value: MsgCreateDenom.fromPartial({
              sender: neutronWallet.address,
              subdenom: denom,
            }),
          },
        ],
        fee,
      );
      const newTokenDenom = getEventAttribute(
        (data as any).events,
        'create_denom',
        'new_token_denom',
      );

      await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgMint.typeUrl,
            value: {
              sender: neutronWallet.address,
              amount: {
                denom: newTokenDenom,
                amount: '10000',
              },
              mintToAddress: neutronWallet.address,
            },
          },
        ],
        fee,
      );

      const balanceBefore = parseInt(
        (await neutronClient.getBalance(neutronWallet.address, newTokenDenom))
          .amount,
        10,
      );

      expect(balanceBefore).toEqual(10000);

      await neutronClient.sendTokens(
        contractAddress,
        [{ denom: newTokenDenom, amount: '666' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        },
      );

      const contractBalance = parseInt(
        (await neutronClient.getBalance(contractAddress, newTokenDenom)).amount,
        10,
      );
      expect(contractBalance).toEqual(666);

      let queryBlock = await neutronClient.queryContractSmart(contractAddress, {
        sudo_result_block_before: {},
      });
      let queryTrack = await neutronClient.queryContractSmart(contractAddress, {
        sudo_result_track_before: {},
      });

      expect(queryTrack.track.received).toEqual(false);
      expect(queryBlock.block.received).toEqual(false);

      await whitelistTokenfactoryHook(
        govClient,
        govWallet,
        codeId,
        neutronWallet.address,
      );

      const res1 = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgSetBeforeSendHook.typeUrl,
            value: MsgSetBeforeSendHook.fromPartial({
              sender: neutronWallet.address,
              denom: newTokenDenom,
              contractAddr: contractAddress,
            }),
          },
        ],
        fee,
      );
      expect(res1.code).toBe(0);

      const unpackedDenom = unpackDenom(newTokenDenom);
      const hookAfter =
        await osmosisQuerier.osmosis.tokenfactory.v1beta1.beforeSendHookAddress(
          {
            creator: unpackedDenom.creator,
            subdenom: unpackedDenom.subdenom,
          },
        );
      expect(hookAfter.contractAddr).toEqual(contractAddress);

      const res = await neutronClient.sendTokens(
        contractAddress,
        [{ denom: newTokenDenom, amount: '1' }],
        {
          gas: '700000',
          amount: [{ denom: NEUTRON_DENOM, amount: '2000' }],
        },
      );
      expect(res.code).toEqual(0);

      const contractBalanceAfter = parseInt(
        (await neutronClient.getBalance(contractAddress, newTokenDenom)).amount,
        10,
      );

      expect(contractBalanceAfter).toEqual(667);

      const balanceAfter = parseInt(
        (await neutronClient.getBalance(neutronWallet.address, newTokenDenom))
          .amount,
        10,
      );

      expect(balanceAfter).toEqual(9333);

      queryBlock = await neutronClient.queryContractSmart(contractAddress, {
        sudo_result_block_before: {},
      });

      queryTrack = await neutronClient.queryContractSmart(contractAddress, {
        sudo_result_track_before: {},
      });

      expect(queryTrack.track.received).toEqual(true);
      expect(queryBlock.block.received).toEqual(true);
    });
  });

  describe('grpc', () => {
    let contractAddress: string;
    const subdenom = 'mycoin';
    let denom: string;
    let amount = 10000000;
    const toBurn = 1000000;
    let codeId: number;

    test('setup contract', async () => {
      codeId = await neutronClient.upload(CONTRACTS.TOKENFACTORY);
      expect(codeId).toBeGreaterThan(0);

      contractAddress = await neutronClient.instantiate(codeId, {});

      await neutronClient.sendTokens(
        contractAddress,
        [{ denom: NEUTRON_DENOM, amount: '10000000' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        },
      );
    });

    test('create denom', async () => {
      const res = await neutronClient.execute(contractAddress, {
        create_denom: {
          subdenom,
        },
      });
      denom = res.events
        ?.find((event) => event.type == 'create_denom')
        ?.attributes?.find(
          (attribute) => attribute.key == 'new_token_denom',
        )?.value;
    });

    test('set denom metadata', async () => {
      await neutronClient.execute(contractAddress, {
        set_denom_metadata: {
          description: denom,
          denom_units: [
            {
              denom,
              exponent: '0',
              aliases: [],
            },
          ],
          base: denom,
          display: denom,
          name: denom,
          symbol: denom,
          uri: denom,
          uri_hash: denom,
        },
      });

      const metadata = await bankQuerier.denomMetadata({ denom: denom });
      expect(metadata.metadata.base).toEqual(denom);
      expect(metadata.metadata.uri).toEqual(denom);
      expect(metadata.metadata.display).toEqual(denom);
      expect(metadata.metadata.description).toEqual(denom);
      expect(metadata.metadata.name).toEqual(denom);
      expect(metadata.metadata.symbol).toEqual(denom);
      expect(metadata.metadata.uriHash).toEqual(denom);
      expect(metadata.metadata.denomUnits.length).toEqual(1);
      expect(metadata.metadata.denomUnits[0].denom).toEqual(denom);
    });

    test('mint coins', async () => {
      await neutronClient.execute(contractAddress, {
        mint_tokens: {
          denom,
          amount: amount.toString(),
        },
      });

      const balance = parseInt(
        (await neutronClient.getBalance(contractAddress, denom)).amount,
        10,
      );

      expect(balance).toEqual(amount);
    });

    test('burn coins', async () => {
      await neutronClient.execute(contractAddress, {
        burn_tokens: {
          denom,
          amount: toBurn.toString(),
        },
      });
      amount -= toBurn;

      const balance = parseInt(
        (await neutronClient.getBalance(contractAddress, denom)).amount,
        10,
      );
      expect(balance).toEqual(amount);
    });

    test('burn coins from different wallet', async () => {
      const wallet2 = await testState.nextNeutronWallet();

      const mintedToDifferentWallet = 100;
      const toBurn = 50;
      const leftAfterBurn = mintedToDifferentWallet - toBurn;

      amount -= mintedToDifferentWallet;

      // mint to different wallet
      const res1 = await neutronClient.execute(contractAddress, {
        mint_tokens: {
          denom,
          amount: mintedToDifferentWallet.toString(),
          mint_to_address: wallet2.address,
        },
      });
      expect(res1.code).toBe(0);

      const balanceBefore = await neutronClient.getBalance(
        wallet2.address,
        denom,
      );
      expect(balanceBefore.amount).toBe(mintedToDifferentWallet.toString());

      const res = await neutronClient.execute(contractAddress, {
        burn_tokens: {
          denom,
          amount: toBurn.toString(),
          burn_from_address: wallet2.address,
        },
      });
      expect(res.code).toBe(0);

      await neutronClient.waitBlocks(5);

      const balanceAfter = await neutronClient.getBalance(
        wallet2.address,
        denom,
      );
      expect(balanceAfter.amount).toBe(leftAfterBurn.toString());
    });

    test('full denom query', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        full_denom: { creator: contractAddress, subdenom },
      });
      expect(res.full_denom).toEqual(denom);
    });

    test('denom admin query', async () => {
      const res = await neutronClient.queryContractSmart(contractAddress, {
        denom_admin: {
          creator: contractAddress,
          subdenom,
        },
      });
      expect(res.admin).toEqual(contractAddress);
    });
    test('set_before_send_hook', async () => {
      await whitelistTokenfactoryHook(
        govClient,
        govWallet,
        codeId,
        contractAddress,
      );

      await neutronClient.execute(contractAddress, {
        set_before_send_hook: {
          denom,
          contract_addr: contractAddress,
        },
      });
      const res = await neutronClient.queryContractSmart(contractAddress, {
        before_send_hook: {
          creator: contractAddress,
          subdenom,
        },
      });
      expect(res.contract_addr).toEqual(contractAddress);

      await neutronClient.execute(contractAddress, {
        set_before_send_hook: {
          denom,
          contract_addr: '',
        },
      });

      // TODO: check that it actually sets hook by querying tokenfactory module
    });

    test('force transfer', async () => {
      const randomAccount = 'neutron14640tst2rx45nxg3evqwlzuaestnnhm8es3rtc';
      const randomAccount2 = 'neutron14qncu5xag9ec26cx09x6pwncn9w74pq3zqe408';

      await neutronClient.execute(contractAddress, {
        mint_tokens: {
          denom,
          amount: amount.toString(),
        },
      });

      await neutronClient.execute(contractAddress, {
        send_tokens: {
          recipient: randomAccount,
          denom,
          amount: amount.toString(),
        },
      });
      const balance = parseInt(
        (await neutronClient.getBalance(randomAccount, denom)).amount,
        10,
      );
      expect(balance).toEqual(amount);

      await neutronClient.execute(contractAddress, {
        force_transfer: {
          denom,
          amount: amount.toString(),
          from: randomAccount,
          to: randomAccount2,
        },
      });
      const balance2 = parseInt(
        (await neutronClient.getBalance(randomAccount2, denom)).amount,
        10,
      );
      expect(balance2).toEqual(amount);
    });

    test('change admin', async () => {
      await neutronClient.execute(contractAddress, {
        send_tokens: {
          recipient: neutronWallet.address,
          denom,
          amount: amount.toString(),
        },
      });
      await neutronClient.execute(contractAddress, {
        change_admin: {
          denom,
          new_admin_address: neutronWallet.address,
        },
      });

      const balance = parseInt(
        (await neutronClient.getBalance(neutronWallet.address, denom)).amount,
        10,
      );

      expect(balance).toEqual(amount);
      const res = await neutronClient.queryContractSmart(contractAddress, {
        denom_admin: {
          creator: contractAddress,
          subdenom,
        },
      });
      expect(res.admin).toEqual(neutronWallet.address);
    });
  });
});
