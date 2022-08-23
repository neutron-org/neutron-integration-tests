export type AcknowledgementResult =
  | { success: string[] }
  | { error: string }
  | { timeout: string };
