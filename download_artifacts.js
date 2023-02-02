const fs = require('fs');
const { execSync } = require('child_process');
const axios = require('axios');
const stream = require('stream');
const util = require('util');

const REPO_URLS = {
  dao: 'https://github.com/neutron-org/neutron-dao.git',
  dev: 'https://github.com/neutron-org/neutron-dev-contracts.git',
};
const JENKINS_ADDR_BASE = 'http://46.151.31.50:8080';
const STORAGE_ADDR_BASE =
  'https://storage.googleapis.com/neutron-contracts/neutron-org';
const DEFAULT_BRANCH = 'neutron_audit_informal_17_01_2023';
const DEST_DIR = 'contracts';
const JOB_NAMES = {
  dao: 'neutron',
  dev: 'neutron-dev-contracts',
};
const DIR_NAMES = {
  dao: 'neutron-dao',
  dev: 'neutron-dev-contracts',
};

const finished = util.promisify(stream.finished);

async function downloadFile(fileUrl, outputLocationPath) {
  console.error(`Downloading file by url: ${fileUrl}`);
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

const getLatestCommit = (repo_url, branch_name) =>
  execSync(`git ls-remote ${repo_url} "${branch_name}" | awk '{ print $1}'`)
    .toString()
    .trim();

const triggerBuildingJob = async (contracts_set_name, token, commit) => {
  console.log('Triggering the job unimplemented lol');
  return;
};

const getChecksumsTxt = async (
  contracts_set_name,
  storage_addr,
  branch_name,
  ci_token,
) => {
  const dir_name = DIR_NAMES[contracts_set_name];
  const url = `${STORAGE_ADDR_BASE}/${dir_name}/${branch_name}/checksums.txt`;
  console.error(`Getting checksums by url: ${url}`);

  try {
    return await axios.get(url);
  } catch (error) {
    console.log('No checksum file found, triggering the building job');
    await triggerBuildingJob(contracts_set_name, ci_token, branch_name);
  }
  return await getWithAttempts(
    () => axios.get(url),
    (response) => response.code == 200,
    12,
  );
};

const getContractsList = (checksums_txt) => {
  const regex = /\S+\.wasm/g;
  return checksums_txt.match(regex);
};

const downloadContracts = async (
  contracts_set_name,
  contracts_list,
  branch_name,
  dest_dir,
) => {
  const dir_name = DIR_NAMES[contracts_set_name];
  contracts_list.forEach((element) => {
    const url = `${STORAGE_ADDR_BASE}/${dir_name}/${branch_name}/${element}`;
    const file_path = `${dest_dir}/${element}`;

    downloadFile(url, file_path);
  });
};

async function main(contracts_set_name, jenkins_token, branch_name) {
  if (!branch_name) {
    branch_name = DEFAULT_BRANCH;
  }

  console.log(`Using branch ${branch_name}`);

  let latest_commit = getLatestCommit(
    REPO_URLS[contracts_set_name],
    branch_name,
  );
  console.log(`Latest commit is ${latest_commit}`);

  console.log('Downloading checksum.txt');
  let checksums_txt = await getChecksumsTxt(
    contracts_set_name,
    STORAGE_ADDR_BASE,
    branch_name,
    jenkins_token,
  );

  const contracts_list = getContractsList(checksums_txt);

  console.log(`Contracts to be downloaded: ${contracts_list}`);

  await downloadContracts(
    contracts_set_name,
    contracts_list,
    branch_name,
    DEST_DIR,
  );

  console.log(`Contracts are downloaded`);
}

main(process.argv[2], process.argv[3], process.argv[4]);
