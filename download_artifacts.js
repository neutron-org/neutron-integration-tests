const fs = require('fs');
const axios = require('axios');
const stream = require('stream');
const util = require('util');
const { program } = require('commander');
const commander = require('commander');

const finished = util.promisify(stream.finished);

// -------------------- CONSTANTS --------------------

const GITHUB_API_BASEURL = 'https://api.github.com';
const NEUTRON_ORG = 'neutron-org';
const STORAGE_ADDR_BASE =
  'https://storage.googleapis.com/neutron-contracts/neutron-org';
const DEFAULT_BRANCH = 'neutron_audit_informal_17_01_2023';
const DEFAULT_DIR = 'contracts';

// -------------------- UTILS --------------------

// eslint-disable-next-line @typescript-eslint/no-empty-function
let verboseLog = () => {};

async function downloadFile(fileUrl, outputLocationPath) {
  verboseLog(`Downloading file by url: ${fileUrl}`);
  const writer = fs.createWriteStream(outputLocationPath);
  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then((response) => {
    response.data.pipe(writer);
    return finished(writer);
  });
}

// -------------------- GIT/GITHUB --------------------

const getLatestCommit = async (repo_name, branch_name) => {
  const url = `${GITHUB_API_BASEURL}/repos/${NEUTRON_ORG}/${repo_name}/branches/${branch_name}`;
  verboseLog(`Getting latest commit by url:\n${url}`);
  const resp = (await axios.get(url)).data;
  return resp['commit']['sha'];
};

// -------------------- STORAGE --------------------

const getChecksumsTxt = async (repo_name, branch_name, commit_hash) => {
  const url = `${STORAGE_ADDR_BASE}/${repo_name}/${commit_hash}/checksums.txt`;
  verboseLog(`Getting checksums by url: ${url}`);

  try {
    return (await axios.get(url)).data;
  } catch (error) {
    console.log('No checksum file found, exiting');
    console.log(`Please go to https://github.com/neutron-org/${repo_name}/actions/workflows/build.yml \
and run the workflow for ${branch_name} branch manually`);
  }
};

const parseChecksumsTxt = (checksums_txt) => {
  const regex = /\S+\.wasm/g;
  return checksums_txt.match(regex);
};

const downloadContracts = async (
  repo_name,
  contracts_list,
  commit_hash,
  dest_dir,
) => {
  const dir_name = repo_name;
  let promises = [];
  for (const element of contracts_list) {
    const url = `${STORAGE_ADDR_BASE}/${dir_name}/${commit_hash}/${element}`;
    const file_path = `${dest_dir}/${element}`;

    promises.push(downloadFile(url, file_path));
  }
  await Promise.all(promises);
};

// -------------------- MAIN --------------------

async function downloadArtifacts(repo_name, specified_branch, dest_dir) {
  console.log(`Downloading artifacts for ${repo_name} repo`);

  let commit;
  let branch_name;
  if (specified_branch.includes(':')) {
    branch_name = specified_branch.split(':')[0];
    commit = specified_branch.split(':')[1];
    console.log(`Using branch ${branch_name}`);
    console.log(`Using specified commit: ${commit}`);
  } else {
    branch_name = specified_branch;
    commit = await getLatestCommit(repo_name, branch_name);
    console.log(`Using branch ${branch_name}`);
    console.log(`Using the latest commit: ${commit}`);
  }

  verboseLog('Downloading checksum.txt');
  const checksums_txt = await getChecksumsTxt(repo_name, branch_name, commit);

  if (!checksums_txt) {
    console.log('Respective checksum.txt is not found in storage');
    return;
  }

  const contracts_list = parseChecksumsTxt(checksums_txt);

  const contracts_list_pretty = contracts_list.map((c) => `\t${c}`).join('\n');
  console.log(`Contracts to be downloaded:\n${contracts_list_pretty}`);

  await downloadContracts(repo_name, contracts_list, commit, dest_dir);

  console.log(`Contracts are downloaded to the "${dest_dir}" dir\n`);
}

async function main() {
  program
    .option(
      '-b, --branch [name]',
      'branch to download. You can also specify the commit, e.g. main:5848eeab5992bb4080dff24009a7ef758d9ce899',
    )
    .option(
      '-d, --dir [name]',
      'destination directory to put contracts artifacts into',
    )
    .option('-v, --verbose', 'verbose output');

  program.addArgument(
    new commander.Argument(
      '<repo...>',
      'contracts repos to download artifacts for',
    ),
  );

  program.parse();

  const options = program.opts();
  const branch_name = options.branch || DEFAULT_BRANCH;
  const dest_dir = options.dir || DEFAULT_DIR;
  const repos_to_download = program.args;

  if (options.verbose) {
    verboseLog = console.log;
  }

  for (const value of repos_to_download) {
    await downloadArtifacts(value, branch_name, dest_dir);
  }
}

main().then();
