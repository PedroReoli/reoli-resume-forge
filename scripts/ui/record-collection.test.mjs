import assert from 'node:assert/strict';
import test from 'node:test';
import { insertRecord, moveRecord } from '../../src/domain/recordCollection.ts';

test('move uma ficha sem alterar a coleção original', () => {
  const records = ['principal', 'secundária', 'apoio'];
  const moved = moveRecord(records, 1, 0);

  assert.deepEqual(moved, ['secundária', 'principal', 'apoio']);
  assert.deepEqual(records, ['principal', 'secundária', 'apoio']);
});

test('mantém a ordem quando o movimento está fora dos limites', () => {
  assert.deepEqual(moveRecord(['principal'], 0, -1), ['principal']);
  assert.deepEqual(moveRecord(['principal'], 0, 1), ['principal']);
});

test('insere uma cópia logo após a ficha de origem', () => {
  assert.deepEqual(insertRecord(['A', 'C'], 1, 'B'), ['A', 'B', 'C']);
});
