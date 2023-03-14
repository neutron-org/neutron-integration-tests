const fs = require('fs');
const axios = require('axios');
const stream = require('stream');
const util = require('util');
const { program } = require('commander');
const commander = require('commander');
const yesno = require('yesno');

const finished = util.promisify(stream.finished);

// -------------------- CONSTANTS --------------------

const GITHUB_API_BASEURL = 'https://api.github.com';
const NEUTRON_ORG = 'neutron-org';
const STORAGE_ADDR_BASE =
  'https://storage.googleapis.com/neutron-contracts/neutron-org';
const DEFAULT_BRANCH = 'neutron_audit_informal_17_01_2023';
const DEFAULT_DIR = 'contracts';
const CI_TOKEN_ENV_NAME = 'PAT_TOKEN';
const DEFAULT_TIMEOUT = 15 * 60;
const DELAY_BETWEEN_TRIES = 10;
const WORKFLOW_YAML_NAME = 'build.yml';

// -------------------- GLOBAL_VARS --------------------

let REWRITE_FILES = false;

// -------------------- UTILS --------------------

// eslint-disable-next-line @typescript-eslint/no-empty-function
let verboseLog = () => {};

const downloadFile = async (fileUrl, outputLocationPath) => {
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
};

const wait = async (seconds) =>
  new Promise((r) => {
    setTimeout(() => r(true), 1000 * seconds);
  });

const getWithAttempts = async (getFunc, readyFunc, numAttempts = 20) => {
  let error = null;
  let data = null;
  const delay = DELAY_BETWEEN_TRIES;
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
    console.log(`${numAttempts * delay} seconds left`);
    await wait(delay);
  }
  throw error != null
    ? error
    : new Error(
        'getWithAttempts: no attempts left. Latest get response: ' +
          (data === Object(data) ? JSON.stringify(data) : data).toString(),
      );
};

const askForRewrite = async (file_name) => {
  const ok = await yesno({
    question: `File ${file_name} already exists, do you want to overwrite it? \
(if yes, all further differing files will be overwritten)`,
  });
  if (ok) {
    REWRITE_FILES = true;
  } else {
    throw new Error('Aborted by user');
  }
};

const checkForAlreadyDownloaded = async (contracts_list, dest_dir) => {
  for (const element of contracts_list) {
    const file_path = `${dest_dir}/${element}`;
    if (fs.existsSync(file_path)) {
      await askForRewrite(file_path);
      return;
    }
  }
};

function cliParseInt(value) {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError('Not a number.');
  }
  return parsedValue;
}

// -------------------- GIT/GITHUB --------------------

const getLatestCommit = async (repo_name, branch_name) => {
  const url = `${GITHUB_API_BASEURL}/repos/${NEUTRON_ORG}/${repo_name}/branches/${branch_name}`;
  verboseLog(`Getting latest commit by url:\n${url}`);
  try {
    const resp = (await axios.get(url)).data;
    return resp['commit']['sha'];
  } catch (e) {
    throw new Error(
      `Branch ${branch_name} not exist in ${repo_name} repo. Internal error: ${e.toString()}`,
    );
  }
};

const triggerContractsBuilding = async (repo_name, commit_hash, ci_token) => {
  if (!ci_token) {
    console.log(`No ${CI_TOKEN_ENV_NAME} provided`);
    throw new Error("CI token isn't provided, can't trigger the build");
  }

  const workflow_id = await getBuildWorkflowId(repo_name);
  verboseLog(`Using workflow id ${workflow_id}`);
  const url = `${GITHUB_API_BASEURL}/repos/${NEUTRON_ORG}/${repo_name}/actions/workflows/${workflow_id}/dispatches`;
  let resp = null;
  try {
    resp = await axios.post(
      url,
      {
        ref: 'main',
        inputs: {
          branch: commit_hash,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ci_token}`,
        },
      },
    );
  } catch (e) {
    if (e.response.status === 401) {
      throw new Error(
        `GitHub unauthorized error, probably wrong ${CI_TOKEN_ENV_NAME}.\n\
Make sure ${CI_TOKEN_ENV_NAME} is correct and isn't expired.`,
      );
    }
    throw e;
  }
  if (resp.status !== 204) {
    throw new Error('Wrong return code');
  }
};

const getBuildWorkflowId = async (repo_name) => {
  const url = `${GITHUB_API_BASEURL}/repos/${NEUTRON_ORG}/${repo_name}/actions/workflows`;
  const resp = (await axios.get(url)).data;
  const build_yml_workflow = resp['workflows'].find((x) =>
    x['path'].includes(WORKFLOW_YAML_NAME),
  );
  if (!build_yml_workflow) {
    throw new Error(`Repo ${repo_name} has no ${WORKFLOW_YAML_NAME} workflow.`);
  }
  return build_yml_workflow['id'];
};

const normalizeCommitHash = async (repo_name, commit_hash) => {
  const url = `${GITHUB_API_BASEURL}/repos/${NEUTRON_ORG}/${repo_name}/commits/${commit_hash}`;
  let resp = null;
  try {
    resp = await axios.get(url);
  } catch (e) {
    throw new Error(
      `Provided commit (${commit_hash}) doesn't exist in ${repo_name} repo. Internal error:\n${e.toString()}`,
    );
  }
  if (resp.status !== 200) {
    throw new Error(
      `Provided commit (${commit_hash}) doesn't exist in ${repo_name} repo`,
    );
  }
  return resp.data['sha'];
};

const isRepoExists = async (repo_name) => {
  const url = `${GITHUB_API_BASEURL}/repos/${NEUTRON_ORG}/${repo_name}`;
  try {
    await axios.get(url);
  } catch (e) {
    return false;
  }
  return true;
};

// -------------------- STORAGE --------------------

const getChecksumsTxt = async (repo_name, commit_hash, ci_token, timeout) => {
  const url = `${STORAGE_ADDR_BASE}/${repo_name}/${commit_hash}/checksums.txt`;
  verboseLog(`Getting checksums by url: ${url}`);

  try {
    return (await axios.get(url)).data;
  } catch (error) {
    console.log('No checksum file found, launching the building workflow');
    await triggerContractsBuilding(repo_name, commit_hash, ci_token);
    const actions_link = `https://github.com/${NEUTRON_ORG}/${repo_name}/actions`;
    console.log(
      `Workflow launched, you follow the link to ensure: ${actions_link}`,
    );

    const attempts_number = timeout / DELAY_BETWEEN_TRIES;
    try {
      return (
        await getWithAttempts(
          async () => axios.get(url),
          async (response) => response.status === 200,
          attempts_number,
        )
      ).data;
    } catch (e) {
      throw new Error(
        `Cannot get artifacts even after workflow run, might be a workflow issue or timeout is too low. \
Internal error: ${e.toString()}`,
      );
    }
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

const downloadArtifacts = async (
  repo_name,
  branch_name,
  commit_hash,
  dest_dir,
  ci_token,
  timeout,
) => {
  if (!(await isRepoExists(repo_name))) {
    console.log(`Repo ${repo_name} doesn't exist, exiting.`);
    return;
  }

  console.log(`Downloading artifacts for ${repo_name} repo`);

  if (commit_hash) {
    try {
      commit_hash = await normalizeCommitHash(repo_name, commit_hash);
    } catch (e) {
      console.log(`Error during commit hash validation:\n${e.toString()}`);
      return;
    }
    console.log(`Using specified commit: ${commit_hash}`);
  } else {
    try {
      commit_hash = await getLatestCommit(repo_name, branch_name);
    } catch (e) {
      console.log(
        `Error during getting commit for branch ${branch_name}:\n${e.toString()}`,
      );
      return;
    }
    console.log(`Using branch ${branch_name}`);
    console.log(`The latest commit is: ${commit_hash}`);
  }

  verboseLog('Downloading checksum.txt');
  let checksums_txt = null;
  try {
    checksums_txt = await getChecksumsTxt(
      repo_name,
      commit_hash,
      ci_token,
      timeout,
    );
  } catch (e) {
    console.log(`Error during getting artifacts: ${e.toString()}`);
    return;
  }

  if (!checksums_txt) {
    console.log('Checksum file received but empty, exiting.');
    return;
  }

  const contracts_list = parseChecksumsTxt(checksums_txt);

  const contracts_list_pretty = contracts_list.map((c) => `\t${c}`).join('\n');
  console.log(`Contracts to be downloaded:\n${contracts_list_pretty}`);

  if (!REWRITE_FILES) {
    try {
      await checkForAlreadyDownloaded(contracts_list, dest_dir);
    } catch (e) {
      console.log(e.toString());
      return;
    }
  }

  await downloadContracts(repo_name, contracts_list, commit_hash, dest_dir);

  console.log(`Contracts are downloaded to the "${dest_dir}" dir\n`);
};

const initCli = () => {
  program
    .option('-b, --branch [name]', 'branch to download')
    .option('-c, --commit [hash]', 'commit to download')
    .option('-f, --force', 'rewrite files without asking')
    .option(
      '-t, --timeout [seconds]',
      'time to wait for workflow to finish',
      cliParseInt,
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

  program.addHelpText(
    'after',
    `
Environment vars:
  ${CI_TOKEN_ENV_NAME}\t\tCI token to trigger building if needed`,
  );
};

const main = async () => {
  initCli();

  program.parse();

  const ci_token = process.env[CI_TOKEN_ENV_NAME];

  const options = program.opts();
  const dest_dir = options.dir || DEFAULT_DIR;
  if (!fs.existsSync(dest_dir)) {
    console.log(`Directory ${dest_dir} not found, exiting.`);
    return;
  }
  if (!fs.lstatSync(dest_dir).isDirectory()) {
    console.log(`${dest_dir} is not directory, exiting.`);
    return;
  }
  const repos_to_download = program.args;

  let branch_name = options.branch;
  const commit_hash = options.commit;
  if (branch_name && commit_hash) {
    console.log(
      'Both branch and commit hash are specified, exiting. \
Please specify only a single thing.',
    );
    return;
  }
  if (!branch_name && !commit_hash) {
    branch_name = DEFAULT_BRANCH;
  }

  const timeout = options.timeout || DEFAULT_TIMEOUT;

  if (options.verbose) {
    verboseLog = console.log;
  }

  if (options.force) {
    REWRITE_FILES = true;
  }

  for (const repo of repos_to_download) {
    await downloadArtifacts(
      repo,
      branch_name,
      commit_hash,
      dest_dir,
      ci_token,
      timeout,
    );
  }
};

main().then();
