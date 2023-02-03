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
const CI_TOKEN_ENV_NAME = 'PAT_TOKEN';

// -------------------- UTILS --------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
let verboseLog = (str) => {};

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

const wait = async (seconds) =>
  new Promise((r) => {
    setTimeout(() => r(true), 1000 * seconds);
  });

const getWithAttempts = async (getFunc, readyFunc, numAttempts = 20) => {
  let error = null;
  let data = null;
  while (numAttempts > 0) {
    numAttempts--;
    try {
      data = await getFunc();
      if (await readyFunc(data)) {
        return data;
      }
    } catch (e) {
      error = e;
    }
    await wait(10);
  }
  throw error != null
    ? error
    : new Error(
        'getWithAttempts: no attempts left. Latest get response: ' +
          (data === Object(data) ? JSON.stringify(data) : data).toString(),
      );
};

// -------------------- GIT/GITHUB --------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const triggerBuildingJob = async (repo_name, token, commit) => {
  console.log('Triggering the job unimplemented lol');
};

const getLatestCommit = async (repo_name, branch_name) => {
  const url = `${GITHUB_API_BASEURL}/repos/${NEUTRON_ORG}/${repo_name}/branches/${branch_name}`;
  verboseLog(`Getting latest commit by url:\n${url}`);
  const resp = (await axios.get(url)).data;
  return resp['commit']['sha'];
};

// -------------------- STORAGE --------------------

const getChecksumsTxt = async (
  repo_name,
  storage_addr,
  branch_name,
  ci_token,
) => {
  const url = `${STORAGE_ADDR_BASE}/${repo_name}/${branch_name}/checksums.txt`;
  verboseLog(`Getting checksums by url: ${url}`);

  try {
    return (await axios.get(url)).data;
  } catch (error) {
    console.log('No checksum file found, triggering the building job');
    await triggerBuildingJob(repo_name, ci_token, branch_name);
  }
  return await getWithAttempts(
    async () => (await axios.get(url)).data,
    (response) => response.code == 200,
    12,
  );
};

const parseChecksumsTxt = (checksums_txt) => {
  const regex = /\S+\.wasm/g;
  return checksums_txt.match(regex);
};

const downloadContracts = async (
  repo_name,
  contracts_list,
  branch_name,
  dest_dir,
) => {
  const dir_name = repo_name;
  let promises = [];
  for (const element of contracts_list) {
    const url = `${STORAGE_ADDR_BASE}/${dir_name}/${branch_name}/${element}`;
    const file_path = `${dest_dir}/${element}`;

    promises.push(downloadFile(url, file_path));
  }
  await Promise.all(promises);
};

// -------------------- MAIN --------------------

async function downloadArtifacts(repo_name, branch_name, dest_dir, ci_token) {
  console.log(`Downloading artifacts for ${repo_name} repo`);
  console.log(`Using branch ${branch_name}`);

  let latest_commit = await getLatestCommit(repo_name, branch_name);
  console.log(`Latest commit is ${latest_commit}`);

  verboseLog('Downloading checksum.txt');
  let checksums_txt = await getChecksumsTxt(
    repo_name,
    STORAGE_ADDR_BASE,
    branch_name,
    ci_token,
  );

  const contracts_list = parseChecksumsTxt(checksums_txt);

  const contracts_list_pretty = contracts_list.map((c) => `\t${c}`).join('\n');
  console.log(`Contracts to be downloaded:\n${contracts_list_pretty}`);

  await downloadContracts(repo_name, contracts_list, branch_name, dest_dir);

  console.log(`Contracts are downloaded to the "${dest_dir}" dir\n`);
}

async function main() {
  program
    .option('-b, --branch [name]', 'branch to download')
    .option(
      '-d, --dir [name]',
      'destination directory to put contracts artifacts into',
    )
    .option('-v, --verbose', 'verbose output');

  program.addArgument(
    new commander.Argument(
      '[repo...]',
      'contracts repos to download artifacts for',
    ),
  );

  program.addHelpText(
    'after',
    `
Environment vars:
  ${CI_TOKEN_ENV_NAME}\t\tCI token to trigger building if needed`,
  );

  program.parse();

  const ci_token = process.env[CI_TOKEN_ENV_NAME];

  const options = program.opts();
  const branch_name = options.branch || DEFAULT_BRANCH;
  const dest_dir = options.dir || DEFAULT_DIR;
  const repos_to_download = program.args;

  if (options.verbose) {
    verboseLog = console.log;
  }

  for (const value of repos_to_download) {
    await downloadArtifacts(value, branch_name, dest_dir, ci_token);
  }
}

main();
