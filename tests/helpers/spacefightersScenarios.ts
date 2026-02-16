export type FxSource = 'init' | 'command' | 'tail' | 'fallback';

export interface ScriptInput {
  initialFxKeys: number[];
  commandKeys: number[];
  tailFxKeys: number[];
  executionCheckpointCycles: number[];
}

export interface FxSnapshotExpectation {
  source: FxSource;
  key: number;
  hash: string;
  marker: string[];
}

export interface ExecutionSnapshotExpectation {
  cycle: number;
  pc: number;
  hash: string;
  marker: string[];
}

export interface SpacefightersScenarioExpectation {
  name: string;
  script: ScriptInput;
  fxSnapshots: FxSnapshotExpectation[];
  scanCommandTriggerCount: number;
  autoLoopPresses: number;
  executionSnapshots: ExecutionSnapshotExpectation[];
}

export const SPACEFIGHTERS_3P_SCENARIOS: SpacefightersScenarioExpectation[] = [
  {
    name: 'command script [1,2,3]',
    script: {
      // S=3, D=3, E=1, C=0, F=2, A=0, then 0 (end check), 0 (begin programming)
      initialFxKeys: [3, 3, 1, 0, 2, 0, 0, 0],
      // Program one command for each of 3 fighters
      commandKeys: [1, 2, 3],
      // Advance past post-program prompts
      tailFxKeys: [0, 0],
      // Inspect deterministic execution checkpoints afterwards
      executionCheckpointCycles: [50_000, 100_000, 150_000, 200_000],
    },
    fxSnapshots: [
      {
        source: 'init',
        key: 3,
        hash: '035cf2b3',
        marker: ['........', '........', '........', '........', '........', '........'],
      },
      {
        source: 'init',
        key: 3,
        hash: 'bb720017',
        marker: ['........', '........', '........', '........', '........', '........'],
      },
      {
        source: 'init',
        key: 1,
        hash: '8efc3d05',
        marker: ['........', '........', '........', '........', '........', '........'],
      },
      {
        source: 'init',
        key: 0,
        hash: 'c0cda94c',
        marker: ['........', '........', '........', '........', '........', '........'],
      },
      {
        source: 'init',
        key: 2,
        hash: 'de67f888',
        marker: ['........', '........', '........', '........', '........', '........'],
      },
      {
        source: 'init',
        key: 0,
        hash: '781ddc17',
        marker: ['........', '........', '........', '........', '........', '........'],
      },
      {
        source: 'init',
        key: 0,
        hash: 'f24c391f',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'init',
        key: 0,
        hash: 'f24c391f',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'command',
        key: 1,
        hash: '2776dfbb',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'tail',
        key: 0,
        hash: 'f24c391f',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'command',
        key: 2,
        hash: 'bdd2cf93',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'tail',
        key: 0,
        hash: 'f24c391f',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'command',
        key: 3,
        hash: '8e70c719',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'fallback',
        key: 0,
        hash: 'e966dfd1',
        marker: ['........', '........', '.......#', '........', '.#......', '.##....#'],
      },
      {
        source: 'fallback',
        key: 0,
        hash: 'e966dfd1',
        marker: ['........', '........', '.......#', '........', '.#......', '.##....#'],
      },
    ],
    scanCommandTriggerCount: 3,
    autoLoopPresses: 3,
    executionSnapshots: [
      {
        cycle: 250_001,
        pc: 0x050e,
        hash: '2927e458',
        marker: ['........', '........', '.......#', '........', '........', '.......#'],
      },
      {
        cycle: 300_001,
        pc: 0x02fc,
        hash: 'e1adc9c1',
        marker: ['........', '........', '.......#', '........', '.#......', '.##....#'],
      },
      {
        cycle: 350_001,
        pc: 0x050e,
        hash: '2927e458',
        marker: ['........', '........', '.......#', '........', '........', '.......#'],
      },
      {
        cycle: 400_001,
        pc: 0x0306,
        hash: 'e1adc9c1',
        marker: ['........', '........', '.......#', '........', '.#......', '.##....#'],
      },
    ],
  },
  {
    name: 'command script [6,5,4]',
    script: {
      // S=3, D=3, E=1, C=0, F=2, A=0, then 0 (end check), 0 (begin programming)
      initialFxKeys: [3, 3, 1, 0, 2, 0, 0, 0],
      // Different one-command programs for the 3 fighters
      commandKeys: [6, 5, 4],
      // Advance past post-program prompts
      tailFxKeys: [0, 0],
      executionCheckpointCycles: [50_000, 100_000, 150_000, 200_000],
    },
    fxSnapshots: [
      {
        source: 'init',
        key: 3,
        hash: '035cf2b3',
        marker: ['........', '........', '........', '........', '........', '........'],
      },
      {
        source: 'init',
        key: 3,
        hash: 'bb720017',
        marker: ['........', '........', '........', '........', '........', '........'],
      },
      {
        source: 'init',
        key: 1,
        hash: '8efc3d05',
        marker: ['........', '........', '........', '........', '........', '........'],
      },
      {
        source: 'init',
        key: 0,
        hash: 'c0cda94c',
        marker: ['........', '........', '........', '........', '........', '........'],
      },
      {
        source: 'init',
        key: 2,
        hash: 'de67f888',
        marker: ['........', '........', '........', '........', '........', '........'],
      },
      {
        source: 'init',
        key: 0,
        hash: '781ddc17',
        marker: ['........', '........', '........', '........', '........', '........'],
      },
      {
        source: 'init',
        key: 0,
        hash: 'f24c391f',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'init',
        key: 0,
        hash: 'f24c391f',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'command',
        key: 6,
        hash: '2776dfbb',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'tail',
        key: 0,
        hash: 'f24c391f',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'command',
        key: 5,
        hash: 'bdd2cf93',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'tail',
        key: 0,
        hash: 'f24c391f',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'command',
        key: 4,
        hash: '8e70c719',
        marker: ['........', '.....#..', '....#..#', '.....#..', '........', '.......#'],
      },
      {
        source: 'fallback',
        key: 0,
        hash: 'b63d2877',
        marker: ['........', '........', '....##.#', '....#...', '........', '.......#'],
      },
      {
        source: 'fallback',
        key: 0,
        hash: 'b63d2877',
        marker: ['........', '........', '....##.#', '....#...', '........', '.......#'],
      },
    ],
    scanCommandTriggerCount: 3,
    autoLoopPresses: 3,
    executionSnapshots: [
      {
        cycle: 250_001,
        pc: 0x055c,
        hash: '6f3e1e94',
        marker: ['........', '........', '.......#', '........', '........', '.......#'],
      },
      {
        cycle: 300_001,
        pc: 0x050e,
        hash: '6f3e1e94',
        marker: ['........', '........', '.......#', '........', '........', '.......#'],
      },
      {
        cycle: 350_001,
        pc: 0x0562,
        hash: '6f3e1e94',
        marker: ['........', '........', '.......#', '........', '........', '.......#'],
      },
      {
        cycle: 400_001,
        pc: 0x050e,
        hash: '6f3e1e94',
        marker: ['........', '........', '.......#', '........', '........', '.......#'],
      },
    ],
  },
];
