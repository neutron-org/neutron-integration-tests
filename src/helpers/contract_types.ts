export type AcknowledgementResult =
  | { ack: string[] }
  | { error: string }
  | { timeout: string };
