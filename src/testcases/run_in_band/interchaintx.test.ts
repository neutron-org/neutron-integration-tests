import { IndexedTx, JsonObject } from '@cosmjs/cosmwasm-stargate';
import '@neutron-org/neutronjsplus';
import { getSequenceId } from '@neutron-org/neutronjsplus/dist/cosmos';
import { defaultRegistryTypes } from '@cosmjs/stargate';
import { Registry } from '@cosmjs/proto-signing';
import {
  CONTRACTS,
  COSMOS_DENOM,
  IBC_RELAYER_NEUTRON_ADDRESS,
  NEUTRON_DENOM,
} from '../../helpers/constants';
import { LocalState } from '../../helpers/local_state';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import { RunnerTestSuite, inject, afterAll } from 'vitest';
import { SigningStargateClient } from '@cosmjs/stargate';
import {
  QueryClientImpl as StakingQueryClient,
  QueryDelegatorDelegationsResponse,
} from 'cosmjs-types/cosmos/staking/v1beta1/query';
import { QueryChannelsResponse } from '@neutron-org/neutronjs/ibc/core/channel/v1/query';
import { QueryClientImpl as IbcQueryClient } from '@neutron-org/neutronjs/ibc/core/channel/v1/query.rpc.Query';
import { QueryFailuresResponse } from '@neutron-org/neutronjs/neutron/contractmanager/query';
import { getWithAttempts } from '../../helpers/misc';
import { QueryClientImpl as ContractManagerQuery } from '@neutron-org/neutronjs/neutron/contractmanager/query.rpc.Query';

import { GaiaWallet, Wallet } from '../../helpers/wallet';
import {
  AcknowledgementResult,
  cleanAckResults,
  getAck,
  getAcks,
  relayPacketFromA,
  waitForAck,
} from '../../helpers/interchaintxs';
import { execSync } from 'child_process';
import { Link } from '@confio/relayer/build';
import config from '../../config.json';
import {
  Order,
  State,
} from '@neutron-org/neutronjs/ibc/core/channel/v1/channel';
import {
  Dao,
  DaoMember,
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { NeutronQuerier } from '@neutron-org/neutronjs/querier_types';
import { createRPCQueryClient as createNeutronClient } from '@neutron-org/neutronjs/neutron/rpc.query';
import { updateFeerefunderParamsProposal } from '@neutron-org/neutronjsplus/dist/proposal';

describe('Neutron / Interchain TXs', () => {
  let testState: LocalState;
  let contractAddress: string;
  let icaAddress1: string;
  let icaAddress2: string;
  let unorderedIcaAddress: string;
  let gaiaStakingQuerier: StakingQueryClient;
  let ibcQuerier: IbcQueryClient;
  let contractManagerQuerier: ContractManagerQuery;

  let neutronClient: NeutronTestClient;
  let gaiaClient: SigningStargateClient;
  let neutronWallet: Wallet;
  let gaiaWallet: GaiaWallet;

  let link: Link;

  const icaId1 = 'test1';
  const icaId2 = 'test2';
  const unorderedIcaId = 'test-unordered';
  const connectionId = 'connection-0';

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronWallet = await testState.nextNeutronWallet();
    neutronClient = await NeutronTestClient.connectWithSigner(neutronWallet);

    gaiaWallet = await testState.nextGaiaWallet();
    gaiaClient = await SigningStargateClient.connectWithSigner(
      testState.rpcGaia,
      gaiaWallet.signer,
      { registry: new Registry(defaultRegistryTypes) },
    );

    const neutronRpcClient = await testState.neutronRpcClient();
    ibcQuerier = new IbcQueryClient(neutronRpcClient);
    contractManagerQuerier = new ContractManagerQuery(neutronRpcClient);
    const gaiaRpcClient = await testState.gaiaRpcClient();
    gaiaStakingQuerier = new StakingQueryClient(gaiaRpcClient);

    link = await testState.relayerLink();
  });

  describe('Interchain Tx with multiple ICAs', () => {
    describe('Setup', () => {
      test('instantiate', async () => {
        contractAddress = await neutronClient.create(
          CONTRACTS.INTERCHAIN_TXS,
          {},
          'interchaintx',
        );
      });
    });
    describe('Create ICAs and setup contract', () => {
      test('fund contract to pay fees', async () => {
        const res = await neutronClient.sendTokens(
          contractAddress,
          [{ denom: NEUTRON_DENOM, amount: '10000000' }],
          {
            gas: '200000',
            amount: [{ denom: NEUTRON_DENOM, amount: '1000' }],
          },
        );
        expect(res.code).toEqual(0);
      });
      test('create ICA1', async () => {
        const res = await neutronClient.execute(contractAddress, {
          register: {
            connection_id: connectionId,
            interchain_account_id: icaId1,
          },
        });
        expect(res.code).toEqual(0);
      });
      test('create ICA2', async () => {
        const res = await neutronClient.execute(contractAddress, {
          register: {
            connection_id: connectionId,
            interchain_account_id: icaId2,
          },
        });
        expect(res.code).toEqual(0);
      });
      test('create unordered ICA', async () => {
        const res = await neutronClient.execute(contractAddress, {
          register: {
            connection_id: connectionId,
            interchain_account_id: unorderedIcaId,
            ordering: 'Unordered',
          },
        });
        expect(res.code).toEqual(0);
      });
      test('check contract balance', async () => {
        const balance = await neutronClient.getBalance(
          contractAddress,
          NEUTRON_DENOM,
        );
        expect(balance.amount).toEqual('7000000');
      });
      test('multiple IBC accounts created', async () => {
        const channels =
          await neutronClient.getWithAttempts<QueryChannelsResponse>(
            () => ibcQuerier.channels({}),
            // Wait until there are 3 channels:
            // - one exists already, it is open for IBC transfers;
            // - two more should appear soon since we are opening them implicitly
            //   through ICA creation.
            async (channels) => channels.channels.length == 4,
          );
        expect(channels.channels).toBeArray();
        expect(channels.channels).toIncludeAllPartialMembers([
          {
            portId: `icacontroller-${contractAddress}.test1`,
            ordering: Order.ORDER_ORDERED,
          },
          {
            portId: `icacontroller-${contractAddress}.test2`,
            ordering: Order.ORDER_ORDERED,
          },
          {
            portId: `icacontroller-${contractAddress}.test-unordered`,
            ordering: Order.ORDER_UNORDERED,
          },
        ]);
      });

      test('get ica address', async () => {
        const ica1 = await neutronClient.getWithAttempts<JsonObject>(
          () =>
            neutronClient.queryContractSmart(contractAddress, {
              interchain_account_address: {
                interchain_account_id: icaId1,
                connection_id: connectionId,
              },
            }),
          async (data) => data.interchain_account_address != null,
        );
        expect(ica1.interchain_account_address).toStartWith('cosmos');
        expect(ica1.interchain_account_address.length).toEqual(65);
        icaAddress1 = ica1.interchain_account_address;

        const ica2 = await neutronClient.getWithAttempts<JsonObject>(
          () =>
            neutronClient.queryContractSmart(contractAddress, {
              interchain_account_address: {
                interchain_account_id: icaId2,
                connection_id: connectionId,
              },
            }),
          async (data) => data.interchain_account_address != null,
        );
        expect(ica2.interchain_account_address).toStartWith('cosmos');
        expect(ica2.interchain_account_address.length).toEqual(65);
        icaAddress2 = ica2.interchain_account_address;

        const icaUnordered = await neutronClient.getWithAttempts<JsonObject>(
          () =>
            neutronClient.queryContractSmart(contractAddress, {
              interchain_account_address: {
                interchain_account_id: unorderedIcaId,
                connection_id: connectionId,
              },
            }),
          async (data) => data.interchain_account_address != null,
        );
        expect(icaUnordered.interchain_account_address).toStartWith('cosmos');
        expect(icaUnordered.interchain_account_address.length).toEqual(65);
        unorderedIcaAddress = icaUnordered.interchain_account_address;
      });

      test('set payer fees', async () => {
        const res = await neutronClient.execute(contractAddress, {
          set_fees: {
            fees: {
              denom: NEUTRON_DENOM,
              ack_fee: '2000',
              recv_fee: '0',
              timeout_fee: '2000',
            },
          },
        });
        expect(res.code).toEqual(0);
      });

      test('add some money to ICAs', async () => {
        const res1 = await gaiaClient.sendTokens(
          gaiaWallet.address,
          icaAddress1,
          [{ denom: COSMOS_DENOM, amount: '10000' }],
          {
            gas: '200000',
            amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
          },
        );
        expect(res1.code).toEqual(0);
        const res2 = await gaiaClient.sendTokens(
          gaiaWallet.address,
          icaAddress2,
          [{ denom: COSMOS_DENOM, amount: '10000' }],
          {
            gas: '200000',
            amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
          },
        );
        expect(res2.code).toEqual(0);
        // unordered ICA
        const res3 = await gaiaClient.sendTokens(
          gaiaWallet.address,
          unorderedIcaAddress,
          [{ denom: COSMOS_DENOM, amount: '10000' }],
          {
            gas: '200000',
            amount: [{ denom: COSMOS_DENOM, amount: '1000' }],
          },
        );
        expect(res3.code).toEqual(0);
      });
    });
    describe('Send Interchain TX', () => {
      test('delegate from first ICA', async () => {
        const res = await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.cosmos.val1.valAddress,
            amount: '1000',
            denom: COSMOS_DENOM,
          },
        });
        expect(res.code).toEqual(0);
        const sequenceId = getSequenceId(res);
        await waitForAck(neutronClient, contractAddress, icaId1, sequenceId);
        const ackRes = await getAck(
          neutronClient,
          contractAddress,
          icaId1,
          sequenceId,
        );
        expect(ackRes).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegateResponse'],
        });
      });
      test('check validator state', async () => {
        const res1 = await getWithAttempts<QueryDelegatorDelegationsResponse>(
          gaiaClient,
          () =>
            gaiaStakingQuerier.DelegatorDelegations({
              delegatorAddr: icaAddress1,
            }),
          async (delegations) => delegations.delegationResponses?.length == 1,
        );
        expect(res1.delegationResponses).toEqual([
          {
            balance: { amount: '1000', denom: COSMOS_DENOM },
            delegation: {
              delegatorAddress: icaAddress1,
              shares: '1000000000000000000000',
              validatorAddress:
                'cosmosvaloper18hl5c9xn5dze2g50uaw0l2mr02ew57zk0auktn',
            },
          },
        ]);
        const res2 = await getWithAttempts<QueryDelegatorDelegationsResponse>(
          gaiaClient,
          () =>
            gaiaStakingQuerier.DelegatorDelegations({
              delegatorAddr: icaAddress2,
            }),
          async (delegations) => delegations.delegationResponses?.length == 0,
        );
        expect(res2.delegationResponses).toEqual([]);
      });
      test('check contract balance', async () => {
        const balance = await neutronClient.getBalance(
          contractAddress,
          NEUTRON_DENOM,
        );
        expect(balance.amount).toEqual('6998000');
      });
    });

    describe('Send Interchain TX with fees disabled', () => {
      let daoMember: DaoMember;
      let dao: Dao;
      let neutronQuerier: NeutronQuerier;
      let chainManagerAddress: string;

      let contractBalanceBefore: number;
      let relayerBalanceBefore: number;

      beforeAll(async () => {
        const neutronRpcClient = await testState.rpcClient('neutron');

        const daoCoreAddress = await getNeutronDAOCore(
          neutronClient,
          neutronRpcClient,
        );
        const daoContracts = await getDaoContracts(
          neutronClient,
          daoCoreAddress,
        );

        neutronQuerier = await createNeutronClient({
          rpcEndpoint: testState.rpcNeutron,
        });
        const admins =
          await neutronQuerier.cosmos.adminmodule.adminmodule.admins();
        chainManagerAddress = admins.admins[0];

        dao = new Dao(neutronClient, daoContracts);
        daoMember = new DaoMember(
          dao,
          neutronClient.client,
          neutronWallet.address,
          NEUTRON_DENOM,
        );
        await daoMember.bondFunds('1000000000');

        // disable fees
        const proposalId =
          await daoMember.submitUpdateParamsFeerefunderProposal(
            chainManagerAddress,
            'Proposal update feerefunder params',
            'Feerefunder update params proposal',
            updateFeerefunderParamsProposal({
              min_fee: {
                recv_fee: [],
                ack_fee: [
                  {
                    amount: '1000',
                    denom: NEUTRON_DENOM,
                  },
                ],
                timeout_fee: [
                  {
                    amount: '1000',
                    denom: NEUTRON_DENOM,
                  },
                ],
              },
              fee_enabled: false,
            }),
            '1000',
          );
        await daoMember.voteYes(proposalId);
        await dao.checkPassedProposal(proposalId);
        await daoMember.executeProposalWithAttempts(proposalId);

        const feerefunderParams =
          await neutronQuerier.neutron.feerefunder.params({});
        expect(feerefunderParams.params.feeEnabled).toBeFalse();

        const balance = await neutronClient.getBalance(
          IBC_RELAYER_NEUTRON_ADDRESS,
          NEUTRON_DENOM,
        );
        relayerBalanceBefore = +(balance.amount || '0');

        const balance2 = await neutronClient.getBalance(
          contractAddress,
          NEUTRON_DENOM,
        );
        contractBalanceBefore = +(balance2.amount || '0');
      });

      afterAll(async () => {
        // enable fees
        const proposalId =
          await daoMember.submitUpdateParamsFeerefunderProposal(
            chainManagerAddress,
            'Proposal #4',
            'Feerefunder update params proposal',
            updateFeerefunderParamsProposal({
              min_fee: {
                recv_fee: [],
                ack_fee: [
                  {
                    amount: '1000',
                    denom: NEUTRON_DENOM,
                  },
                ],
                timeout_fee: [
                  {
                    amount: '1000',
                    denom: NEUTRON_DENOM,
                  },
                ],
              },
              fee_enabled: true,
            }),
            '1000',
          );
        await daoMember.voteYes(proposalId);
        await dao.checkPassedProposal(proposalId);
        await daoMember.executeProposalWithAttempts(proposalId);

        const feerefunderParams =
          await neutronQuerier.neutron.feerefunder.params({});
        expect(feerefunderParams.params.feeEnabled).toBeTrue();
      });

      describe('Fees disabled does not send fees even if specified', () => {
        test('delegate from first ICA', async () => {
          const res = await neutronClient.execute(contractAddress, {
            delegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.valAddress,
              amount: '1000',
              denom: COSMOS_DENOM,
            },
          });
          expect(res.code).toEqual(0);
          const sequenceId = getSequenceId(res);
          await waitForAck(neutronClient, contractAddress, icaId1, sequenceId);
          const ackRes = await getAck(
            neutronClient,
            contractAddress,
            icaId1,
            sequenceId,
          );
          expect(ackRes).toMatchObject<AcknowledgementResult>({
            success: ['/cosmos.staking.v1beta1.MsgDelegateResponse'],
          });
        });
        test('check validator state', async () => {
          const res1 = await getWithAttempts<QueryDelegatorDelegationsResponse>(
            gaiaClient,
            () =>
              gaiaStakingQuerier.DelegatorDelegations({
                delegatorAddr: icaAddress1,
              }),
            async (res) => res.delegationResponses?.length == 1,
          );
          expect(res1.delegationResponses).toEqual([
            {
              balance: { amount: '2000', denom: COSMOS_DENOM },
              delegation: {
                delegatorAddress: icaAddress1,
                shares: '2000000000000000000000',
                validatorAddress:
                  'cosmosvaloper18hl5c9xn5dze2g50uaw0l2mr02ew57zk0auktn',
              },
            },
          ]);
        });
        test('contract balance should not change', async () => {
          const balance = await neutronClient.getBalance(
            contractAddress,
            NEUTRON_DENOM,
          );
          expect(+balance.amount).toEqual(contractBalanceBefore);
        });

        test('relayer must not receive fees', async () => {
          const balanceAfter = await neutronClient.getBalance(
            IBC_RELAYER_NEUTRON_ADDRESS,
            NEUTRON_DENOM,
          );
          // relayer balance changes only because of gas fees
          expect(relayerBalanceBefore - +balanceAfter.amount).toBeWithin(
            0,
            4000,
          );
        });
      });

      describe('Fees disabled allow for empty fees', async () => {
        beforeAll(async () => {
          const res = await neutronClient.execute(contractAddress, {
            set_fees: {
              fees: null,
            },
          });
          expect(res.code).toEqual(0);
        });
        afterAll(async () => {
          const res = await neutronClient.execute(contractAddress, {
            set_fees: {
              fees: {
                denom: NEUTRON_DENOM,
                ack_fee: '2000',
                recv_fee: '0',
                timeout_fee: '2000',
              },
            },
          });
          expect(res.code).toEqual(0);
        });

        test('delegate from first ICA', async () => {
          const res = await neutronClient.execute(contractAddress, {
            delegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.valAddress,
              amount: '1000',
              denom: COSMOS_DENOM,
            },
          });
          expect(res.code).toEqual(0);
          const sequenceId = getSequenceId(res);
          await waitForAck(neutronClient, contractAddress, icaId1, sequenceId);
          const ackRes = await getAck(
            neutronClient,
            contractAddress,
            icaId1,
            sequenceId,
          );
          expect(ackRes).toMatchObject<AcknowledgementResult>({
            success: ['/cosmos.staking.v1beta1.MsgDelegateResponse'],
          });
        });
        test('check validator state', async () => {
          const res1 = await getWithAttempts<QueryDelegatorDelegationsResponse>(
            gaiaClient,
            () =>
              gaiaStakingQuerier.DelegatorDelegations({
                delegatorAddr: icaAddress1,
              }),
            async (res) => res.delegationResponses?.length == 1,
          );
          expect(res1.delegationResponses).toEqual([
            {
              balance: { amount: '3000', denom: COSMOS_DENOM },
              delegation: {
                delegatorAddress: icaAddress1,
                shares: '3000000000000000000000',
                validatorAddress:
                  'cosmosvaloper18hl5c9xn5dze2g50uaw0l2mr02ew57zk0auktn',
              },
            },
          ]);
        });
        test('contract balance should not change', async () => {
          const balance = await neutronClient.getBalance(
            contractAddress,
            NEUTRON_DENOM,
          );
          expect(+balance.amount).toEqual(contractBalanceBefore);
        });

        test('relayer must not receive fees', async () => {
          const balanceAfter = await neutronClient.getBalance(
            IBC_RELAYER_NEUTRON_ADDRESS,
            NEUTRON_DENOM,
          );
          // relayer balance changes only because of gas fees
          expect(relayerBalanceBefore - +balanceAfter.amount).toBeWithin(
            0,
            4000,
          );
        });
      });
    });

    describe('DOUBLE ACK - Send Interchain TX', () => {
      test('delegate from first ICA', async () => {
        // it will delegate two times of passed amount - first from contract call, and second from successful sudo IBC response
        const res: IndexedTx = await neutronClient.execute(contractAddress, {
          delegate_double_ack: {
            interchain_account_id: icaId1,
            validator: testState.wallets.cosmos.val1.valAddress,
            amount: '500',
            denom: COSMOS_DENOM,
          },
        });
        expect(res.code).toEqual(0);
        const sequenceId = getSequenceId(res);

        await waitForAck(neutronClient, contractAddress, icaId1, sequenceId);
        const ackRes = await getAck(
          neutronClient,
          contractAddress,
          icaId1,
          sequenceId,
        );
        expect(ackRes).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegateResponse'],
        });

        const ackSequenceId = sequenceId + 1;
        await waitForAck(neutronClient, contractAddress, icaId1, ackSequenceId);
        expect(ackRes).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegateResponse'],
        });
      });
      test('check validator state', async () => {
        const res1 = await getWithAttempts(
          gaiaClient,
          () =>
            gaiaStakingQuerier.DelegatorDelegations({
              delegatorAddr: icaAddress1,
            }),
          async (delegations) => delegations.delegationResponses?.length == 1,
        );
        expect(res1.delegationResponses).toEqual([
          {
            balance: { amount: '4000', denom: COSMOS_DENOM },
            delegation: {
              delegatorAddress: icaAddress1,
              shares: '4000000000000000000000',
              validatorAddress:
                'cosmosvaloper18hl5c9xn5dze2g50uaw0l2mr02ew57zk0auktn',
            },
          },
        ]);
        const res2 = await gaiaStakingQuerier.DelegatorDelegations({
          delegatorAddr: icaAddress2,
        });
        expect(res2.delegationResponses).toEqual([]);
      });
      test('check contract balance', async () => {
        const balance = await neutronClient.getBalance(
          contractAddress,
          NEUTRON_DENOM,
        );
        // two interchain txs inside (2000 * 2 = 4000)
        expect(balance.amount).toEqual('6994000');
      });
    });

    describe('Error cases', () => {
      test('delegate for unknown validator from second ICA', async () => {
        const res = await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: icaId2,
            validator: 'nonexistent_address',
            amount: '2000',
            denom: COSMOS_DENOM,
          },
        });
        expect(res.code).toEqual(0);

        const sequenceId = getSequenceId(res);

        await waitForAck(neutronClient, contractAddress, icaId2, sequenceId);
        const ackRes = await getAck(
          neutronClient,
          contractAddress,
          icaId2,
          sequenceId,
        );
        expect(ackRes).toMatchObject<AcknowledgementResult>({
          error: [
            'message',
            'ABCI code: 7: error handling packet: see events for details',
          ],
        });
      });
      test('undelegate from first ICA, delegate from second ICA', async () => {
        await cleanAckResults(neutronClient, contractAddress);
        const res1 = await neutronClient.execute(contractAddress, {
          undelegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.cosmos.val1.valAddress,
            amount: '3000',
            denom: COSMOS_DENOM,
          },
        });
        expect(res1.code).toEqual(0);

        const sequenceId1 = getSequenceId(res1);

        const res2 = await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: icaId2,
            validator: testState.wallets.cosmos.val1.valAddress,
            amount: '2000',
            denom: COSMOS_DENOM,
          },
        });
        expect(res2.code).toEqual(0);

        const sequenceId2 = getSequenceId(res2);

        const ackRes1 = await waitForAck(
          neutronClient,
          contractAddress,
          icaId1,
          sequenceId1,
        );
        expect(ackRes1).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgUndelegateResponse'],
        });

        const ackRes2 = await waitForAck(
          neutronClient,
          contractAddress,
          icaId2,
          sequenceId2,
        );
        expect(ackRes2).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegateResponse'],
        });
      });
      test('delegate with timeout', async () => {
        await cleanAckResults(neutronClient, contractAddress);
        const res = await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.cosmos.val1.valAddress,
            amount: '10',
            denom: COSMOS_DENOM,
            timeout: 1,
          },
        });
        expect(res.code).toEqual(0);

        const sequenceId = getSequenceId(res);

        // timeout handling may be slow, hence we wait for up to 100 blocks here
        await waitForAck(
          neutronClient,
          contractAddress,
          icaId1,
          sequenceId,
          100,
        );
        const ackRes1 = await getAck(
          neutronClient,
          contractAddress,
          icaId1,
          sequenceId,
        );
        expect(ackRes1).toMatchObject<AcknowledgementResult>({
          timeout: 'message',
        });
      });
      test('delegate after the ICA channel was closed', async () => {
        let rawLog: string;
        try {
          const res = await neutronClient.execute(contractAddress, {
            delegate: {
              interchain_account_id: icaId1,
              validator: testState.wallets.cosmos.val1.valAddress,
              amount: '10',
              denom: COSMOS_DENOM,
              timeout: 1,
            },
          });
          rawLog = res.rawLog;
        } catch (e) {
          rawLog = e.message;
        }
        expect(rawLog.includes('no active channel for this owner'));
      });
      describe('zero fee', () => {
        beforeAll(async () => {
          const res = await neutronClient.execute(contractAddress, {
            set_fees: {
              fees: {
                denom: NEUTRON_DENOM,
                ack_fee: '0',
                recv_fee: '0',
                timeout_fee: '0',
              },
            },
          });
          expect(res.code).toEqual(0);
        });
        test('delegate with zero fee', async () => {
          await expect(
            neutronClient.execute(contractAddress, {
              delegate: {
                interchain_account_id: icaId1,
                validator: testState.wallets.cosmos.val1.valAddress,
                amount: '2000',
                denom: COSMOS_DENOM,
              },
            }),
          ).rejects.toThrow(/invalid coins/);
        });
      });
      describe('insufficient funds for fee', () => {
        beforeAll(async () => {
          const res = await neutronClient.execute(contractAddress, {
            set_fees: {
              fees: {
                denom: NEUTRON_DENOM,
                ack_fee: '9999999999',
                recv_fee: '0',
                timeout_fee: '9999999999',
              },
            },
          });
          expect(res.code).toEqual(0);
        });
        afterAll(async () => {
          const res = await neutronClient.execute(contractAddress, {
            set_fees: {
              fees: {
                denom: NEUTRON_DENOM,
                ack_fee: '2000',
                recv_fee: '0',
                timeout_fee: '2000',
              },
            },
          });
          expect(res.code).toEqual(0);
        });
        test('delegate with zero fee', async () => {
          await expect(
            neutronClient.execute(contractAddress, {
              delegate: {
                interchain_account_id: icaId1,
                validator: testState.wallets.cosmos.val1.valAddress,
                amount: '2000',
                denom: COSMOS_DENOM,
              },
            }),
          ).rejects.toThrow(/insufficient funds/);
        });
      });
    });

    describe('Recreation', () => {
      test('recreate ICA1', async () => {
        const res = await neutronClient.execute(contractAddress, {
          register: {
            connection_id: connectionId,
            interchain_account_id: icaId1,
          },
        });
        expect(res.code).toEqual(0);
        await neutronClient.getWithAttempts(
          async () => ibcQuerier.channels({}),
          // Wait until there are 5 channels:
          // - one exists already, it is open for IBC transfers;
          // - three channels are already opened via ICA registration before
          // - one more, we are opening it right now
          async (channels) => channels.channels.length == 5,
        );
        await neutronClient.getWithAttempts(
          () => ibcQuerier.channels({}),
          async (channels) =>
            channels.channels.findLast(
              (c) => c.portId === `icacontroller-${contractAddress}.test1`,
            )?.state == State.STATE_OPEN,
          200,
        );
      });
      test('delegate from first ICA after ICA recreation', async () => {
        await cleanAckResults(neutronClient, contractAddress);
        const res = await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.cosmos.val1.valAddress,
            denom: COSMOS_DENOM,
            amount: '20',
          },
        });
        expect(res.code).toEqual(0);
        const sequenceId = getSequenceId(res);

        const ackRes = await waitForAck(
          neutronClient,
          contractAddress,
          icaId1,
          sequenceId,
        );
        expect(ackRes).toMatchObject<AcknowledgementResult>({
          success: ['/cosmos.staking.v1beta1.MsgDelegateResponse'],
        });
      });
      test('check validator state after ICA recreation', async () => {
        const res = await gaiaStakingQuerier.DelegatorDelegations({
          delegatorAddr: icaAddress1,
        });
        expect(res.delegationResponses).toEqual([
          {
            balance: { amount: '1020', denom: COSMOS_DENOM },
            delegation: {
              delegatorAddress: icaAddress1,
              shares: '1020000000000000000000',
              validatorAddress:
                'cosmosvaloper18hl5c9xn5dze2g50uaw0l2mr02ew57zk0auktn',
            },
          },
        ]);
      });
    });

    describe('Delegate with sudo failure', () => {
      beforeAll(async () => {
        await cleanAckResults(neutronClient, contractAddress);

        const failures = await contractManagerQuerier.failures({
          address: contractAddress,
        });
        expect(failures.failures.length).toEqual(0);

        const acks = await getAcks(neutronClient, contractAddress);
        expect(acks.length).toEqual(0);
      });

      test('ack failure during sudo', async () => {
        // Mock sudo handler to fail
        await neutronClient.execute(contractAddress, {
          integration_tests_set_sudo_failure_mock: { state: 'enabled' },
        });

        // Testing ACK failure
        await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.cosmos.val1.valAddress,
            amount: '10',
            denom: COSMOS_DENOM,
          },
        });

        // wait until sudo is called and processed and failure is recorder
        await neutronClient.getWithAttempts<QueryFailuresResponse>(
          async () =>
            contractManagerQuerier.failures({
              address: contractAddress,
            }),
          async (data) => data.failures.length == 1,
          100,
        );

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronClient, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronClient.execute(contractAddress, {
          integration_tests_unset_sudo_failure_mock: {},
        });
      });

      test('ack failure during sudo submsg', async () => {
        // Mock sudo handler to fail on submsg
        await neutronClient.execute(contractAddress, {
          integration_tests_set_sudo_submsg_failure_mock: {},
        });

        // Testing ACK failure
        await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.cosmos.val1.valAddress,
            amount: '10',
            denom: COSMOS_DENOM,
          },
        });

        // wait until sudo is called and processed and failure is recorder
        await neutronClient.getWithAttempts<QueryFailuresResponse>(
          async () =>
            contractManagerQuerier.failures({
              address: contractAddress,
            }),
          async (data) => data.failures.length == 2,
          100,
        );

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronClient, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronClient.execute(contractAddress, {
          integration_tests_unset_sudo_failure_mock: {},
        });
      });

      test('ack failure during sudo submsg reply', async () => {
        // Mock sudo handler to fail on submsg reply
        await neutronClient.execute(contractAddress, {
          integration_tests_set_sudo_submsg_reply_failure_mock: {},
        });

        // Testing ACK failure
        await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.cosmos.val1.valAddress,
            amount: '10',
            denom: COSMOS_DENOM,
          },
        });

        // wait until sudo is called and processed and failure is recorder
        await neutronClient.getWithAttempts<QueryFailuresResponse>(
          async () =>
            contractManagerQuerier.failures({
              address: contractAddress,
            }),
          async (data) => data.failures.length == 3,
          100,
        );

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronClient, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronClient.execute(contractAddress, {
          integration_tests_unset_sudo_failure_mock: {},
        });
      });

      test('ack failure during sudo out of gas', async () => {
        // Mock sudo handler to fail
        await neutronClient.execute(contractAddress, {
          integration_tests_set_sudo_failure_mock: {
            state: 'enabled_infinite_loop',
          },
        });

        // Testing ACK failure
        await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.cosmos.val1.valAddress,
            amount: '10',
            denom: COSMOS_DENOM,
          },
        });

        // wait until sudo is called and processed and failure is recorder
        await neutronClient.getWithAttempts<QueryFailuresResponse>(
          async () =>
            contractManagerQuerier.failures({
              address: contractAddress,
            }),
          async (data) => data.failures.length == 4,
          100,
        );

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronClient, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronClient.execute(contractAddress, {
          integration_tests_unset_sudo_failure_mock: {},
        });
      });

      test('timeout failure during sudo', async () => {
        // Mock sudo handler to fail
        await neutronClient.execute(contractAddress, {
          integration_tests_set_sudo_failure_mock: { state: 'enabled' },
        });

        const res = await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: icaId1,
            validator: testState.wallets.cosmos.val1.valAddress,
            amount: '10',
            denom: COSMOS_DENOM,
            timeout: 1,
          },
        });
        expect(res.code).toEqual(0);

        // wait until sudo is called and processed and failure is recorder
        await neutronClient.getWithAttempts<QueryFailuresResponse>(
          async () =>
            contractManagerQuerier.failures({
              address: contractAddress,
            }),
          async (data) => data.failures.length == 5,
          100,
        );

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronClient, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronClient.execute(contractAddress, {
          integration_tests_unset_sudo_failure_mock: {},
        });
      });

      test('out of gas failure during sudo timeout', async () => {
        // Mock sudo handler to fail
        await neutronClient.execute(contractAddress, {
          integration_tests_set_sudo_failure_mock: {
            state: 'enabled_infinite_loop',
          },
        });

        // Testing timeout failure
        await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: icaId2,
            validator: testState.wallets.cosmos.val1.valAddress,
            amount: '10',
            denom: COSMOS_DENOM,
            timeout: 1,
          },
        });

        // wait until sudo is called and processed and failure is recorder
        await neutronClient.getWithAttempts<QueryFailuresResponse>(
          async () =>
            contractManagerQuerier.failures({
              address: contractAddress,
            }),
          async (data) => data.failures.length == 6,
          100,
        );

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronClient, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronClient.execute(contractAddress, {
          integration_tests_unset_sudo_failure_mock: {},
        });
      });

      test('check stored failures and acks', async () => {
        const failures = await contractManagerQuerier.failures({
          address: contractAddress,
        });
        // 4 ack failures, 2 timeout failure, just as described in the tests above
        expect(failures.failures).toEqual([
          expect.objectContaining({
            address: contractAddress,
            id: 0n,
            error: 'codespace: wasm, code: 5', // execute wasm contract failed
          }),
          expect.objectContaining({
            address: contractAddress,
            id: 1n,
            error: 'codespace: wasm, code: 5', // execute wasm contract failed
          }),
          expect.objectContaining({
            address: contractAddress,
            id: 2n,
            error: 'codespace: wasm, code: 5', // execute wasm contract failed
          }),
          expect.objectContaining({
            address: contractAddress,
            id: 3n,
            error: 'codespace: contractmanager, code: 1103', // contractmanager sudo limit exceeded
          }),
          expect.objectContaining({
            address: contractAddress,
            id: 4n,
            error: 'codespace: wasm, code: 5', // execute wasm contract failed
          }),
          expect.objectContaining({
            address: contractAddress,
            id: 5n,
            error: 'codespace: contractmanager, code: 1103', // contractmanager sudo limit exceeded
          }),
        ]);

        const acks = await getAcks(neutronClient, contractAddress);
        // no acks at all because all sudo handling cases resulted in an error
        expect(acks).toEqual([]);
      });

      test('failed attempt to resubmit failure', async () => {
        // Mock sudo handler to fail
        await neutronClient.execute(contractAddress, {
          integration_tests_set_sudo_failure_mock: {
            state: 'enabled',
          },
        });

        await neutronClient.waitBlocks(5);

        // Try to resubmit failure
        const failuresResBefore = await contractManagerQuerier.failures({
          address: contractAddress,
        });
        await expect(
          neutronClient.execute(contractAddress, {
            resubmit_failure: {
              failure_id: failuresResBefore.failures[0].id,
            },
          }),
        ).rejects.toThrowError();

        await neutronClient.waitBlocks(5);

        // check that failures count is the same
        const failuresResAfter = await contractManagerQuerier.failures({
          address: contractAddress,
        });
        expect(failuresResAfter.failures.length).toEqual(6);

        // make sure contract's state hasn't been changed
        const acks = await getAcks(neutronClient, contractAddress);
        expect(acks.length).toEqual(0);

        // Restore sudo handler's normal state
        await neutronClient.execute(contractAddress, {
          integration_tests_unset_sudo_failure_mock: {},
        });
        await neutronClient.waitBlocks(5);
      });

      test('successful resubmit failure', async () => {
        // Resubmit failure
        const failuresResBefore = await contractManagerQuerier.failures({
          address: contractAddress,
        });
        const failure = failuresResBefore.failures[0];
        const failureId = failure.id;
        const res = await neutronClient.execute(contractAddress, {
          resubmit_failure: {
            failure_id: Number(failureId),
          },
        });
        expect(res.code).toBe(0);

        await neutronClient.waitBlocks(5);

        // check that failures count is changed
        const failuresResAfter = await contractManagerQuerier.failures({
          address: contractAddress,
        });
        expect(failuresResAfter.failures.length).toEqual(5);

        // make sure contract's state has been changed
        const acks = await getAcks(neutronClient, contractAddress);
        expect(acks.length).toEqual(1);
        expect(acks[0].sequence_id).toEqual(
          +JSON.parse(Buffer.from(failure.sudoPayload).toString()).response
            .request.sequence,
        );
      });
    });

    describe('Unordered channel', () => {
      test('delegate with timeout does not close unordered channel', async () => {
        await cleanAckResults(neutronClient, contractAddress);
        const res = await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: unorderedIcaId,
            validator: testState.wallets.cosmos.val1.valAddress,
            amount: '100',
            denom: COSMOS_DENOM,
            timeout: 1,
          },
        });
        expect(res.code).toEqual(0);
        const sequenceId = getSequenceId(res);

        // timeout handling may be slow, hence we wait for up to 100 blocks here
        await waitForAck(
          neutronClient,
          contractAddress,
          unorderedIcaId,
          sequenceId,
          100,
        );
        const ackRes = await getAck(
          neutronClient,
          contractAddress,
          unorderedIcaId,
          sequenceId,
        );
        expect(ackRes).toMatchObject<AcknowledgementResult>({
          timeout: 'message',
        });

        const channel = (await ibcQuerier.channels({})).channels.find(
          (c) => c.ordering === Order.ORDER_UNORDERED,
        );
        expect(channel.state).toEqual(State.STATE_OPEN);
      });

      test('delegate after the timeout on unordered channel should work as channel should still be open', async () => {
        const res = await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: unorderedIcaId,
            validator: testState.wallets.cosmos.val1.valAddress,
            amount: '100',
            denom: COSMOS_DENOM,
          },
        });
        expect(res.code).toBe(0); // works as channel is still open
        const sequenceId = getSequenceId(res);
        await getAck(
          neutronClient,
          contractAddress,
          unorderedIcaId,
          sequenceId,
        );
      });

      test('try two delegates with first one when relayer is paused, so only second delegate passed through', async () => {
        // We pause hermes container, so that we can use manual relaying of the packets.
        // That needed in order to ack ibc packets in backwards order
        execSync('docker pause setup-hermes-1');

        const res1 = await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: unorderedIcaId,
            validator: testState.wallets.cosmos.val1.valAddress,
            denom: COSMOS_DENOM,
            amount: '200',
          },
        });
        expect(res1.code).toEqual(0);
        const sequenceId1 = getSequenceId(res1);

        // this should be relayed first, even thought it has a later sequence.
        const res2 = await neutronClient.execute(contractAddress, {
          delegate: {
            interchain_account_id: unorderedIcaId,
            validator: testState.wallets.cosmos.val1.valAddress,
            denom: COSMOS_DENOM,
            amount: '400',
          },
        });
        expect(res2.code).toEqual(0);
        const sequenceId2 = getSequenceId(res2);
        expect(sequenceId1).toBe(sequenceId2 - 1);

        // should be delegated 100 coins from before
        const delegationsQ1 = await gaiaStakingQuerier.DelegatorDelegations({
          delegatorAddr: unorderedIcaAddress,
        });
        expect(delegationsQ1.delegationResponses[0].balance.amount).toEqual(
          '100',
        );

        const pendingPackets = await link.getPendingPackets('A');

        // relay lastPacket
        const lastPacket = pendingPackets.find(
          (p) => p.packet.sequence === BigInt(sequenceId2),
        );
        expect(lastPacket).not.toBeNull();
        await relayPacketFromA(link, lastPacket);
        await waitForAck(
          neutronClient,
          contractAddress,
          unorderedIcaId,
          sequenceId2,
          100,
        );

        // should be delegated 100 + 400 (lastPacket) coins after relaying last packet
        const delegationsQ2 = await gaiaStakingQuerier.DelegatorDelegations({
          delegatorAddr: unorderedIcaAddress,
        });
        expect(delegationsQ2.delegationResponses[0].balance.amount).toEqual(
          '500',
        );

        // relay firstPacket
        const firstPacket = pendingPackets.find(
          (p) => p.packet.sequence === BigInt(sequenceId1),
        );
        expect(firstPacket).not.toBeNull();
        await relayPacketFromA(link, firstPacket);

        await waitForAck(
          neutronClient,
          contractAddress,
          unorderedIcaId,
          sequenceId1,
          100,
        );

        // should be delegated 100 + 400 + 200 (lastPacket + firstPacket) coins after relaying last packet
        const delegationsQ3 = await gaiaStakingQuerier.DelegatorDelegations({
          delegatorAddr: unorderedIcaAddress,
        });
        expect(delegationsQ3.delegationResponses[0].balance.amount).toEqual(
          '700',
        );

        // unpause hermes back
        execSync('docker unpause setup-hermes-1');
      });
    });
  });
});
