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
  setupSubDaoTimelockSet,
} from '@neutron-org/neutronjsplus/dist/dao';
import { Wallet } from '@neutron-org/neutronjsplus/dist/types';
import cosmosclient from '@cosmos-client/core';
import { waitSeconds } from '@neutron-org/neutronjsplus/dist/wait';
import {
  paramChangeProposal,
  AddChainManagerStrategy,
  updateCronParamsProposal,
} from '@neutron-org/neutronjsplus/dist/proposal';

import config from '../../config.json';

describe('Neutron / Subdao', () => {
  let testState: TestStateLocalCosmosTestNet;
  let neutronChain: CosmosWrapper;
  let neutronAccount1: WalletWrapper;
  let subdaoMember1: DaoMember;
  let mainDaoMember: DaoMember;
  let demo1Wallet: Wallet;
  let securityDaoWallet: Wallet;
  let securityDaoAddr: cosmosclient.AccAddress | cosmosclient.ValAddress;
  let subDao: Dao;
  let mainDao: Dao;

  beforeAll(async () => {
    testState = new TestStateLocalCosmosTestNet(config);
    await testState.init();
    demo1Wallet = testState.wallets.qaNeutron.genQaWal1;
    securityDaoWallet = testState.wallets.qaNeutronThree.genQaWal1;
    securityDaoAddr = securityDaoWallet.address;
    neutronChain = new CosmosWrapper(
      testState.sdk1,
      testState.blockWaiter1,
      NEUTRON_DENOM,
    );
    neutronAccount1 = new WalletWrapper(neutronChain, demo1Wallet);

    const daoCoreAddress = await neutronChain.getNeutronDAOCore();
    const daoContracts = await getDaoContracts(neutronChain, daoCoreAddress);

    mainDao = new Dao(neutronChain, daoContracts);
    mainDaoMember = new DaoMember(neutronAccount1, mainDao);
    await mainDaoMember.bondFunds('10000');

    subDao = await setupSubDaoTimelockSet(
      neutronAccount1,
      mainDao.contracts.core.address,
      securityDaoAddr.toString(),
      true,
    );

    subdaoMember1 = new DaoMember(neutronAccount1, subDao);

    const subDaosList = await mainDao.getSubDaoList();
    expect(subDaosList).toContain(subDao.contracts.core.address);

    const votingPower = await subdaoMember1.queryVotingPower();
    expect(votingPower.power).toEqual('1');
  });

  // describe('Add an ALLOW_ONLY strategy', () => {
  //   test('create proposal', async () => {
  //     const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
  //     await mainDaoMember.submitAddChainManagerStrategyProposal(
  //       chainManagerAddress,
  //       'Proposal #2',
  //       'Add strategy proposal. It will pass',
  //       {
  //         add_strategy: {
  //           strategy: {
  //             address: subDao.contracts.core.address,
  //             permissions: [
  //               {
  //                 UpdateParamsPermission: {
  //                   CronUpdateParamsPermission: {
  //                     security_address: true,
  //                     limit: true,
  //                   },
  //                 },
  //               },
  //             ],
  //           },
  //         },
  //       },
  //       '1000',
  //     );
  //   });
  //   describe('vote for proposal', () => {
  //     const proposalId = 2;
  //     test('vote YES from wallet 1', async () => {
  //       await mainDaoMember.voteYes(proposalId);
  //     });
  //   });
  //
  //   describe('execute proposal', () => {
  //     const proposalId = 2;
  //     test('check if proposal is passed', async () => {
  //       await mainDao.checkPassedProposal(proposalId);
  //     });
  //     test('execute passed proposal', async () => {
  //       await mainDaoMember.executeProposalWithAttempts(proposalId);
  //     });
  //   });
  // });

  describe('Add an ALLOW_ONLY strategy 2', () => {
    test('create proposal', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      await mainDaoMember.submitAddChainManagerStrategyProposal(
        chainManagerAddress,
        'Proposal #2',
        'Add strategy proposal. It will pass',
        {
          add_strategy: {
            strategy: {
              address: subdaoMember1.user.wallet.address,
              permissions: [
                {
                  UpdateParamsPermission: {
                    CronUpdateParamsPermission: {
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
      const proposalId = 2;
      test('vote YES from wallet 1', async () => {
        await mainDaoMember.voteYes(proposalId);
      });
    });

    describe('execute proposal', () => {
      const proposalId = 2;
      test('check if proposal is passed', async () => {
        await mainDao.checkPassedProposal(proposalId);
      });
      test('execute passed proposal', async () => {
        await mainDaoMember.executeProposalWithAttempts(proposalId);
      });
    });
  });

  // describe('Change the overrule proposal voting period', () => {
  //   let proposalId: number;
  //   test('create proposal', async () => {
  //     const currentOverruleProposalConfig = await neutronChain.queryContract(
  //       mainDao.contracts.proposals['overrule'].address,
  //       {
  //         config: {},
  //       },
  //     );
  //     currentOverruleProposalConfig['max_voting_period']['time'] = 5;
  //     proposalId = await mainDaoMember.submitSingleChoiceProposal(
  //       'Proposal',
  //       'Update the max voting period. It will pass',
  //       [
  //         {
  //           wasm: {
  //             execute: {
  //               contract_addr: mainDao.contracts.proposals['overrule'].address,
  //               msg: Buffer.from(
  //                 JSON.stringify({
  //                   update_config: {
  //                     threshold: currentOverruleProposalConfig['threshold'],
  //                     max_voting_period:
  //                       currentOverruleProposalConfig['max_voting_period'],
  //                     allow_revoting:
  //                       currentOverruleProposalConfig['allow_revoting'],
  //                     dao: currentOverruleProposalConfig['dao'],
  //                     close_proposal_on_execution_failure:
  //                       currentOverruleProposalConfig[
  //                         'close_proposal_on_execution_failure'
  //                       ],
  //                   },
  //                 }),
  //               ).toString('base64'),
  //               funds: [],
  //             },
  //           },
  //         },
  //       ],
  //       '1000',
  //     );
  //   });
  //   describe('vote for proposal', () => {
  //     test('vote YES from wallet 1', async () => {
  //       await mainDaoMember.voteYes(proposalId);
  //     });
  //   });
  //
  //   describe('execute proposal', () => {
  //     test('check if proposal is passed', async () => {
  //       await mainDao.checkPassedProposal(proposalId);
  //     });
  //     test('execute passed proposal', async () => {
  //       await mainDaoMember.executeProposalWithAttempts(proposalId);
  //     });
  //   });
  // });
  //
  // describe('ALLOW_ONLY: change CRON parameters', () => {
  //   let proposalId: number;
  //   beforeAll(async () => {
  //     const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
  //     proposalId = await subdaoMember1.submitUpdateParamsCronProposal(
  //       chainManagerAddress,
  //       'Proposal #1',
  //       'Cron update params proposal. Will pass',
  //       updateCronParamsProposal({
  //         security_address: mainDao.contracts.voting.address,
  //         limit: 42,
  //       }),
  //       '1000',
  //     );
  //
  //     const timelockedProp = await subdaoMember1.supportAndExecuteProposal(
  //       proposalId,
  //     );
  //
  //     expect(timelockedProp.id).toEqual(proposalId);
  //     expect(timelockedProp.status).toEqual('timelocked');
  //     expect(timelockedProp.msgs).toHaveLength(1);
  //   });
  //
  //   test('execute timelocked: success', async () => {
  //     const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
  //     const strategies = await neutronChain.queryContract(chainManagerAddress, {
  //       strategies: {},
  //     });
  //     console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> strategies', strategies);
  //     console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> strategies[1][\'permissions\'][0]', strategies[1]['permissions'][0]);
  //
  //     console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> chainManagerAddress', chainManagerAddress);
  //     console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> mainDao.contracts.core.address', mainDao.contracts.core.address);
  //     console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> subDao.contracts.core.address', subDao.contracts.core.address);
  //
  //     const resp = await neutronChain.queryContract(
  //       subDao.contracts.proposals['single'].pre_propose.timelock.address,
  //       { proposal: { proposal_id: proposalId } },
  //     );
  //     console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>> resp[\'msgs\'][\'wasm\']', resp['msgs'][0]['wasm']);
  //
  //     await waitSeconds(10);
  //
  //     await subdaoMember1.executeTimelockedProposal(proposalId);
  //
  //     const timelockedProp = await subDao.getTimelockedProposal(proposalId);
  //     expect(timelockedProp.id).toEqual(proposalId);
  //     expect(timelockedProp.status).toEqual('executed');
  //     expect(timelockedProp.msgs).toHaveLength(1);
  //   });
  // });

  describe('ALLOW_ONLY: change CRON parameters', () => {
    test('execute messages', async () => {
      const chainManagerAddress = (await neutronChain.getChainAdmins())[0];
      const res = await subdaoMember1.user.executeContract(
        chainManagerAddress,
        JSON.stringify({
          execute_messages: {
            messages: [
              updateCronParamsProposal({
                security_address: mainDao.contracts.voting.address,
                limit: 42,
              }),
            ],
          },
        }),
      );
      expect(res.code).toEqual(0);
    });
  });
});
