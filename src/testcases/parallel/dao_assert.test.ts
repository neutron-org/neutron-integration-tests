import { inject, Suite } from 'vitest';
import { getContractsHashes } from '../../helpers/setup';
import '@neutron-org/neutronjsplus';
import { CosmosWrapper } from '@neutron-org/neutronjsplus/dist/cosmos';
import { LocalState } from '../../helpers/local_state';
import { NeutronContract } from '@neutron-org/neutronjsplus/dist/types';
import {
  DaoContracts,
  getDaoContracts,
  getNeutronDAOCore,
  VotingVaultsModule,
} from '@neutron-org/neutronjsplus/dist/dao';
import { NEUTRON_DENOM } from '@neutron-org/neutronjsplus';
import { QueryClientImpl as FeeburnerQueryClient } from '@neutron-org/neutronjs/neutron/feeburner/query.rpc.Query';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

import config from '../../config.json';

describe('Neutron / DAO check', () => {
  let testState: LocalState;
  let neutronChain: CosmosWrapper;
  let daoContracts: DaoContracts;
  let proposalSingleAddress: string;
  let preProposalSingleAddress: string;
  let proposalMultipleAddress: string;
  let preProposalMultipleAddress: string;
  let proposalOverruleAddress: string;
  let preProposalOverruleAddress: string;
  let votingModuleAddress: string;
  let votingVaultsNtrnAddress: string;
  let treasuryContract: string;
  let feeburnerQuery: FeeburnerQueryClient;

  beforeAll(async (suite: Suite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    neutronChain = new CosmosWrapper(
      NEUTRON_DENOM,
      testState.restNeutron,
      testState.rpcNeutron,
    );
    const neutronRpcClient = await testState.rpcClient('neutron');
    feeburnerQuery = new FeeburnerQueryClient(neutronRpcClient);
    const neutronClient = await CosmWasmClient.connect(testState.rpcNeutron);

    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient,
      neutronRpcClient,
    ); //add assert for some addresses
    daoContracts = await getDaoContracts(neutronClient, daoCoreAddress);
    proposalSingleAddress = daoContracts.proposals.single.address;
    preProposalSingleAddress =
      daoContracts.proposals.single.pre_propose.address;
    proposalMultipleAddress = daoContracts.proposals.multiple.address;
    preProposalMultipleAddress =
      daoContracts.proposals.multiple.pre_propose.address;
    proposalOverruleAddress = daoContracts.proposals.overrule.address;
    preProposalOverruleAddress =
      daoContracts.proposals.overrule.pre_propose.address;
    votingModuleAddress = daoContracts.voting.address;
    votingVaultsNtrnAddress = (daoContracts.voting as VotingVaultsModule).vaults
      .neutron.address;

    treasuryContract = (await feeburnerQuery.params()).params.treasuryAddress;
  });

  describe('Checking the association of proposal & preproposal modules with the Dao', () => {
    test('Proposal dao single', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        proposalSingleAddress,
      );
    });

    test('Preproposal dao single', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        preProposalSingleAddress,
      );

      const propContract = await neutronChain.queryContract(
        preProposalSingleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalSingleAddress);
    });

    test('Proposal dao multiple', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        proposalMultipleAddress,
      );
    });

    test('Preproposal dao multiple', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        preProposalMultipleAddress,
      );

      const propContract = await neutronChain.queryContract(
        preProposalMultipleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalMultipleAddress);
    });

    test('Proposal dao overrule', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        proposalOverruleAddress,
      );
    });

    test('Preproposal dao overrule', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        preProposalOverruleAddress,
      );

      const propContract = await neutronChain.queryContract(
        preProposalOverruleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalOverruleAddress);
    });
    test('Treasury is correct', async () => {
      const treasuryAddress = (await feeburnerQuery.params()).params
        .treasuryAddress;
      expect(treasuryAddress.length).toBeGreaterThan(0);
    });
  });

  describe('Checking the association of voting modules with the Dao', () => {
    test('voting module', async () => {
      await performCommonChecks(
        neutronChain,
        daoContracts,
        votingModuleAddress,
      );
    });

    test('Neutron voting vault', async () => {
      await verifyAdmin(
        neutronChain,
        votingVaultsNtrnAddress,
        daoContracts.core.address,
      );
      await verifyLabel(neutronChain, daoContracts, votingVaultsNtrnAddress);
    });

    test('Dao is the admin of himself', async () => {
      await verifyAdmin(
        neutronChain,
        daoContracts.core.address,
        daoContracts.core.address,
      );
      await verifyLabel(neutronChain, daoContracts, daoContracts.core.address);
    });
  });

  describe('Checking the validity of binary files', () => {
    test('Dao proposal single hash assert', async () => {
      await checkContractHash(
        neutronChain,
        proposalSingleAddress,
        NeutronContract.DAO_PROPOSAL_SINGLE,
      );
    });

    test('Dao proposal multiple hash assert', async () => {
      await checkContractHash(
        neutronChain,
        proposalMultipleAddress,
        NeutronContract.DAO_PROPOSAL_MULTI,
      );
    });

    test('Dao preproposal single hash assert', async () => {
      await checkContractHash(
        neutronChain,
        preProposalSingleAddress,
        NeutronContract.DAO_PREPROPOSAL_SINGLE,
      );
    });

    test('Dao preproposal multiple hash assert', async () => {
      await checkContractHash(
        neutronChain,
        preProposalMultipleAddress,
        NeutronContract.DAO_PREPROPOSAL_MULTI,
      );
    });

    test('Dao core hash assert', async () => {
      await checkContractHash(
        neutronChain,
        daoContracts.core.address,
        NeutronContract.DAO_CORE,
      );
    });

    test('Dao proposal overrule hash assert', async () => {
      await checkContractHash(
        neutronChain,
        proposalOverruleAddress,
        NeutronContract.DAO_PROPOSAL_SINGLE,
      );
    });

    test('Dao preproposal overrule hash assert', async () => {
      await checkContractHash(
        neutronChain,
        preProposalOverruleAddress,
        NeutronContract.DAO_PREPROPOSAL_OVERRULE,
      );
    });

    test('Treasury hash assert', async () => {
      await checkContractHash(
        neutronChain,
        treasuryContract,
        NeutronContract.DAO_CORE,
      );
    });
    test('Dao neutron vault hash assert', async () => {
      await checkContractHash(
        neutronChain,
        votingVaultsNtrnAddress,
        NeutronContract.NEUTRON_VAULT,
      );
    });
  });

  describe('Test subdaos', () => {
    test('Check subdaos contracts admins and labels', async () => {
      for (const subdaoIndex in daoContracts.subdaos) {
        const sudao = daoContracts.subdaos[subdaoIndex];
        const contractsList = [
          sudao.core.address,
          sudao.proposals.single.address,
          sudao.proposals.single.pre_propose.address,
          sudao.voting.address,
          // (sudao.voting as VotingCw4Module).cw4group.address, //  todo fix this
        ];
        if (
          sudao.proposals.single.pre_propose.timelock &&
          sudao.proposals.single.pre_propose.timelock.address != null // TODO: figure out where a null value come from?
        ) {
          contractsList.push(
            sudao.proposals.single.pre_propose.timelock.address,
          );
        }
        for (const contractAddress of contractsList) {
          await verifyAdmin(
            neutronChain,
            contractAddress,
            daoContracts.core.address,
          );
          await verifyLabel(neutronChain, daoContracts, contractAddress);
        }
      }
    });
  });
});

const performCommonChecks = async (
  netronChain: CosmosWrapper,
  daoContracts: DaoContracts,
  contractAddress: string,
) => {
  await checkDaoAddress(
    netronChain,
    contractAddress,
    daoContracts.core.address,
  );
  await verifyAdmin(netronChain, contractAddress, daoContracts.core.address);
  await verifyLabel(netronChain, daoContracts, contractAddress);
};

const verifyAdmin = async (
  neutronChain: CosmosWrapper,
  contractAddress: string,
  expectedAdmin: string,
) => {
  const res = await neutronChain.getContractInfo(contractAddress);
  expect(res.contract_info.admin).toEqual(expectedAdmin);
};

const checkContractHash = async (
  cm: CosmosWrapper,
  contractAddress: string,
  binaryName: string,
) => {
  const contractInfo = await cm.getContractInfo(contractAddress);
  const hashFromChain = (
    await cm.getCodeDataHash(contractInfo.contract_info.code_id)
  ).toLowerCase();
  const hashFromBinary = (await getContractsHashes())[binaryName].toLowerCase();
  expect(hashFromChain).toEqual(hashFromBinary);
};

const checkDaoAddress = async (
  cm: CosmosWrapper,
  contractAddress: string,
  expectedDao: string,
) => {
  const daoFromContract = await cm.queryContract(contractAddress, {
    dao: {},
  });
  expect(daoFromContract).toEqual(expectedDao);
};

const verifyLabel = async (
  neutronChain: CosmosWrapper,
  daoContracts: DaoContracts,
  address: string,
) => {
  const label = (await neutronChain.getContractInfo(address))['contract_info'][
    'label'
  ];
  const path = label.split('.');
  expect(path.length).toBeGreaterThan(1);
  expect(path[0]).toEqual('neutron');
  let current = daoContracts;
  for (const i of path.slice(1)) {
    current = current[i];
    expect(current).toBeDefined();
  }
  expect(current['address']).toEqual(address);
};
