import { updateTokenfactoryParamsProposal } from '@neutron-org/neutronjsplus/dist/proposal';
import '@neutron-org/neutronjsplus';
import {
  CosmosWrapper,
  getEventAttribute,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { LocalState } from '../../helpers/local_state';
import { NeutronContract, Wallet } from '@neutron-org/neutronjsplus/dist/types';
import { Suite, inject } from 'vitest';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import { setupSubDaoTimelockSet } from '../../helpers/dao';
import { QueryClientImpl as AdminQueryClient } from '@neutron-org/neutronjs/cosmos/adminmodule/adminmodule/query.rpc.Query';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import {
  MsgBurn,
  MsgChangeAdmin,
  MsgCreateDenom,
  MsgMint,
  MsgSetBeforeSendHook,
} from '@neutron-org/neutronjs/osmosis/tokenfactory/v1beta1/tx';
import { QueryClientImpl as BankQueryClient } from '@neutron-org/cosmjs-types/cosmos/bank/v1beta1/query';
import { createRPCQueryClient as createOsmosisClient } from '@neutron-org/neutronjs/osmosis/rpc.query';
import { OsmosisQuerier } from '../../helpers/client_types';

const config = require('../../config.json');

async function whitelistTokenfactoryHook(
  neutronChain: CosmosWrapper,
  subDao: Dao,
  subdaoMember1: DaoMember,
  codeID: number,
  denomCreator: string,
) {
  const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
  const proposalId = await subdaoMember1.submitUpdateParamsTokenfactoryProposal(
    chainManagerAddress,
    'whitelist TF hook proposal',
    'whitelist tokenfactory hook. Will pass',
    updateTokenfactoryParamsProposal({
      denom_creation_fee: [],
      denom_creation_gas_consume: 0,
      fee_collector_address: '',
      whitelisted_hooks: [
        {
          code_id: codeID,
          denom_creator: denomCreator,
        },
      ],
    }),
    '1000',
  );

  let timelockedProp = await subdaoMember1.supportAndExecuteProposal(
    proposalId,
  );
  await waitSeconds(10);
  await subdaoMember1.executeTimelockedProposal(proposalId);
  timelockedProp = await subDao.getTimelockedProposal(proposalId);
  expect(timelockedProp.id).toEqual(proposalId);
  expect(timelockedProp.status).toEqual('executed');
}

describe('Neutron / Tokenfactory', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;

  let neutronAccount: Wallet;
  let ownerWallet: Wallet;
  let subDao: Dao;
  let mainDao: Dao;
  let subdaoMember1: DaoMember;
  let mainDaoMember: DaoMember;
  let securityDaoWallet: Wallet;
  let securityDaoAddr: string;
  let fee: any;
  let osmosisQuerier: OsmosisQuerier;
  let bankQuerier: BankQueryClient;

  beforeAll(async (suite: Suite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);
    ownerWallet = await testState.nextWallet('neutron');
    neutronAccount = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      ownerWallet.directwallet,
      ownerWallet.address,
    );
    // Setup subdao with update tokenfactory params
    const neutronRpcClient = await testState.rpcClient('neutron');
    osmosisQuerier = await createOsmosisClient({
      rpcEndpoint: testState.rpcNeutron,
    });

    bankQuerier = new BankQueryClient(neutronRpcClient);
    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient.client,
      neutronRpcClient,
    );

    const daoContracts = await getDaoContracts(
      neutronClient.client,
      daoCoreAddress,
    );

    securityDaoWallet = await testState.nextWallet('neutron');
    securityDaoAddr = securityDaoWallet.address;

    mainDao = new Dao(neutronClient.client, daoContracts);
    mainDaoMember = new DaoMember(
      mainDao,
      neutronClient.client,
      neutronAccount.address,
      NEUTRON_DENOM,
    );
    await mainDaoMember.bondFunds('10000');

    subDao = await setupSubDaoTimelockSet(
      neutronAccount.address,
      neutronClient,
      mainDao.contracts.core.address,
      securityDaoAddr,
      true,
    );

    subdaoMember1 = new DaoMember(
      subDao,
      neutronClient.client,
      neutronAccount.address,
      NEUTRON_DENOM,
    );

    const queryClient = new AdminQueryClient(neutronRpcClient);
    const admins = await queryClient.admins();
    const chainManagerAddress = admins.admins[0];
    tfq = new BankQueryClient(neutronRpcClient);

    // shorten subdao voting period
    const currentOverruleProposalConfig =
      await neutronClient.client.queryContractSmart(
        mainDao.contracts.proposals['overrule'].address,
        {
          config: {},
        },
      );
    currentOverruleProposalConfig['max_voting_period']['time'] = 5;
    const proposalId = await mainDaoMember.submitSingleChoiceProposal(
      'Proposal',
      'Update the max voting period. It will pass',
      [
        {
          wasm: {
            execute: {
              contract_addr: mainDao.contracts.proposals['overrule'].address,
              msg: Buffer.from(
                JSON.stringify({
                  update_config: {
                    threshold: currentOverruleProposalConfig['threshold'],
                    max_voting_period:
                      currentOverruleProposalConfig['max_voting_period'],
                    allow_revoting:
                      currentOverruleProposalConfig['allow_revoting'],
                    dao: currentOverruleProposalConfig['dao'],
                    close_proposal_on_execution_failure:
                      currentOverruleProposalConfig[
                        'close_proposal_on_execution_failure'
                      ],
                  },
                }),
              ).toString('base64'),
              funds: [],
            },
          },
        },
      ],
      '1000',
    );
    await mainDaoMember.voteYes(proposalId);
    await mainDao.checkPassedProposal(proposalId);
    await mainDaoMember.executeProposalWithAttempts(proposalId);

    const proposalId2 =
      await mainDaoMember.submitAddChainManagerStrategyProposal(
        chainManagerAddress,
        'Proposal #1',
        'Add strategy proposal. It will pass',
        {
          add_strategy: {
            address: subDao.contracts.core.address,
            strategy: {
              allow_only: [
                {
                  update_tokenfactory_params_permission: {
                    denom_creation_fee: true,
                    denom_creation_gas_consume: true,
                    fee_collector_address: true,
                    whitelisted_hooks: true,
                  },
                },
              ],
            },
          },
        },
        '1000',
      );

    await mainDaoMember.voteYes(proposalId2);
    await mainDao.checkPassedProposal(proposalId2);
    await waitSeconds(10);
    await mainDaoMember.executeProposalWithAttempts(proposalId2);

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
              sender: ownerWallet.address,
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

      expect(newTokenDenom).toEqual(`factory/${ownerWallet.address}/${denom}`);

      const denomsAfter =
        await osmosisQuerier.osmosis.tokenfactory.v1beta1.denomsFromCreator({
          creator: ownerWallet.address,
        });

      expect(denomsAfter.denoms).toContainEqual(
        `factory/${ownerWallet.address}/${denom}`,
      );
    });

    test('create denom, mint', async () => {
      const denom = `test2`;
      const fee = {
        gas: '200000',
        amount: [{ denom: NEUTRON_DENOM, amount: '1250' }],
      };
      const data = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgCreateDenom.typeUrl,
            value: MsgCreateDenom.fromPartial({
              sender: ownerWallet.address,
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
            value: MsgMint.fromPartial({
              sender: ownerWallet.address,
              amount: {
                denom: newTokenDenom,
                amount: '10000',
              },
              mintToAddress: '',
            }),
          },
        ],
        fee,
      );

      expect(mintRes.code).toBe(0);

      const balanceBefore = parseInt(
        (
          await neutronClient.client.getBalance(
            ownerWallet.address,
            newTokenDenom,
          )
        ).amount,
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
              sender: ownerWallet.address,
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

      const authorityMetadataBefore =
        await osmosisQuerier.osmosis.tokenfactory.v1beta1.denomAuthorityMetadata(
          { subdenom: newTokenDenom },
        );

      expect(authorityMetadataBefore.authorityMetadata).toEqual({
        Admin: ownerWallet.address,
      });

      const newAdmin = 'neutron1pyqyzrh6p4skmm43zrpt77wgrqq588vc8nhpfz';

      await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgChangeAdmin.typeUrl,
            value: MsgChangeAdmin.fromPartial({
              sender: ownerWallet.address,
              denom: denom,
              newAdmin: newAdmin,
            }),
          },
        ],
        fee,
      );

      const authorityMetadataAfter =
        await osmosisQuerier.osmosis.tokenfactory.v1beta1.denomAuthorityMetadata(
          { subdenom: newTokenDenom },
        );

      expect(authorityMetadataAfter.authorityMetadata).toEqual({
        Admin: newAdmin,
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
              sender: ownerWallet.address,
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

      await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgMint.typeUrl,
            value: MsgMint.fromPartial({
              sender: ownerWallet.address,
              amount: {
                denom: newTokenDenom,
                amount: '10000',
              },
              mintToAddress: '',
            }),
          },
        ],
        fee,
      );

      const balanceBefore = parseInt(
        (
          await neutronClient.client.getBalance(
            ownerWallet.address,
            newTokenDenom,
          )
        ).amount,
        10,
      );
      expect(balanceBefore).toEqual(10000);

      const burnRes = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgBurn.typeUrl,
            value: MsgBurn.fromPartial({
              sender: ownerWallet.address,
              amount: {
                denom: newTokenDenom,
                amount: '10000',
              },
              burnFromAddress: '',
            }),
          },
        ],
        fee,
      );

      expect(burnRes.code).toBe(0);

      const balanceAfter = parseInt(
        (
          await neutronClient.client.getBalance(
            ownerWallet.address,
            newTokenDenom,
          )
        ).amount,
        10,
      );

      expect(balanceAfter).toEqual(9900);
    });
    test('set non-whitlisted hook fails', async () => {
      const codeId = await neutronClient.upload(
        NeutronContract.BEFORE_SEND_HOOK_TEST,
      );
      expect(codeId).toBeGreaterThan(0);

      const contractAddress = await neutronClient.instantiate(
        codeId,
        {},
        'before_send_hook_test',
      );

      const denom = `test5`;

      const data = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgCreateDenom.typeUrl,
            value: MsgCreateDenom.fromPartial({
              sender: ownerWallet.address,
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
              sender: ownerWallet.address,
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
        NeutronContract.BEFORE_SEND_HOOK_TEST,
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
              sender: ownerWallet.address,
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
            value: MsgMint.fromPartial({
              sender: ownerWallet.address,
              amount: {
                denom: newTokenDenom,
                amount: '10000',
              },
              mintToAddress: ownerWallet.address,
            }),
          },
        ],
        fee,
      );

      const balanceBefore = parseInt(
        (
          await neutronClient.client.getBalance(
            ownerWallet.address,
            newTokenDenom,
          )
        ).amount,
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
        (await neutronClient.client.getBalance(contractAddress, newTokenDenom))
          .amount,
        10,
      );
      expect(contractBalance).toEqual(666);

      let queryBlock = await neutronClient.client.queryContractSmart<{
        block: { received: boolean };
      }>(contractAddress, {
        sudo_result_block_before: {},
      });
      let queryTrack = await neutronClient.client.queryContractSmart<{
        track: { received: boolean };
      }>(contractAddress, {
        sudo_result_track_before: {},
      });

      expect(queryTrack.track.received).toEqual(false);
      expect(queryBlock.block.received).toEqual(false);

      await whitelistTokenfactoryHook(
        neutronChain,
        subDao,
        subdaoMember1,
        codeId,
        ownerWallet.address.toString(),
      );

      const res1 = await neutronClient.signAndBroadcast(
        [
          {
            typeUrl: MsgSetBeforeSendHook.typeUrl,
            value: MsgSetBeforeSendHook.fromPartial({
              sender: ownerWallet.address,
              denom: newTokenDenom,
              contractAddr: contractAddress,
            }),
          },
        ],
        fee,
      );
      expect(res1.code).toBe(0);

      const hookAfter =
        await osmosisQuerier.osmosis.tokenfactory.v1beta1.beforeSendHookAddress(
          {
            creator: '',
            subdenom: '',
            newTokenDenom,
          },
        );
      expect(hookAfter.contract_addr).toEqual(contractAddress);

      await neutronClient.sendTokens(
        contractAddress,
        [{ denom: newTokenDenom, amount: '1' }],
        {
          gas: '200000',
          amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
        },
      );

      const contractBalanceAfter = parseInt(
        (await neutronClient.client.getBalance(contractAddress, newTokenDenom))
          .amount,
        10,
      );

      expect(contractBalanceAfter).toEqual(667);

      const balanceAfter = parseInt(
        (
          await neutronClient.client.getBalance(
            ownerWallet.address,
            newTokenDenom,
          )
        ).amount,
        10,
      );

      expect(balanceAfter).toEqual(9333);

      queryBlock = await neutronClient.client.queryContractSmart<{
        block: { received: boolean };
      }>(contractAddress, {
        sudo_result_block_before: {},
      });

      queryTrack = await neutronClient.client.queryContractSmart<{
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
    let codeId;

    test('setup contract', async () => {
      codeId = await neutronClient.upload(NeutronContract.TOKENFACTORY);
      expect(codeId).toBeGreaterThan(0);

      contractAddress = await neutronClient.instantiate(
        codeId,
        {},
        'tokenfactory',
      );

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
              exponent: 0,
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

      const metadata = await bankQuerier.DenomMetadata({ denom: denom });
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
        (await neutronClient.client.getBalance(contractAddress, denom)).amount,
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
        (await neutronClient.client.getBalance(contractAddress, denom)).amount,
        10,
      );
      expect(balance).toEqual(amount);
    });

    test('full denom query', async () => {
      const res = await neutronClient.client.queryContractSmart<{
        denom: string;
      }>(contractAddress, {
        full_denom: { creator_addr: contractAddress, subdenom },
      });
      expect(res.denom).toEqual(denom);
    });

    test('denom admin query', async () => {
      const res = await neutronClient.client.queryContractSmart<{
        admin: string;
      }>(contractAddress, {
        denom_admin: {
          subdenom: denom,
        },
      });
      expect(res.admin).toEqual(contractAddress);
    });
    test('set_before_send_hook', async () => {
      await whitelistTokenfactoryHook(
        neutronChain,
        subDao,
        subdaoMember1,
        codeId,
        contractAddress,
      );

      await neutronClient.execute(contractAddress, {
        set_before_send_hook: {
          denom,
          contract_addr: contractAddress,
        },
      });
      const res = await neutronClient.client.queryContractSmart<{
        contract_addr: string;
      }>(contractAddress, {
        before_send_hook: {
          denom,
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
        (await neutronClient.client.getBalance(randomAccount, denom)).amount,
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
        (await neutronClient.client.getBalance(randomAccount2, denom)).amount,
        10,
      );
      expect(balance2).toEqual(amount);
    });

    test('change admin', async () => {
      await neutronClient.execute(contractAddress, {
        send_tokens: {
          recipient: neutronAccount.address,
          denom,
          amount: amount.toString(),
        },
      });
      await neutronClient.execute(contractAddress, {
        change_admin: {
          denom,
          new_admin_address: neutronAccount.address,
        },
      });

      const balance = parseInt(
        (await neutronClient.client.getBalance(neutronAccount.address, denom))
          .amount,
        10,
      );

      expect(balance).toEqual(amount);
      const res = await neutronClient.client.queryContractSmart<{
        admin: string;
      }>(contractAddress, {
        denom_admin: {
          subdenom: denom,
        },
      });
      expect(res.admin).toEqual(neutronAccount.address);
    });
  });
});
