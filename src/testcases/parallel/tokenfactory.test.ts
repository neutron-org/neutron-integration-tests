import '@neutron-org/neutronjsplus';
import {
  CosmosWrapper,
  NEUTRON_DENOM,
  getEventAttribute,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { LocalState } from './../../helpers/localState';
import { NeutronContract, Wallet } from '@neutron-org/neutronjsplus/dist/types';
import {
  msgBurn,
  msgChangeAdmin,
  msgCreateDenom,
  msgMintDenom,
  msgSetBeforeSendHook,
  getDenomsFromCreator,
  checkTokenfactoryParams,
  getAuthorityMetadata,
  getBeforeSendHook,
} from '@neutron-org/neutronjsplus/dist/tokenfactory';
import {
  WalletWrapper,
  createWalletWrapper,
} from '@neutron-org/neutronjsplus/dist/wallet_wrapper';
import { inject } from 'vitest';

const config = require('../../config.json');

describe('Neutron / Tokenfactory', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let neutronAccount: WalletWrapper;
  let ownerWallet: Wallet;

  beforeAll(async () => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics);
    await testState.init();
    ownerWallet = await testState.randomWallet('neutron');
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );
    neutronAccount = await createWalletWrapper(neutronChain, ownerWallet);
  });

  test('tokenfactory module is added', async () => {
    const paramsPresent = await checkTokenfactoryParams(neutronChain.rest);
    expect(paramsPresent).toBeTruthy();
  });

  describe('Module itself', () => {
    test('create denoms and check list', async () => {
      const denom = 'test1';
      const data = await msgCreateDenom(
        neutronAccount,
        ownerWallet.address,
        'test1',
      );

      const newTokenDenom = getEventAttribute(
        data.events,
        'create_denom',
        'new_token_denom',
      );

      expect(newTokenDenom).toEqual(`factory/${ownerWallet.address}/${denom}`);

      const denomsAfter = await getDenomsFromCreator(
        neutronChain.rest,
        ownerWallet.address,
      );

      expect(denomsAfter.denoms).toContainEqual(
        `factory/${ownerWallet.address}/${denom}`,
      );
    });

    test('create denom, mint', async () => {
      const denom = `test2`;

      const data = await msgCreateDenom(
        neutronAccount,
        ownerWallet.address,
        denom,
      );
      const newTokenDenom = getEventAttribute(
        data.events,
        'create_denom',
        'new_token_denom',
      );

      await msgMintDenom(
        neutronAccount,
        ownerWallet.address,
        {
          denom: newTokenDenom,
          amount: '10000',
        },
        ownerWallet.address,
      );

      const balanceBefore = await neutronChain.queryDenomBalance(
        ownerWallet.address,
        newTokenDenom,
      );

      expect(balanceBefore).toEqual(10000);
    });

    test('check authority metadata update', async () => {
      const denom = `test3`;

      const data = await msgCreateDenom(
        neutronAccount,
        ownerWallet.address,
        denom,
      );
      const newTokenDenom = getEventAttribute(
        data.events,
        'create_denom',
        'new_token_denom',
      );

      const authorityMetadataBefore = await getAuthorityMetadata(
        neutronChain.rest,
        newTokenDenom,
      );

      expect(authorityMetadataBefore.authority_metadata).toEqual({
        Admin: ownerWallet.address,
      });

      const newAdmin = 'neutron1pyqyzrh6p4skmm43zrpt77wgrqq588vc8nhpfz';

      await msgChangeAdmin(
        neutronAccount,
        ownerWallet.address,
        newTokenDenom,
        newAdmin,
      );

      const authorityMetadataAfter = await getAuthorityMetadata(
        neutronChain.rest,
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
        ownerWallet.address,
        denom,
      );
      const newTokenDenom = getEventAttribute(
        data.events,
        'create_denom',
        'new_token_denom',
      );
      await msgMintDenom(
        neutronAccount,
        ownerWallet.address,
        {
          denom: newTokenDenom,
          amount: '10000',
        },
        ownerWallet.address,
      );

      const balanceBefore = await neutronChain.queryDenomBalance(
        ownerWallet.address,
        newTokenDenom,
      );

      expect(balanceBefore).toEqual(10000);

      await msgBurn(
        neutronAccount,
        ownerWallet.address,
        newTokenDenom,
        '100',
        ownerWallet.address,
      );

      const balanceAfter = await neutronChain.queryDenomBalance(
        ownerWallet.address,
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
        {},
        'before_send_hook_test',
      );
      const contractAddress = res;

      const denom = `test5`;

      const data = await msgCreateDenom(
        neutronAccount,
        ownerWallet.address,
        denom,
      );
      const newTokenDenom = getEventAttribute(
        data.events,
        'create_denom',
        'new_token_denom',
      );

      await msgMintDenom(
        neutronAccount,
        ownerWallet.address,
        {
          denom: newTokenDenom,
          amount: '10000',
        },
        ownerWallet.address,
      );

      const balanceBefore = await neutronChain.queryDenomBalance(
        ownerWallet.address,
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

      await msgSetBeforeSendHook(
        neutronAccount,
        ownerWallet.address,
        newTokenDenom,
        contractAddress,
      );

      const hookAfter = await getBeforeSendHook(
        neutronChain.rest,
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
        ownerWallet.address,
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
        {},
        'tokenfactory',
      );
      contractAddress = res;

      await neutronAccount.msgSend(contractAddress, {
        amount: '10000000',
        denom: 'untrn',
      });
    });

    test('create denom', async () => {
      const res = await neutronAccount.executeContract(contractAddress, {
        create_denom: {
          subdenom,
        },
      });
      // TODO: use getEventAttribute function
      denom =
        res.events
          ?.find((event) => event.type == 'create_denom')
          ?.attributes?.find((attribute) => attribute.key == 'new_token_denom')
          ?.value || '';

      expect(denom.length).toBeGreaterThan(0);
    });

    test('set denom metadata', async () => {
      await neutronAccount.executeContract(contractAddress, {
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

      const metadatas = await neutronChain.queryDenomsMetadata();
      const metadata: any =
        metadatas.metadatas.find((meta) => meta.base == denom) || {};
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
      await neutronAccount.executeContract(contractAddress, {
        mint_tokens: {
          denom,
          amount: amount.toString(),
        },
      });

      const balance = await neutronChain.queryDenomBalance(
        contractAddress,
        denom,
      );
      expect(balance).toEqual(amount);
    });

    test('burn coins', async () => {
      await neutronAccount.executeContract(contractAddress, {
        burn_tokens: {
          denom,
          amount: toBurn.toString(),
        },
      });
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
      await neutronAccount.executeContract(contractAddress, {
        set_before_send_hook: {
          denom,
          contract_addr: contractAddress,
        },
      });
      const res = await neutronChain.queryContract<{
        contract_addr: string;
      }>(contractAddress, {
        before_send_hook: {
          denom,
        },
      });
      expect(res.contract_addr).toEqual(contractAddress);

      await neutronAccount.executeContract(contractAddress, {
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

      await neutronAccount.executeContract(contractAddress, {
        mint_tokens: {
          denom,
          amount: amount.toString(),
        },
      });

      await neutronAccount.executeContract(contractAddress, {
        send_tokens: {
          recipient: randomAccount,
          denom,
          amount: amount.toString(),
        },
      });
      const balance = await neutronChain.queryDenomBalance(
        randomAccount,
        denom,
      );
      expect(balance).toEqual(amount);

      await neutronAccount.executeContract(contractAddress, {
        force_transfer: {
          denom,
          amount: amount.toString(),
          from: randomAccount,
          to: randomAccount2,
        },
      });
      const balance2 = await neutronChain.queryDenomBalance(
        randomAccount2,
        denom,
      );
      expect(balance2).toEqual(amount);
    });

    test('change admin', async () => {
      await neutronAccount.executeContract(contractAddress, {
        send_tokens: {
          recipient: neutronAccount.wallet.address,
          denom,
          amount: amount.toString(),
        },
      });
      await neutronAccount.executeContract(contractAddress, {
        change_admin: {
          denom,
          new_admin_address: neutronAccount.wallet.address,
        },
      });

      const balance = await neutronChain.queryDenomBalance(
        neutronAccount.wallet.address,
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
      expect(res.admin).toEqual(neutronAccount.wallet.address);
    });
  });
});
