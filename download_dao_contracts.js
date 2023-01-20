const fs = require('fs');

const { execSync } = require('child_process');
const axios = require('axios');
const stream = require('stream');
const util = require('util');

const REPO_URL = 'https://github.com/neutron-org/neutron-dao.git';
const JENKINS_ADDR_BASE = 'http://46.151.31.50:8080';
const STORAGE_ADDR_BASE = 'http://46.151.31.50:8081';

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

async function main() {
  let branch_name = process.argv[3];
  let jenkins_token = process.argv[2];
  console.log(branch_name);

  if (!branch_name) {
    branch_name = 'neutron_audit_informal_17_01_2023';
  }

  console.log(`Using branch ${branch_name}`);

  let latest_commit = execSync(
    `git ls-remote ${REPO_URL} "${branch_name}" | awk '{ print $1}'`,
  )
    .toString()
    .trim();
  console.log(`Latest commit is ${latest_commit}`);

  console.log('Downloading checksum.txt');

  const url = `${STORAGE_ADDR_BASE}/neutron-dao/${latest_commit}/checksums.txt`;

  let checksums;
  try {
    checksums = await axios.get(url);
  } catch (error) {
    console.log('No checksum, lets call J');

    // do jenkins request and wait
    const url = `${JENKINS_ADDR_BASE}/buildByToken/buildWithParameters?token=${jenkins_token}&COMMIT=${latest_commit}&job=neutron`;
    console.log(url);

    const trigger_build = await axios.get(url);
    if (trigger_build.status != 201) {
      console.log('Something with jenkins');
      return;
    }
    let counter = 0;
    const toWaitOverall = 60 * 20;
    const toWaitInterval = 10;
    while (counter < toWaitOverall / toWaitInterval) {
      await wait(10);
      const url = `${STORAGE_ADDR_BASE}/neutron-dao/${latest_commit}/checksums.txt`;

      try {
        checksums = await axios.get(url);
        break;
      } catch (error) {
        console.log('waiting for build to finish');
        counter++;
      }
    }
  }

  console.log(checksums.data);

  const regex = /[^\s]+\.wasm/g;
  const found = checksums.data.match(regex);

  console.log(found);

  found.forEach((element) => {
    const url = `${STORAGE_ADDR_BASE}/neutron-dao/${latest_commit}/${element}`;
    const file_path = `contracts/artifacts/${element}`;

    downloadFile(url, file_path);
  });
}

main();
