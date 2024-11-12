/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '@neutron-org/neutronjsplus';
import { LocalState } from '../../helpers/local_state';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus/dist/constants';
import config from '../../config.json';
import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz';
import { SigningNeutronClient } from '../../helpers/signing_neutron_client';
import { inject, RunnerTestSuite } from 'vitest';
import { Wallet } from '../../helpers/wallet';
import { ProtobufRpcClient } from '@cosmjs/stargate';

import { MsgGrant } from '@neutron-org/neutronjs/cosmos/authz/v1beta1/tx';
import { base64FromBytes } from '@neutron-org/neutronjs/helpers';

const DAO_INITIAL_BALANCE = 1000; // untrn

describe('Neutron / Flashloans', () => {
  let testState: LocalState;
  let neutronClient: SigningNeutronClient;
  let neutronRpcClient: ProtobufRpcClient;
  let neutronWallet: Wallet;
  let mainDaoMember: DaoMember;
  let mainDao: Dao;
  let neutronFlashloansAddress: string;
  let neutronFlashloansUserAddress: string;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);
    neutronRpcClient = await testState.neutronRpcClient();
    neutronWallet = await testState.nextWallet('neutron');
    neutronClient = await SigningNeutronClient.connectWithSigner(
      testState.rpcNeutron,
      neutronWallet.directwallet,
      neutronWallet.address,
    );

    // ---------------------SET UP THE DAO

    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient,
      neutronRpcClient,
    );
    const daoContracts = await getDaoContracts(neutronClient, daoCoreAddress);

    mainDao = new Dao(neutronClient, daoContracts);
    mainDaoMember = new DaoMember(
      mainDao,
      neutronClient.client,
      neutronWallet.address,
      NEUTRON_DENOM,
    );
    await mainDaoMember.bondFunds('10000');

    await neutronClient.sendTokens(
      daoCoreAddress,
      [{ denom: NEUTRON_DENOM, amount: DAO_INITIAL_BALANCE.toString() }],
      {
        gas: '200000',
        amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
      },
    );

    // ----------------------INSTANTIATE FLASHLOANS

    const neutronFlashloansCodeId = await neutronClient.upload(
      'neutron_flashloans.wasm',
    );
    const neutronFlashloansInitMsg = {
      owner: neutronWallet.address,
      source: daoCoreAddress,
      fee_rate: '0.01',
    };
    neutronFlashloansAddress = await neutronClient.instantiate(
      neutronFlashloansCodeId,
      neutronFlashloansInitMsg,
    );

    // -----------------INSTANTIATE FLASHLOANS USER CONTRACT

    const neutronFlashloansUserCodeId = await neutronClient.upload(
      'neutron_flashloans_user.wasm',
    );
    const neutronFlashloansUserInitMsg = {};
    neutronFlashloansUserAddress = await neutronClient.instantiate(
      neutronFlashloansUserCodeId,
      neutronFlashloansUserInitMsg,
    );

    await neutronClient.sendTokens(
      neutronFlashloansUserAddress,
      [{ denom: 'untrn', amount: '50' }],
      {
        gas: '200000',
        amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
      },
    );
  });

  describe('Grant a GenericAuthorization from the DAO to the flashloans contract', () => {
    let proposalId: number;

    test('Create and submit proposal', async () => {
      const daoCoreAddress = await getNeutronDAOCore(
        neutronClient,
        neutronRpcClient,
      );

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
        },
      });

      const stargateMsg = {
        stargate: {
          type_url: MsgGrant.typeUrl,
          value: base64FromBytes(MsgGrant.encode(msgGrant).finish()),
        },
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
      const res = await neutronClient.execute(neutronFlashloansUserAddress, {
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
      });
      expect(res.code).toEqual(0);

      // We started with 1000untrn on the dao balance, requested 100 with a
      // 0.01 fee, and expect to see DAO_INITIAL_BALANCE + 1 after the loan
      // is paid back
      expect(
        (
          await neutronClient.getBalance(
            mainDao.contracts.core.address,
            NEUTRON_DENOM,
          )
        ).amount,
      ).toEqual((DAO_INITIAL_BALANCE + 1).toString());
    });
    test('Request a flashloan (and not return it)', async () => {
      try {
        const res = await neutronClient.execute(neutronFlashloansUserAddress, {
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
        });
        expect(res.code).toEqual(1);
      } catch (error) {
        expect(error.message).toContain(
          'Borrower did not return exactly (loan + fee)',
        );

        // Execution failed, the DAO balance should stay the same.
        expect(
          (
            await neutronClient.getBalance(
              mainDao.contracts.core.address,
              NEUTRON_DENOM,
            )
          ).amount,
        ).toEqual((DAO_INITIAL_BALANCE + 1).toString());
      }
    });
    test('Request a flashloan (request more that is available)', async () => {
      try {
        const res = await neutronClient.execute(neutronFlashloansUserAddress, {
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
        });
        expect(res.code).toEqual(1);
      } catch (error) {
        expect(error.message).toContain("Source doesn't have enough untrn");
        // Execution failed, the DAO balance should stay the same.
        expect(
          (
            await neutronClient.getBalance(
              mainDao.contracts.core.address,
              NEUTRON_DENOM,
            )
          ).amount,
        ).toEqual((DAO_INITIAL_BALANCE + 1).toString());
      }
    });
    test('Request a flashloan (and return more than required)', async () => {
      try {
        const res = await neutronClient.execute(neutronFlashloansUserAddress, {
          request_loan: {
            flashloans_contract: neutronFlashloansAddress,
            execution_mode: 2, // MODE_RETURN_LOAN_MORE_THAN_NECESSARY
            amount: [
              {
                denom: 'untrn',
                amount: '100',
              },
            ],
          },
        });
        expect(res.code).toEqual(1);
      } catch (error) {
        expect(error.message).toContain(
          'Borrower did not return exactly (loan + fee)',
        );
        // Execution failed, the DAO balance should stay the same.
        expect(
          (
            await neutronClient.getBalance(
              mainDao.contracts.core.address,
              NEUTRON_DENOM,
            )
          ).amount,
        ).toEqual((DAO_INITIAL_BALANCE + 1).toString());
      }
    });
    test('Request a flashloan (and request another one recursively)', async () => {
      try {
        const res = await neutronClient.execute(neutronFlashloansUserAddress, {
          request_loan: {
            flashloans_contract: neutronFlashloansAddress,
            execution_mode: 3, // MODE_REQUEST_ANOTHER_LOAN_RECURSIVELY
            amount: [
              {
                denom: 'untrn',
                amount: '100',
              },
            ],
          },
        });
        expect(res.code).toEqual(1);
      } catch (error) {
        expect(error.message).toContain(
          'A flashloan is already active in this transaction',
        );
        // Execution failed, the DAO balance should stay the same.
        expect(
          (
            await neutronClient.getBalance(
              mainDao.contracts.core.address,
              NEUTRON_DENOM,
            )
          ).amount,
        ).toEqual((DAO_INITIAL_BALANCE + 1).toString());
      }
    });
    test('Request a flashloan (and fail internally)', async () => {
      try {
        const res = await neutronClient.execute(neutronFlashloansUserAddress, {
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
        });
        expect(res.code).toEqual(1);
      } catch (error) {
        expect(error.message).toContain('The ProcessLoan handler failed');
        // Execution failed, the DAO balance should stay the same.
        expect(
          (
            await neutronClient.getBalance(
              mainDao.contracts.core.address,
              NEUTRON_DENOM,
            )
          ).amount,
        ).toEqual((DAO_INITIAL_BALANCE + 1).toString());
      }
    });
    test('Change fee to 0.0 and request a flashloan', async () => {
      let res = await neutronClient.execute(neutronFlashloansAddress, {
        update_config: {
          fee_rate: '0.0',
        },
      });
      expect(res.code).toEqual(0);

      res = await neutronClient.execute(neutronFlashloansUserAddress, {
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
      });
      expect(res.code).toEqual(0);
      // The fee is 0.0, so the DAO balance should stay the same.
      expect(
        (
          await neutronClient.getBalance(
            mainDao.contracts.core.address,
            NEUTRON_DENOM,
          )
        ).amount,
      ).toEqual((DAO_INITIAL_BALANCE + 1).toString());
    });
  });
});
