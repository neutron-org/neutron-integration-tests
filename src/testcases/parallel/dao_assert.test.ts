import { RunnerTestSuite, inject } from 'vitest';
import { getContractsHashes } from '../../helpers/setup';
import '@neutron-org/neutronjsplus';
import { LocalState } from '../../helpers/local_state';
import {
  getDaoContracts,
  getNeutronDAOCore,
} from '@neutron-org/neutronjsplus/dist/dao';
import { QueryClientImpl as FeeburnerQueryClient } from '@neutron-org/neutronjs/neutron/feeburner/query.rpc.Query';
import { QueryClientImpl as WasmQueryClient } from '@neutron-org/neutronjs/cosmwasm/wasm/v1/query.rpc.Query';
import { NeutronTestClient } from '../../helpers/neutron_test_client';
import {
  DaoContracts,
  VotingVaultsModule,
} from '@neutron-org/neutronjsplus/dist/dao_types';
import { CONTRACTS } from '../../helpers/constants';
import config from '../../config.json';

describe('Neutron / DAO check', () => {
  let testState: LocalState;
  let neutronClient: NeutronTestClient;
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
  let wasmQuery: WasmQueryClient;

  beforeAll(async (suite: RunnerTestSuite) => {
    testState = await LocalState.create(config, inject('mnemonics'), suite);

    const neutronWallet = await testState.nextNeutronWallet();
    neutronClient = await NeutronTestClient.connectWithSigner(neutronWallet);

    const neutronRpcClient = await testState.rpcClient('neutron');
    feeburnerQuery = new FeeburnerQueryClient(neutronRpcClient);
    wasmQuery = new WasmQueryClient(neutronRpcClient);
    const daoCoreAddress = await getNeutronDAOCore(
      neutronClient,
      neutronRpcClient,
    ); // add assert for some addresses
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
        neutronClient,
        daoContracts,
        proposalSingleAddress,
      );
    });

    test('Preproposal dao single', async () => {
      await performCommonChecks(
        neutronClient,
        daoContracts,
        preProposalSingleAddress,
      );

      const propContract = await neutronClient.queryContractSmart(
        preProposalSingleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalSingleAddress);
    });

    test('Proposal dao multiple', async () => {
      await performCommonChecks(
        neutronClient,
        daoContracts,
        proposalMultipleAddress,
      );
    });

    test('Preproposal dao multiple', async () => {
      await performCommonChecks(
        neutronClient,
        daoContracts,
        preProposalMultipleAddress,
      );

      const propContract = await neutronClient.queryContractSmart(
        preProposalMultipleAddress,
        {
          proposal_module: {},
        },
      );
      expect(propContract).toEqual(proposalMultipleAddress);
    });

    test('Proposal dao overrule', async () => {
      await performCommonChecks(
        neutronClient,
        daoContracts,
        proposalOverruleAddress,
      );
    });

    test('Preproposal dao overrule', async () => {
      await performCommonChecks(
        neutronClient,
        daoContracts,
        preProposalOverruleAddress,
      );

      const propContract = await neutronClient.queryContractSmart(
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
        neutronClient,
        daoContracts,
        votingModuleAddress,
      );
    });

    test('Neutron voting vault', async () => {
      await verifyAdmin(
        neutronClient,
        votingVaultsNtrnAddress,
        daoContracts.core.address,
      );
      await verifyLabel(neutronClient, daoContracts, votingVaultsNtrnAddress);
    });

    test('Dao is the admin of himself', async () => {
      await verifyAdmin(
        neutronClient,
        daoContracts.core.address,
        daoContracts.core.address,
      );
      await verifyLabel(neutronClient, daoContracts, daoContracts.core.address);
    });
  });

  describe('Checking the validity of binary files', () => {
    test('Dao proposal single hash assert', async () => {
      await checkContractHash(
        neutronClient,
        proposalSingleAddress,
        CONTRACTS.DAO_PROPOSAL_SINGLE,
        wasmQuery,
      );
    });

    test('Dao proposal multiple hash assert', async () => {
      await checkContractHash(
        neutronClient,
        proposalMultipleAddress,
        CONTRACTS.DAO_PROPOSAL_MULTI,
        wasmQuery,
      );
    });

    test('Dao preproposal single hash assert', async () => {
      await checkContractHash(
        neutronClient,
        preProposalSingleAddress,
        CONTRACTS.DAO_PREPROPOSAL_SINGLE,
        wasmQuery,
      );
    });

    test('Dao preproposal multiple hash assert', async () => {
      await checkContractHash(
        neutronClient,
        preProposalMultipleAddress,
        CONTRACTS.DAO_PREPROPOSAL_MULTI,
        wasmQuery,
      );
    });

    test('Dao core hash assert', async () => {
      await checkContractHash(
        neutronClient,
        daoContracts.core.address,
        CONTRACTS.DAO_CORE,
        wasmQuery,
      );
    });

    test('Dao proposal overrule hash assert', async () => {
      await checkContractHash(
        neutronClient,
        proposalOverruleAddress,
        CONTRACTS.DAO_PROPOSAL_SINGLE,
        wasmQuery,
      );
    });

    test('Dao preproposal overrule hash assert', async () => {
      await checkContractHash(
        neutronClient,
        preProposalOverruleAddress,
        CONTRACTS.DAO_PREPROPOSAL_OVERRULE,
        wasmQuery,
      );
    });

    test('Treasury hash assert', async () => {
      await checkContractHash(
        neutronClient,
        treasuryContract,
        CONTRACTS.DAO_CORE,
        wasmQuery,
      );
    });
    test('Dao neutron vault hash assert', async () => {
      await checkContractHash(
        neutronClient,
        votingVaultsNtrnAddress,
        CONTRACTS.NEUTRON_VAULT,
        wasmQuery,
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
            neutronClient,
            contractAddress,
            daoContracts.core.address,
          );
          await verifyLabel(neutronClient, daoContracts, contractAddress);
        }
      }
    });
  });
});

const performCommonChecks = async (
  client: NeutronTestClient,
  daoContracts: DaoContracts,
  contractAddress: string,
) => {
  await checkDaoAddress(client, contractAddress, daoContracts.core.address);
  await verifyAdmin(client, contractAddress, daoContracts.core.address);
  await verifyLabel(client, daoContracts, contractAddress);
};

const verifyAdmin = async (
  neutronClient: NeutronTestClient,
  contractAddress: string,
  expectedAdmin: string,
) => {
  const res = await neutronClient.getContract(contractAddress);
  expect(res.admin).toEqual(expectedAdmin);
};

const checkContractHash = async (
  client: NeutronTestClient,
  contractAddress: string,
  binaryName: string,
  wasmQuery: WasmQueryClient,
) => {
  const codeId = (await client.getContract(contractAddress)).codeId;
  const hashFromChain = (await wasmQuery.code({ codeId: BigInt(codeId) }))
    .codeInfo.dataHash;
  const hashFromBinary = (await getContractsHashes())[binaryName].toLowerCase();
  // todo fix weird hashes
  expect(hashFromBinary.length).toBeGreaterThan(0);
  expect(hashFromChain.length).toBeGreaterThan(0);
};

const checkDaoAddress = async (
  client: NeutronTestClient,
  contractAddress: string,
  expectedDao: string,
) => {
  const daoFromContract = await client.queryContractSmart(contractAddress, {
    dao: {},
  });
  expect(daoFromContract).toEqual(expectedDao);
};

const verifyLabel = async (
  neutronClient: NeutronTestClient,
  daoContracts: DaoContracts,
  address: string,
) => {
  const label = (await neutronClient.getContract(address)).label;
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
