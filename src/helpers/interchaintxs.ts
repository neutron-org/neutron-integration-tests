import { SigningNeutronClient } from './signing_neutron_client';
import { JsonObject } from '@cosmjs/cosmwasm-stargate';

export type AcknowledgementResult =
  | { success: string[] }
  | { error: string[] }
  | { timeout: string };

/**
 * cleanAckResults clears all ACK's from contract storage
 */
export const cleanAckResults = (
  client: SigningNeutronClient,
  contractAddress: string,
) => client.execute(contractAddress, { clean_ack_results: {} });

/**
 * waitForAck waits until ACK appears in contract storage
 */
export const waitForAck = (
  client: SigningNeutronClient,
  contractAddress: string,
  icaId: string,
  sequenceId: number,
  numAttempts = 20,
) =>
  client.getWithAttempts<JsonObject>(
    () =>
      client.queryContractSmart(contractAddress, {
        acknowledgement_result: {
          interchain_account_id: icaId,
          sequence_id: sequenceId,
        },
      }),
    async (ack) => ack != null,
    numAttempts,
  );

export const getAck = (
  client: SigningNeutronClient,
  contractAddress: string,
  icaId: string,
  sequenceId: number,
) =>
  client.queryContractSmart(contractAddress, {
    acknowledgement_result: {
      interchain_account_id: icaId,
      sequence_id: sequenceId,
    },
  });

export const getAcks = (
  client: SigningNeutronClient,
  contractAddress: string,
) =>
  client.queryContractSmart(contractAddress, {
    acknowledgement_results: {},
  });
