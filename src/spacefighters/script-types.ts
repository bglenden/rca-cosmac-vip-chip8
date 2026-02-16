/** ROM-specific addresses for the Spacefighters key-scan routine. */
export const SCAN_ROUTINE_START = 0x0508;
export const SCAN_ROUTINE_END = 0x0516;
export const COMMAND_SCAN_CALLER = 0x02fc;
export const MAX_SCRIPT_CYCLES = 3_500_000;

export type FxSource = 'init' | 'command' | 'tail' | 'fallback';

export interface SpacefightersScript {
  initialFxKeys: number[];
  commandKeys: number[];
  tailFxKeys?: number[];
  executionCheckpointCycles?: number[];
  romUrl?: string;
  seed?: number;
}

export interface FxSnapshot {
  index: number;
  source: FxSource;
  key: number;
  startedAt: number;
  consumedAt: number;
  pc: number;
  returnAddress: number;
  hash: string;
  marker: string[];
}

export interface ExecutionSnapshot {
  cycle: number;
  pc: number;
  hash: string;
  marker: string[];
}

export interface SpacefightersScriptResult {
  fxSnapshots: FxSnapshot[];
  executionSnapshots: ExecutionSnapshot[];
  scanCommandTriggerCycles: number[];
  autoLoopPresses: number;
}
