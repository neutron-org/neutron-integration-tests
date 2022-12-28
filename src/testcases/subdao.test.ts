import {
  CosmosWrapper,
  NeutronContract,
  NEUTRON_DENOM,
} from '../helpers/cosmos';
import { TestStateLocalCosmosTestNet } from './common_localcosmosnet';
import { AccAddress, ValAddress } from '@cosmos-client/core/cjs/types';
import { Wallet } from '../types';

describe('Neutron / Subdao', () => {
  let cm;
  let main_dao_wallet;
  let security_dao_wallet;
  let subdao_member_wallet;
  let main_dao_addr;
  let security_dao_addr;
  let subdao_member_addr;
  beforeAll(async () => {
    let testState = new TestStateLocalCosmosTestNet();
    await testState.init();
    cm = new CosmosWrapper(
      testState.sdk1,
      testState.wallets.neutron.demo1,
      NEUTRON_DENOM,
    );
    main_dao_wallet = testState.wallets.neutron.demo1;
    security_dao_wallet = testState.wallets.neutron.icq;
    subdao_member_wallet = testState.wallets.neutron.demo2;
    main_dao_addr = main_dao_wallet.address;
    security_dao_addr = security_dao_wallet.address;
    subdao_member_addr = subdao_member_wallet.address;
  });

  describe('execution control', () => {
    test('instantiate', async () => {
      const timelock = await prepareTimelock(cm, 20, main_dao_addr.toString());
      const prePropose = await preparePrePropose(
        cm,
        NEUTRON_DENOM,
        10,
        timelock.code_id,
        Buffer.from(timelock.instantiate_msg).toString('base64'),
      );
      const proposal = await prepareProposal(
        cm,
        prePropose.code_id,
        Buffer.from(prePropose.instantiate_msg).toString('base64'),
      );
      const voting = await prepareCW4Voting(cm, [
        { addr: subdao_member_addr.toString(), weight: 1 },
      ]);
      const subdao = await instantiateSubdaoCode(
        cm,
        security_dao_addr.toString(),
        voting.code_id,
        Buffer.from(voting.instantiate_msg).toString('base64'),
        proposal.code_id,
        Buffer.from(proposal.instantiate_msg).toString('base64'),
      );
      console.log('subdao addr:', subdao);
    });
  });
});

const instantiateSubdaoCode = async (
  cm,
  security_dao_addr: string,
  voting_code_id: string,
  voting_inst_msg: string,
  proposal_code_id: string,
  proposal_inst_msg: string,
) => {
  const codeId = await cm.storeWasm(NeutronContract.SUBDAO_CORE);
  return cm.instantiate(
    codeId,
    JSON.stringify({
      name: 'subdao',
      description: 'Neutron subDAO',
      initial_items: null,
      vote_module_instantiate_info: {
        code_id: voting_code_id,
        label: 'subdao voting',
        msg: voting_inst_msg,
      },
      proposal_modules_instantiate_info: [
        {
          code_id: proposal_code_id,
          label: 'subdao proposal',
          msg: proposal_inst_msg,
        },
      ],
      security_dao: security_dao_addr,
    }),
    'subdao core',
  );
};

const prepareTimelock = async (
  cm,
  duration: number,
  owner: string,
): Promise<ContractInstKit> => {
  const codeId = await cm.storeWasm(NeutronContract.SUBDAO_TIMELOCK);
  const instMsg = JSON.stringify({
    timelock_duration: duration,
    owner: owner,
  });
  const kit: ContractInstKit = {
    code_id: codeId,
    instantiate_msg: instMsg,
  };
  return kit;
};

const preparePrePropose = async (
  cm,
  deposit_denom: string,
  deposit_amount: number,
  timelock_code_id: string,
  timelock_inst_msg: string,
): Promise<ContractInstKit> => {
  const codeId = await cm.storeWasm(NeutronContract.SUBDAO_PREPROPOSE);
  const instMsg = JSON.stringify({
    deposit_info: {
      denom: {
        token: {
          denom: {
            native: deposit_denom,
          },
        },
      },
      amount: deposit_amount.toString(),
      refund_policy: 'always',
    },
    open_proposal_submission: false,
    timelock_module_instantiate_info: {
      code_id: timelock_code_id,
      label: 'subdao timelock',
      msg: timelock_inst_msg,
    },
  });
  const kit: ContractInstKit = {
    code_id: codeId,
    instantiate_msg: instMsg,
  };
  return kit;
};

const prepareProposal = async (
  cm,
  pre_propose_code_id: string,
  pre_propose_inst_msg: string,
): Promise<ContractInstKit> => {
  const codeId = await cm.storeWasm(NeutronContract.SUBDAO_PROPOSAL);
  const instMsg = JSON.stringify({
    threshold: {
      absolute_count: {
        threshold: '1',
      },
    },
    max_voting_period: {
      time: 60,
    },
    allow_revoting: false,
    close_proposal_on_execution_failure: true,
    pre_propose_info: {
      ModuleMayPropose: {
        info: {
          code_id: pre_propose_code_id,
          label: 'subdao prepropose',
          msg: pre_propose_inst_msg,
        },
      },
    },
  });
  const kit: ContractInstKit = {
    code_id: codeId,
    instantiate_msg: instMsg,
  };
  return kit;
};

const prepareCW4Voting = async (
  cm,
  members: CW4Member[],
): Promise<ContractInstKit> => {
  const cw4GroupCodeId = await cm.storeWasm(NeutronContract.CW4_GROUP);
  const cw4VotingCodeId = await cm.storeWasm(NeutronContract.CW4_VOTING);
  const instMsg = JSON.stringify({
    cw4_group_code_id: cw4GroupCodeId,
    initial_members: members,
  });
  const kit: ContractInstKit = {
    code_id: cw4VotingCodeId,
    instantiate_msg: instMsg,
  };
  return kit;
};

type ContractInstKit = {
  code_id: string;
  instantiate_msg: string;
};

type CW4Member = {
  addr: string;
  weight: number;
};
