import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { StargateClient } from '@cosmjs/stargate';
import { sleep } from '@neutron-org/neutronjsplus/dist/wait';

export const waitBlocks = async (
  blocks: number,
  client: StargateClient | CosmWasmClient,
  timeout = 120000,
): Promise<void> => {
  const start = Date.now();
  const initBlock = await client.getHeight();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      if (Date.now() - start > timeout) {
        throw new Error('Timeout waiting for the specific block');
      }
      const block = await client.getHeight();
      if (block - initBlock >= blocks) {
        break;
      }
    } catch (e) {
      //noop
    }
    await sleep(1000);
  }
};
