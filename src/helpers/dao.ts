export type ProposalModule = {
  address: string;
  prefix: string;
  status: string;
};

export type TimeLockSingleChoiceProposal = {
  id: number;
  timelock_ts: number; //  The timestamp at which the proposal was submitted to the timelock contract.
  msgs: Array<Record<string, any>>; // Vec<CosmosMsg<NeutronMsg>>
  status: string;
};

export type TimelockConfig = {
  owner: string;
  timelock_duration: number;
  subdao: string;
};

export type TimelockProposalListResponse = {
  proposals: Array<TimeLockSingleChoiceProposal>;
};
