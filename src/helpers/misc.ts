import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { StargateClient } from '@cosmjs/stargate';
import { waitBlocks } from '@neutron-org/neutronjsplus/dist/wait';
import {
  Event,
  ExecTxResult,
  ValidatorUpdate,
} from '@neutron-org/neutronjs/tendermint/abci/types';
import { ConsensusParams } from '@neutron-org/neutronjs/tendermint/types/params';

export const getWithAttempts = async <T>(
  client: StargateClient | CosmWasmClient,
  getFunc: () => Promise<T>,
  readyFunc: (t: T) => Promise<boolean>,
  numAttempts = 20,
): Promise<T> => {
  let error = null;
  let data: T;
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
    await waitBlocks(1, client);
  }
  throw error != null
    ? error
    : new Error(
        'getWithAttempts: no attempts left. Latest get response: ' +
          (data === Object(data) ? JSON.stringify(data) : data).toString(),
      );
};

export const getBlockResults = async (
  rpc: string,
  height?: number,
): Promise<BlockResultsResponse> => {
  const url = height
    ? `${rpc}/block_results?height=${height}`
    : `${rpc}/block_results`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch block results: ${resp.statusText}`);
  }

  const jsonResp = (await resp.json()) as { result: BlockResultsResponse };
  return jsonResp.result;
};

export type BlockResultsResponse = {
  height: number;
  tx_results: ExecTxResult[];
  finalize_block_events: Event[];
  validator_updates: ValidatorUpdate[];
  consensus_param_updates: ConsensusParams;
  app_hash: string;
};
