/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '@neutron-org/neutronjsplus';
import {
  WalletWrapper,
  CosmosWrapper,
  NEUTRON_DENOM,
} from '@neutron-org/neutronjsplus/dist/cosmos';
import { TestStateLocalCosmosTestNet } from '@neutron-org/neutronjsplus';
import {
  Dao,
  DaoMember,
  getDaoContracts,
} from '@neutron-org/neutronjsplus/dist/dao';
import { Wallet } from '@neutron-org/neutronjsplus/dist/types';

import config from '../../config.json';
import { MsgGrant } from 'cosmjs-types/cosmos/authz/v1beta1/tx';
import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz';
import Long from 'long';
import cosmosclient from '@cosmos-client/core';

const DAO_INITIAL_BALANCE = 1000; // untrn

describe('Neutron / Flashloans', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount1: WalletWrapper;
  let mainDaoMember: DaoMember;
  let demo1Wallet: Wallet;
  let mainDao: Dao;
  let neutronFlashloansAddress: string;
  let neutronFlashloansUserAddress: string;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    demo1Wallet = testState.wallets.qaNeutron.genQaWal1;
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount1 = new WalletWrapper(neutronChain, demo1Wallet);

    // ---------------------SET UP THE DAO

    const daoCoreAddress = await neutronChain.getNeutronDAOCore();
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);

    mainDao = new Dao(neutronChain, daoContracts);
    mainDaoMember = new DaoMember(neutronAccount1, mainDao);
    await mainDaoMember.bondFunds('10000');

    await neutronAccount1.msgSend(daoCoreAddress, {
      denom: 'untrn',
      amount: DAO_INITIAL_BALANCE.toString(),
    });

    // ----------------------INSTANTIATE FLASHLOANS

    const neutronFlashloansCodeId = await neutronAccount1.storeWasm(
      'neutron_flashloans.wasm',
    );
    const neutronFlashloansInitMsg = {
      owner: demo1Wallet.address,
      source: daoCoreAddress,
      fee_rate: '0.01',
    };
    const neutronFlashloansCodeIdRes =
      await neutronAccount1.instantiateContract(
        neutronFlashloansCodeId,
        JSON.stringify(neutronFlashloansInitMsg),
        'neutron.flashloans',
      );
    const f = (arr: Record<string, string>[], id: number) =>
      (arr.find((v) => Number(v.code_id) == id) || {})._contract_address;
    neutronFlashloansAddress = f(
      neutronFlashloansCodeIdRes,
      neutronFlashloansCodeId,
    );

    // -----------------INSTANTIATE FLASHLOANS USER CONTRACT

    const neutronFlashloansUserCodeId = await neutronAccount1.storeWasm(
      'neutron_flashloans_user.wasm',
    );
    const neutronFlashloansUserInitMsg = {};
    const neutronFlashloansUserCodeIdRes =
      await neutronAccount1.instantiateContract(
        neutronFlashloansUserCodeId,
        JSON.stringify(neutronFlashloansUserInitMsg),
        'neutron.flashloans',
      );
    neutronFlashloansUserAddress = f(
      neutronFlashloansUserCodeIdRes,
      neutronFlashloansUserCodeId,
    );

    await neutronAccount1.msgSend(neutronFlashloansUserAddress, {
      denom: 'untrn',
      amount: '50',
    });
  });

  describe('Grant a GenericAuthorization from the DAO to the flashloans contract', () => {
    let proposalId: number;

    test('Create and submit proposal', async () => {
      const daoCoreAddress = await neutronChain.getNeutronDAOCore();

      const expiration = new Date();
      expiration.setDate(expiration.getDate() + 1);

      const genericAuthorization = GenericAuthorization.fromPartial({
        msg: '/cosmos.bank.v1beta1.MsgSend',
      });

      const msgGrant = MsgGrant.fromPartial({
        granter: daoCoreAddress,
        grantee: neutronFlashloansAddress,
        grant: {
          authorization: {
            typeUrl: '/cosmos.authz.v1beta1.GenericAuthorization',
            value: GenericAuthorization.encode(genericAuthorization).finish(),
          },
          expiration: {
            seconds: Long.fromNumber(expiration.getTime() / 1000),
            nanos: 0,
          },
        },
      });

      const stargateMsg = {
        stargate: new cosmosclient.proto.google.protobuf.Any({
          type_url: '/cosmos.authz.v1beta1.MsgGrant',
          value: MsgGrant.encode(msgGrant).finish(),
        }),
      };

      proposalId = await mainDaoMember.submitSingleChoiceProposal(
        '',
        'Grant authz generic authorization from the DAO core contract' +
          ' to the flashloan contract for bank.MsgSend',
        [stargateMsg],
        '1000',
      );
    });

    test('Vote YES from wallet 1', async () => {
      await mainDaoMember.voteYes(proposalId);
    });

    test('Check if proposal is passed', async () => {
      await mainDao.checkPassedProposal(proposalId);
    });
    test('Execute passed proposal', async () => {
      await mainDaoMember.executeProposalWithAttempts(proposalId);
    });
  });

  describe('Test different ways to request a loan', () => {
    test('Request a flashloan (and return it)', async () => {
      const res = await neutronAccount1.executeContract(
        neutronFlashloansUserAddress,
        JSON.stringify({
          request_loan: {
            flashloans_contract: neutronFlashloansAddress,
            execution_mode: 0, // MODE_RETURN_LOAN
            amount: [
              {
                denom: 'untrn',
                amount: '100',
              },
            ],
          },
        }),
      );
      expect(res.code).toEqual(0);

      // We started with 1000untrn on the dao balance, requested 100 with a
      // 0.01 fee, and expect to see DAO_INITIAL_BALANCE + 1 after the loan
      // is paid back
      expect(
        await neutronChain.queryDenomBalance(
          mainDao.contracts.core.address,
          'untrn',
        ),
      ).toEqual(DAO_INITIAL_BALANCE + 1);
    });
    test('Request a flashloan (and not return it)', async () => {
      try {
        const res = await neutronAccount1.executeContract(
          neutronFlashloansUserAddress,
          JSON.stringify({
            request_loan: {
              flashloans_contract: neutronFlashloansAddress,
              execution_mode: 1, // MODE_WITHHOLD_LOAN
              amount: [
                {
                  denom: 'untrn',
                  amount: '100',
                },
              ],
            },
          }),
        );
        expect(res.code).toEqual(1);
      } catch (error) {
        expect(error.message).toContain(
          'Borrower did not return exactly (loan + fee)',
        );

        // Execution failed, the DAO balance should stay the same.
        expect(
          await neutronChain.queryDenomBalance(
            mainDao.contracts.core.address,
            'untrn',
          ),
        ).toEqual(DAO_INITIAL_BALANCE + 1);
      }
    });
    test('Request a flashloan (request more that is available)', async () => {
      try {
        const res = await neutronAccount1.executeContract(
          neutronFlashloansUserAddress,
          JSON.stringify({
            request_loan: {
              flashloans_contract: neutronFlashloansAddress,
              execution_mode: 0, // MODE_RETURN_LOAN
              amount: [
                {
                  denom: 'untrn',
                  amount: '100000',
                },
              ],
            },
          }),
        );
        expect(res.code).toEqual(1);
      } catch (error) {
        expect(error.message).toContain("Source doesn't have enough untrn");
        // Execution failed, the DAO balance should stay the same.
        expect(
          await neutronChain.queryDenomBalance(
            mainDao.contracts.core.address,
            'untrn',
          ),
        ).toEqual(DAO_INITIAL_BALANCE + 1);
      }
    });
    test('Request a flashloan (and return more than required)', async () => {
      try {
        const res = await neutronAccount1.executeContract(
          neutronFlashloansUserAddress,
          JSON.stringify({
            request_loan: {
              flashloans_contract: neutronFlashloansAddress,
              execution_mode: 1, // MODE_WITHHOLD_LOAN
              amount: [
                {
                  denom: 'untrn',
                  amount: '100',
                },
              ],
            },
          }),
        );
        expect(res.code).toEqual(1);
      } catch (error) {
        expect(error.message).toContain(
          'Borrower did not return exactly (loan + fee)',
        );
        // Execution failed, the DAO balance should stay the same.
        expect(
          await neutronChain.queryDenomBalance(
            mainDao.contracts.core.address,
            'untrn',
          ),
        ).toEqual(DAO_INITIAL_BALANCE + 1);
      }
    });
    test('Request a flashloan (and request another one recursively)', async () => {
      try {
        const res = await neutronAccount1.executeContract(
          neutronFlashloansUserAddress,
          JSON.stringify({
            request_loan: {
              flashloans_contract: neutronFlashloansAddress,
              execution_mode: 3, // MODE_WITHHOLD_LOAN
              amount: [
                {
                  denom: 'untrn',
                  amount: '100',
                },
              ],
            },
          }),
        );
        expect(res.code).toEqual(1);
      } catch (error) {
        expect(error.message).toContain(
          'A flashloan is already active in this transaction',
        );
        // Execution failed, the DAO balance should stay the same.
        expect(
          await neutronChain.queryDenomBalance(
            mainDao.contracts.core.address,
            'untrn',
          ),
        ).toEqual(DAO_INITIAL_BALANCE + 1);
      }
    });
    test('Request a flashloan (and fail internally)', async () => {
      try {
        const res = await neutronAccount1.executeContract(
          neutronFlashloansUserAddress,
          JSON.stringify({
            request_loan: {
              flashloans_contract: neutronFlashloansAddress,
              execution_mode: 42, // Not 0, 1, 2, or 3, makes the flashloans user contract fail
              amount: [
                {
                  denom: 'untrn',
                  amount: '100',
                },
              ],
            },
          }),
        );
        expect(res.code).toEqual(1);
      } catch (error) {
        expect(error.message).toContain('The ProcessLoan handler failed');
        // Execution failed, the DAO balance should stay the same.
        expect(
          await neutronChain.queryDenomBalance(
            mainDao.contracts.core.address,
            'untrn',
          ),
        ).toEqual(DAO_INITIAL_BALANCE + 1);
      }
    });
    test('Change fee to 0.0 and request a flashloan', async () => {
      let res = await neutronAccount1.executeContract(
        neutronFlashloansAddress,
        JSON.stringify({
          update_config: {
            fee_rate: '0.0',
          },
        }),
      );
      expect(res.code).toEqual(0);

      res = await neutronAccount1.executeContract(
        neutronFlashloansUserAddress,
        JSON.stringify({
          request_loan: {
            flashloans_contract: neutronFlashloansAddress,
            execution_mode: 0, // MODE_RETURN_LOAN
            amount: [
              {
                denom: 'untrn',
                amount: '100',
              },
            ],
          },
        }),
      );
      expect(res.code).toEqual(0);
      // The fee is 0.0, so the DAO balance should stay the same.
      expect(
        await neutronChain.queryDenomBalance(
          mainDao.contracts.core.address,
          'untrn',
        ),
      ).toEqual(DAO_INITIAL_BALANCE + 1);
    });
  });
});
