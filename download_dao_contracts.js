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
const STORAGE_ADDR_BASE = 'http://46.151.31.50:8081';
const DEFAULT_BRANCH = 'neutron_audit_informal_17_01_2023';
const DEST_DIR = 'contracts/artifacts';
const JOB_NAMES = {
  dao: 'neutron',
  dev: 'neutron-dev-contracts',
};
const DIR_NAMES = {
  dao: 'neutron-dao',
  dev: 'neutron-dev-contracts',
};

const TO_WAIT_FOR_BUILD = 60 * 20;
const CHECKING_IF_BUILD_FINISHED_INTERVAL = 10;

const finished = util.promisify(stream.finished);

async function downloadFile(fileUrl, outputLocationPath) {
  const writer = fs.createWriteStream(outputLocationPath);
  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then((response) => {
    response.data.pipe(writer);
    return finished(writer); //this is a Promise
  });
}

const wait = async (seconds) =>
  new Promise((r) => {
    setTimeout(() => r(true), 1000 * seconds);
  });

const getLatestCommit = (repo_url, branch_name) =>
  execSync(`git ls-remote ${repo_url} "${branch_name}" | awk '{ print $1}'`)
    .toString()
    .trim();

const triggerBuildingJob = async (contracts_set_name, token, commit) => {
  const job_name = JOB_NAMES[contracts_set_name];
  const url = `${JENKINS_ADDR_BASE}/buildByToken/buildWithParameters?token=${token}&COMMIT=${commit}&job=${job_name}&NO_REBUILD=false`;

  try {
    const trigger_build = await axios.get(url);
    if (trigger_build.status !== 201) {
      throw new Error(
        `CI service returned bad error code: ${trigger_build.status}`,
      );
    }
  } catch (error) {
    throw new Error(`Failed to call CI service: ${error}`);
  }
};

const getChecksumsTxt = async (
  contracts_set_name,
  storage_addr,
  commit,
  ci_token,
) => {
  const dir_name = DIR_NAMES[contracts_set_name];
  const url = `${STORAGE_ADDR_BASE}/${dir_name}/${commit}/checksums.txt`;

  let checksums;
  try {
    checksums = await axios.get(url);
    console.log('Using a pre-built contracts');
  } catch (error) {
    console.log('No checksum file found, triggering the building job');

    await triggerBuildingJob(contracts_set_name, ci_token, commit);

    let counter = 0;
    while (counter < TO_WAIT_FOR_BUILD / CHECKING_IF_BUILD_FINISHED_INTERVAL) {
      await wait(10);
      const url = `${STORAGE_ADDR_BASE}/${dir_name}/${commit}/checksums.txt`;

      try {
        checksums = await axios.get(url);
        break;
      } catch (error) {
        const alreadyPassed = CHECKING_IF_BUILD_FINISHED_INTERVAL * counter;
        console.log(
          `Waiting for build to finish (${alreadyPassed} seconds passed)`,
        );
        counter++;
      }
    }
  }
  return checksums.data;
};

const getContractsList = (checksums_txt) => {
  const regex = /\S+\.wasm/g;
  return checksums_txt.match(regex);
};

const downloadContracts = async (
  contracts_set_name,
  contracts_list,
  commit,
  dest_dir,
) => {
  const dir_name = DIR_NAMES[contracts_set_name];
  contracts_list.forEach((element) => {
    const url = `${STORAGE_ADDR_BASE}/${dir_name}/${commit}/${element}`;
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
    latest_commit,
    jenkins_token,
  );

  const contracts_list = getContractsList(checksums_txt);

  console.log(`Contracts to be downloaded: ${contracts_list}`);

  await downloadContracts(
    contracts_set_name,
    contracts_list,
    latest_commit,
    DEST_DIR,
  );

  console.log(`Contracts are downloaded`);
}

main(process.argv[2], process.argv[3], process.argv[4]);
