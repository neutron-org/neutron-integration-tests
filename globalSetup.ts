import { env } from '@neutron-org/neutronjsplus';
// import matchers from 'jest-extended/all';
// expect.extend(matchers);

export default async () => {
  const host1 = process.env.NODE1_URL || 'http://localhost:1317';
  const host2 = process.env.NODE2_URL || 'http://localhost:1316';
  !process.env.NO_DOCKER && (await env.setup(host1, host2));
};
