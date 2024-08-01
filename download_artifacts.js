const fs = require('fs');
const crypto = require('crypto');
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
const DEFAULT_BRANCH = 'main';
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

const downloadFile = async (
  fileUrl,
  outputLocationPath,
  checksum,
  attempt = 0,
) => {
  verboseLog(`Downloading file by url: ${fileUrl}`);
  const writer = fs.createWriteStream(outputLocationPath);
  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then(async (response) => {
    response.data.pipe(writer);
    await finished(writer);

    const data = fs.readFileSync(outputLocationPath);
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    if (hash !== checksum) {
      attempt++;
      console.log(
        `checksum mismatch for file ${outputLocationPath}, retrying (attempt ${attempt})...
        \texpected: ${checksum}
        \treceived: ${hash}\n`,
      );
      await new Promise((r) => setTimeout(r, 1000));
      return downloadFile(fileUrl, outputLocationPath, checksum, attempt);
    }
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

const askForRewrite = async (fileName) => {
  const ok = await yesno({
    question: `File ${fileName} already exists, do you want to overwrite it? \
(if yes, all further differing files will be overwritten)`,
  });
  if (ok) {
    REWRITE_FILES = true;
  } else {
    throw new Error('Aborted by user');
  }
};

const checkForAlreadyDownloaded = async (contractsList, destDir) => {
  for (const element of contractsList) {
    const filePath = `${destDir}/${element}`;
    if (fs.existsSync(filePath)) {
      await askForRewrite(filePath);
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

const getLatestCommit = async (repoName, branchName) => {
  const url = `${GITHUB_API_BASEURL}/repos/${NEUTRON_ORG}/${repoName}/branches/${branchName}`;
  verboseLog(`Getting latest commit by url:\n${url}`);
  try {
    const resp = (await axios.get(url)).data;
    return resp['commit']['sha'];
  } catch (e) {
    throw new Error(
      `Branch ${branchName} not exist in ${repoName} repo. Request failed with an error: ${e.toString()}`,
    );
  }
};

const triggerContractsBuilding = async (repoName, commitHash, ciToken) => {
  if (!ciToken) {
    console.log(
      `No ${CI_TOKEN_ENV_NAME} provided. Please provide one or run the workflow manually here: \
https://github.com/neutron-org/${repoName}/actions/workflows/${WORKFLOW_YAML_NAME}`,
    );
    throw new Error("CI token isn't provided, can't trigger the build");
  }

  const workflowId = await getBuildWorkflowId(repoName);
  verboseLog(`Using workflow id ${workflowId}`);
  const url = `${GITHUB_API_BASEURL}/repos/${NEUTRON_ORG}/${repoName}/actions/workflows/${workflowId}/dispatches`;
  let resp = null;
  try {
    resp = await axios.post(
      url,
      {
        ref: 'main',
        inputs: {
          branch: commitHash,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ciToken}`,
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

const getBuildWorkflowId = async (repoName) => {
  const url = `${GITHUB_API_BASEURL}/repos/${NEUTRON_ORG}/${repoName}/actions/workflows`;
  const resp = (await axios.get(url)).data;
  const buildYmlWorkflow = resp['workflows'].find((x) =>
    x['path'].includes(WORKFLOW_YAML_NAME),
  );
  if (!buildYmlWorkflow) {
    throw new Error(`Repo ${repoName} has no ${WORKFLOW_YAML_NAME} workflow.`);
  }
  return buildYmlWorkflow['id'];
};

const normalizeCommitHash = async (repoName, commitHash) => {
  const url = `${GITHUB_API_BASEURL}/repos/${NEUTRON_ORG}/${repoName}/commits/${commitHash}`;
  let resp = null;
  try {
    resp = await axios.get(url);
  } catch (e) {
    throw new Error(
      `Provided commit (${commitHash}) doesn't exist in ${repoName} repo. Request failed with an error:\n${e.toString()}`,
    );
  }
  if (resp.status !== 200) {
    throw new Error(
      `Provided commit (${commitHash}) doesn't exist in ${repoName} repo`,
    );
  }
  return resp.data['sha'];
};

const isRepoExists = async (repoName) => {
  const url = `${GITHUB_API_BASEURL}/repos/${NEUTRON_ORG}/${repoName}`;
  try {
    await axios.get(url);
  } catch (e) {
    return false;
  }
  return true;
};

// -------------------- STORAGE --------------------

const getChecksumsTxt = async (repoName, commitHash, ciToken, timeout) => {
  const url = `${STORAGE_ADDR_BASE}/${repoName}/${commitHash}/checksums.txt`;
  verboseLog(`Getting checksums by url: ${url}`);

  try {
    return (await axios.get(url)).data;
  } catch (error) {
    console.log('No checksum file found, launching the building workflow');
    await triggerContractsBuilding(repoName, commitHash, ciToken);
    const actionsLink = `https://github.com/${NEUTRON_ORG}/${repoName}/actions`;
    console.log(
      `Workflow launched, you follow the link to ensure: ${actionsLink}`,
    );

    const attemptsNumber = timeout / DELAY_BETWEEN_TRIES;
    try {
      return (
        await getWithAttempts(
          async () => axios.get(url),
          async (response) => response.status === 200,
          attemptsNumber,
        )
      ).data;
    } catch (e) {
      throw new Error(
        `Cannot get artifacts even after workflow run, might be a workflow issue or timeout is too low. \
Request failed with an error: ${e.toString()}`,
      );
    }
  }
};

const parseChecksumsTxt = (checksumsTxt) => {
  const regex = /(\S+)\s+(\S+.wasm)\s/g;
  return Array.from(checksumsTxt.matchAll(regex)).map((v) => ({
    checksum: v[1],
    file: v[2],
  }));
};

const downloadContracts = async (
  repoName,
  contractsList,
  commitHash,
  destDir,
) => {
  const dirName = repoName;
  let promises = [];
  for (const contract of contractsList) {
    const url = `${STORAGE_ADDR_BASE}/${dirName}/${commitHash}/${contract.file}`;
    const filePath = `${destDir}/${contract.file}`;

    promises.push(downloadFile(url, filePath, contract.checksum));
  }
  await Promise.all(promises);
};

// -------------------- MAIN --------------------

const downloadArtifacts = async (
  repoName,
  branchName,
  commitHash,
  destDir,
  ciToken,
  timeout,
) => {
  if (!(await isRepoExists(repoName))) {
    console.log(`Repo ${repoName} doesn't exist, exiting.`);
    return;
  }

  console.log(`Downloading artifacts for ${repoName} repo`);

  if (commitHash) {
    try {
      commitHash = await normalizeCommitHash(repoName, commitHash);
    } catch (e) {
      console.log(`Error during commit hash validation:\n${e.toString()}`);
      return;
    }
    console.log(`Using specified commit: ${commitHash}`);
  } else {
    try {
      commitHash = await getLatestCommit(repoName, branchName);
    } catch (e) {
      console.log(
        `Error during getting commit for branch ${branchName}:\n${e.toString()}`,
      );
      return;
    }
    console.log(`Using branch ${branchName}`);
    console.log(`The latest commit is: ${commitHash}`);
  }

  verboseLog('Downloading checksum.txt');
  let checksumsTxt = null;
  try {
    checksumsTxt = await getChecksumsTxt(
      repoName,
      commitHash,
      ciToken,
      timeout,
    );
  } catch (e) {
    console.log(`Error during getting artifacts: ${e.toString()}`);
    return;
  }

  if (!checksumsTxt) {
    console.log('Checksum file received but empty, exiting.');
    return;
  }

  const contractsList = parseChecksumsTxt(checksumsTxt);
  const contractsListPretty = contractsList
    .map((c) => `\t${c.file}`)
    .join('\n');
  console.log(`Contracts to be downloaded:\n${contractsListPretty}`);

  if (!REWRITE_FILES) {
    try {
      await checkForAlreadyDownloaded(
        contractsList.map((c) => c.file),
        destDir,
      );
    } catch (e) {
      console.log(e.toString());
      return;
    }
  }

  await downloadContracts(repoName, contractsList, commitHash, destDir);

  console.log(`Contracts are downloaded to the "${destDir}" dir\n`);
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

  const ciToken = process.env[CI_TOKEN_ENV_NAME];

  const options = program.opts();
  const destDir = options.dir || DEFAULT_DIR;
  if (!fs.existsSync(destDir)) {
    console.log(`Directory ${destDir} not found, exiting.`);
    return;
  }
  if (!fs.lstatSync(destDir).isDirectory()) {
    console.log(`${destDir} is not directory, exiting.`);
    return;
  }
  const reposToDownload = program.args;

  let branchName = options.branch;
  const commitHash = options.commit;
  if (branchName && commitHash) {
    console.log(
      'Both branch and commit hash are specified, exiting. \
Please specify only a single thing.',
    );
    return;
  }
  if (!branchName && !commitHash) {
    branchName = DEFAULT_BRANCH;
  }

  const timeout = options.timeout || DEFAULT_TIMEOUT;

  if (options.verbose) {
    verboseLog = console.log;
  }

  if (options.force) {
    REWRITE_FILES = true;
  }

  for (const repo of reposToDownload) {
    await downloadArtifacts(
      repo,
      branchName,
      commitHash,
      destDir,
      ciToken,
      timeout,
    );
  }
};

main().then();
