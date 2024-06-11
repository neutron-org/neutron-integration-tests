/* eslint-disable @typescript-eslint/no-non-null-assertion */
import '@neutron-org/neutronjsplus';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  setupSubDaoTimelockSet,
} from '@neutron-org/neutronjsplus/dist/dao';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import { updateCronParamsProposal } from '@neutron-org/neutronjsplus/dist/proposal';

import config from '../../config.json';
import { LocalState, createWalletWrapper } from '../../helpers/localState';
import { Suite, inject } from 'vitest';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus';

describe('Neutron / Chain Manager', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let subdaoMember1: DaoMember;
  let mainDaoMember: DaoMember;
  let securityDaoAddr: string;
  let subDao: Dao;
  let mainDao: Dao;

  beforeAll(async (suite: Suite) => {
    const mnemonics = inject('mnemonics');
    testState = new LocalState(config, mnemonics, suite);
    await testState.init();
    const demo1Wallet = await testState.walletWithOffset('neutron');
    const securityDaoWallet = await testState.walletWithOffset('neutron');
    securityDaoAddr = securityDaoWallet.address;
    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.rest1,
      testState.rpc1,
    );
    const neutronAccount1 = await createWalletWrapper(
      neutronChain,
      demo1Wallet,
    );

    const daoCoreAddress = await neutronChain.getNeutronDAOCore();
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);

    mainDao = new Dao(neutronChain, daoContracts);
    mainDaoMember = new DaoMember(neutronAccount1, mainDao);
    await mainDaoMember.bondFunds('10000');

    subDao = await setupSubDaoTimelockSet(
      neutronAccount1,
      mainDao.contracts.core.address,
      securityDaoAddr,
      true,
    );

    subdaoMember1 = new DaoMember(neutronAccount1, subDao);

    const subDaosList = await mainDao.getSubDaoList();
    expect(subDaosList).toContain(subDao.contracts.core.address);

    const votingPower = await subdaoMember1.queryVotingPower();
    expect(votingPower.power).toEqual('1');
  });

  // We need to do this because the real main dao has a super long voting period.
  // In the subdao tests, a new set of dao contracts was deployed with a smaller
  // period, but feels like an overkill here.
  describe('Change the overrule proposal voting period', () => {
    let proposalId: number;
    test('create proposal', async () => {
      const currentOverruleProposalConfig = await neutronChain.queryContract(
        mainDao.contracts.proposals['overrule'].address,
        {
          config: {},
        },
      );
      currentOverruleProposalConfig['max_voting_period']['time'] = 5;
      proposalId = await mainDaoMember.submitSingleChoiceProposal(
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
    });
    describe('vote for proposal', () => {
      test('vote YES from wallet 1', async () => {
        await mainDaoMember.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      test('check if proposal is passed', async () => {
        await mainDao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await mainDaoMember.executeProposalWithAttempts(proposalId);
      });
    });
  });

  describe('Add an ALLOW_ONLY strategy (Cron module parameter updates, legacy param changes)', () => {
    let proposalId: number;
    test('create proposal', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      proposalId = await mainDaoMember.submitAddChainManagerStrategyProposal(
        chainManagerAddress,
        'Proposal #2',
        'Add strategy proposal. It will pass',
        {
          add_strategy: {
            address: subDao.contracts.core.address,
            strategy: {
              allow_only: [
                {
                  param_change_permission: {
                    params: [
                      {
                        subspace: 'globalfee',
                        key: 'MaxTotalBypassMinFeeMsgGasUsage',
                      },
                    ],
                  },
                },
                {
                  update_params_permission: {
                    cron_update_params_permission: {
                      security_address: true,
                      limit: true,
                    },
                  },
                },
              ],
            },
          },
        },
        '1000',
      );
    });
    describe('vote for proposal', () => {
      test('vote YES from wallet 1', async () => {
        await mainDaoMember.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      test('check if proposal is passed', async () => {
        await mainDao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await mainDaoMember.executeProposalWithAttempts(proposalId);
      });
    });
  });

  describe('ALLOW_ONLY: change CRON parameters', () => {
    let proposalId: number;
    beforeAll(async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      proposalId = await subdaoMember1.submitUpdateParamsCronProposal(
        chainManagerAddress,
        'Proposal #1',
        'Cron update params proposal. Will pass',
        updateCronParamsProposal({
          security_address: mainDao.contracts.voting.address,
          limit: 42,
        }),
        '1000',
      );

      const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
        proposalId,
      );

      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('timelocked');
      expect(timelockedProp.msgs).toHaveLength(1);
    });

    test('execute timelocked: success', async () => {
      await waitSeconds(10);

      await subdaoMember1.executeTimelockedProposal(proposalId);
      const timelockedProp = await subDao.getTimelockedProposal(proposalId);
      expect(timelockedProp.id).toEqual(proposalId);
      expect(timelockedProp.status).toEqual('executed');
      expect(timelockedProp.msgs).toHaveLength(1);

      const cronParams = await neutronChain.queryCronParams();
      expect(cronParams.params.limit).toEqual('42');
    });
  });
});
