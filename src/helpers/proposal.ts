export type ParamChangeProposalInfo = {
  title: string;
  description: string;
  subspace: string;
  key: string;
  value: string;
};

export type PinCodesInfo = {
  title: string;
  description: string;
  codes_ids: number[];
};

export type UpdateAdmin = {
  title: string;
  description: string;
  contract: string;
  new_admin: string;
};

export type ClearAdmin = {
  title: string;
  description: string;
  contract: string;
};

export type ClientUpdateInfo = {
  title: string;
  description: string;
  subject_client_id: string;
  substitute_client_id;
};

export type UpgradeInfo = {
  title: string;
  description: string;
  name: string;
  height: number;
  info: string;
  upgraded_client_state: string;
};

export type SendProposalInfo = {
  to: string;
  denom: string;
  amount: string;
};

export type MultiChoiceProposal = {
  readonly title: string;
  readonly description: string;
  // The address that created this proposal.
  readonly proposer: string;
  // The block height at which this proposal was created. Voting
  // power queries should query for voting power at this block
  // height.
  readonly start_height: number;
  // The minimum amount of time this proposal must remain open for
  // voting. The proposal may not pass unless this is expired or
  // None.
  readonly min_voting_period: {
    at_height: number;
    at_time: number;
    never: any;
  };
  // The the time at which this proposal will expire and close for
  // additional votes.
  readonly expiration: {
    at_height: number;
    at_time: number;
    never: any;
  };
  // The options to be chosen from in the vote.
  readonly choices: CheckedMultipleChoiceOption[];
  // Proposal status (Open, rejected, executed, execution failed, closed, passed)
  readonly status:
    | 'open'
    | 'rejected'
    | 'passed'
    | 'executed'
    | 'closed'
    | 'execution_failed';
  // Voting settings (threshold, quorum, etc.)
  readonly voting_strategy: VotingStrategy;
  // The total power when the proposal started (used to calculate percentages)
  readonly total_power: string;
  // The vote tally.
  readonly votes: MultipleChoiceVotes;
  // Whether DAO members are allowed to change their votes.
  // When disabled, proposals can be executed as soon as they pass.
  // When enabled, proposals can only be executed after the voting
  // period has ended and the proposal passed.
  readonly allow_revoting: boolean;
};

export type CheckedMultipleChoiceOption = {
  readonly index: number;
  readonly option_type: MultipleChoiceOptionType;
  readonly description: string;
  // readonly msgs: Option<Vec<CosmosMsg<NeutronMsg>>>,
  readonly vote_count: string;
};

export type VotingStrategy = {
  single_choice: {
    quorum: {
      majority: any;
      percent: string;
    };
  };
};

export type MultipleChoiceVotes = {
  vote_weights: string[];
};

// 'none' is a choice that represents selecting none of the options; still counts toward quorum
// and allows proposals with all bad options to be voted against.
export type MultipleChoiceOptionType = 'none' | 'standard';

export const paramChangeProposal = (info: ParamChangeProposalInfo): any => ({
  custom: {
    submit_admin_proposal: {
      admin_proposal: {
        param_change_proposal: {
          title: info.title,
          description: info.description,
          param_changes: [
            {
              subspace: info.subspace,
              key: info.key,
              value: info.value,
            },
          ],
        },
      },
    },
  },
});

export const pinCodesProposal = (info: PinCodesInfo): any => ({
  custom: {
    submit_admin_proposal: {
      admin_proposal: {
        pin_codes_proposal: {
          title: info.title,
          description: info.description,
          code_ids: info.codes_ids,
        },
      },
    },
  },
});

export const unpinCodesProposal = (info: PinCodesInfo): any => ({
  custom: {
    submit_admin_proposal: {
      admin_proposal: {
        unpin_codes_proposal: {
          title: info.title,
          description: info.description,
          code_ids: info.codes_ids,
        },
      },
    },
  },
});

export const updateAdminProposal = (info: UpdateAdmin): any => ({
  custom: {
    submit_admin_proposal: {
      admin_proposal: {
        update_admin_proposal: {
          title: info.title,
          description: info.description,
          contract: info.contract,
          new_admin: info.new_admin,
        },
      },
    },
  },
});

export const clearAdminProposal = (info: ClearAdmin): any => ({
  custom: {
    submit_admin_proposal: {
      admin_proposal: {
        clear_admin_proposal: {
          title: info.title,
          description: info.description,
          contract: info.contract,
        },
      },
    },
  },
});

export const clientUpdateProposal = (info: ClientUpdateInfo): any => ({
  custom: {
    submit_admin_proposal: {
      admin_proposal: {
        client_update_proposal: {
          title: info.title,
          description: info.description,
          subject_client_id: info.subject_client_id,
          substitute_client_id: info.substitute_client_id,
        },
      },
    },
  },
});

export const upgradeProposal = (info: UpgradeInfo): any => ({
  custom: {
    submit_admin_proposal: {
      admin_proposal: {
        upgrade_proposal: {
          title: info.title,
          description: info.description,
          plan: {
            name: info.name,
            height: info.height,
            info: info.info,
          },
          upgraded_client_state: info.upgraded_client_state,
        },
      },
    },
  },
});

export const addSubdaoProposal = (
  mainDaoCoreAddress: string,
  subdaoCoreAddress: string,
): any => ({
  wasm: {
    execute: {
      contract_addr: mainDaoCoreAddress,
      msg: Buffer.from(
        JSON.stringify({
          update_sub_daos: {
            to_add: [
              {
                addr: subdaoCoreAddress,
              },
            ],
            to_remove: [],
          },
        }),
      ).toString('base64'),
      funds: [],
    },
  },
});

export const sendProposal = (info: SendProposalInfo): any => ({
  bank: {
    send: {
      to_address: info.to,
      amount: [
        {
          denom: info.denom,
          amount: info.amount,
        },
      ],
    },
  },
});

export const addSchedule = (
  name: string,
  period: number,
  msgs: string[],
): any => ({
  custom: {
    add_schedule: {
      name,
      period,
      msgs,
    },
  },
});

export const removeSchedule = (name: string): any => ({
  custom: {
    remove_schedule: {
      name,
    },
  },
});
