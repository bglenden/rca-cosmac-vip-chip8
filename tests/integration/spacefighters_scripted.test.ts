import { describe, it, expect } from 'vitest';
import { runSpacefightersScript } from '../helpers/SpacefightersScriptRunner.js';
import { SPACEFIGHTERS_3P_SCENARIOS } from '../helpers/spacefightersScenarios.js';

describe('Spacefighters scripted 3-player session', () => {
  for (const scenario of SPACEFIGHTERS_3P_SCENARIOS) {
    it(`should match deterministic scripted snapshots for ${scenario.name}`, () => {
      const result = runSpacefightersScript({
        initialFxKeys: [...scenario.script.initialFxKeys],
        commandKeys: [...scenario.script.commandKeys],
        tailFxKeys: [...scenario.script.tailFxKeys],
        executionCheckpointCycles: [...scenario.script.executionCheckpointCycles],
      });

      expect(result.fxSnapshots.length).toBe(scenario.fxSnapshots.length);
      expect(
        result.fxSnapshots.map((snapshot) => ({
          source: snapshot.source,
          key: snapshot.key,
          hash: snapshot.hash,
          marker: snapshot.marker,
        })),
      ).toEqual(scenario.fxSnapshots);

      expect(result.scanCommandTriggerCycles.length).toBe(scenario.scanCommandTriggerCount);
      expect(result.autoLoopPresses).toBe(scenario.autoLoopPresses);
      expect(result.executionSnapshots).toEqual(scenario.executionSnapshots);
    });
  }
});
