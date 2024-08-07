import '@neutron-org/neutronjsplus';
import {
  WalletWrapper,
  CosmosWrapper,
  NEUTRON_DENOM,
  getEventAttribute,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import cosmosclient from '@cosmos-client/core';
import { TestStateLocalCosmosTestNet } from '@neutron-org/neutronjsplus';
import { NeutronContract, Wallet } from '@neutron-org/neutronjsplus/dist/types';
import {
  msgBurn,
  msgChangeAdmin,
  msgCreateDenom,
  msgMintDenom,
  msgSetBeforeSendHook,
  getBeforeSendHook,
  getDenomsFromCreator,
  checkTokenfactoryParams,
  getAuthorityMetadata,
} from '@neutron-org/neutronjsplus/dist/tokenfactory';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  setupSubDaoTimelockSet,
} from '@neutron-org/neutronjsplus/dist/dao';
import { updateTokenfactoryParamsProposal } from '@neutron-org/neutronjsplus/dist/proposal';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';

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
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let ownerWallet: Wallet;
  let subDao: Dao;
  let mainDao: Dao;
  let subdaoMember1: DaoMember;
  let mainDaoMember: DaoMember;
  let securityDaoWallet: Wallet;
  let securityDaoAddr: cosmosclient.AccAddress | cosmosclient.ValAddress;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    ownerWallet = testState.wallets.qaNeutron.genQaWal1;
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount = new WalletWrapper(neutronChain, ownerWallet);

    // Setup subdao with update tokenfactory params
    const daoCoreAddress = await neutronChain.getNeutronDAOCore();
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);
    securityDaoWallet = testState.wallets.qaNeutronThree.genQaWal1;
    securityDaoAddr = securityDaoWallet.address;

    mainDao = new Dao(neutronChain, daoContracts);
    mainDaoMember = new DaoMember(neutronAccount, mainDao);
    await mainDaoMember.bondFunds('10000');

    subDao = await setupSubDaoTimelockSet(
      neutronAccount,
      mainDao.contracts.core.address,
      securityDaoAddr.toString(),
      true,
    );

    subdaoMember1 = new DaoMember(neutronAccount, subDao);

    const chainManagerAddress = (await neutronChain.getChainAdmins())[0];

    // shorten subdao voting period
    const currentOverruleProposalConfig = await neutronChain.queryContract(
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
    test('set non-whitlisted hook fails', async () => {
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
      const res2 = await msgSetBeforeSendHook(
        neutronAccount,
        ownerWallet.address.toString(),
        newTokenDenom,
        contractAddress,
      );
      expect(res2.code).toEqual(14); // "beforeSendHook is not whitelisted"
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

      const denom = `test6`;

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
      let queryTrack = await neutronChain.queryContract<{
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
      expect(hookAfter.contract_addr).toEqual(contractAddress);

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
    let codeId;

    test('setup contract', async () => {
      codeId = await neutronAccount.storeWasm(NeutronContract.TOKENFACTORY);
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
      denom = res.events
        ?.find((event) => event.type == 'create_denom')
        ?.attributes?.find(
          (attribute) => attribute.key == 'new_token_denom',
        )?.value;
    });

    test('set denom metadata', async () => {
      await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
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
        }),
      );

      const metadatas = await neutronChain.queryDenomsMetadata();
      const metadata = metadatas.metadatas.find((meta) => meta.base == denom);
      expect(metadata.base).toEqual(denom);
      expect(metadata.uri).toEqual(denom);
      expect(metadata.display).toEqual(denom);
      expect(metadata.description).toEqual(denom);
      expect(metadata.name).toEqual(denom);
      expect(metadata.symbol).toEqual(denom);
      expect(metadata.uri_hash).toEqual(denom);
      expect(metadata.denom_units.length).toEqual(1);
      expect(metadata.denom_units[0].denom).toEqual(denom);
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
      await whitelistTokenfactoryHook(
        neutronChain,
        subDao,
        subdaoMember1,
        codeId,
        contractAddress,
      );

      await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          set_before_send_hook: {
            denom,
            contract_addr: contractAddress,
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
            contract_addr: '',
          },
        }),
      );

      // TODO: check that it actually sets hook by querying tokenfactory module
    });

    test('force transfer', async () => {
      const randomAccount = 'neutron14640tst2rx45nxg3evqwlzuaestnnhm8es3rtc';
      const randomAccount2 = 'neutron14qncu5xag9ec26cx09x6pwncn9w74pq3zqe408';

      await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          mint_tokens: {
            denom,
            amount: amount.toString(),
          },
        }),
      );

      await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          send_tokens: {
            recipient: randomAccount,
            denom,
            amount: amount.toString(),
          },
        }),
      );
      const balance = await neutronChain.queryDenomBalance(
        randomAccount,
        denom,
      );
      expect(balance).toEqual(amount);

      await neutronAccount.executeContract(
        contractAddress,
        JSON.stringify({
          force_transfer: {
            denom,
            amount: amount.toString(),
            from: randomAccount,
            to: randomAccount2,
          },
        }),
      );
      const balance2 = await neutronChain.queryDenomBalance(
        randomAccount2,
        denom,
      );
      expect(balance2).toEqual(amount);
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
