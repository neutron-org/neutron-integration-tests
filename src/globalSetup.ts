import { setup } from './helpers/setup';
import ch from 'child_process';

let teardownHappened = false;

export default async function () {
  const host1 = process.env.NODE1_URL || 'http://localhost:1317';
  const host2 = process.env.NODE2_URL || 'http://localhost:1316';
  if (!process.env.NO_DOCKER) {
    await setup(host1, host2);
  }

  return async () => {
    if (teardownHappened) {
      throw new Error('teardown called twice');
    }
    if (!process.env.NO_DOCKER) {
      ch.execSync(`cd setup && make stop-cosmopark`);
    }
    teardownHappened = true;
  };
}
