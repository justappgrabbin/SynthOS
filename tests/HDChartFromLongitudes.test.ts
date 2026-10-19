// Run: npx -y tsx --test tests/HDChartFromLongitudes.test.ts
// Uses made-up longitudes only. No birth data.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  activationFromLongitude, designSunLongitude, earthFromSun,
  definedChannelsFor, definedCentersFor, buildChartFromLongitudes, GATE_ARC,
} from '../HDChartFromLongitudes';
import { CHANNELS, GATE_TO_CENTER } from '../HDGraphEngine-2';

test('wheel anchors', () => {
  assert.equal(activationFromLongitude(302).address, '41.1.1.1.1');
  assert.equal(activationFromLongitude(358.25).gate, 25);
  assert.equal(activationFromLongitude(3.8751).gate, 17);
  assert.equal(activationFromLongitude(10).gate, 21);           // not 25 (Jovian example is wrong)
  assert.equal(activationFromLongitude(301.9999).address.split('.')[0], '60');
  assert.equal(activationFromLongitude(302 + GATE_ARC - 1e-9).address, '41.6.6.6.5');
});

const TABLE = '/workspace/research/calc/gate_table.md';
test('all 64 start degrees match verified table', { skip: !existsSync(TABLE) }, () => {
  const rows = readFileSync(TABLE, 'utf8').split('\n').filter((l) => /^\| \d+ \| \*\*/.test(l));
  assert.equal(rows.length, 64);
  for (const r of rows) {
    const c = r.split('|').map((s) => s.trim());
    const gate = Number(c[2].replace(/\*/g, '')), start = Number(c[3]);
    assert.equal(activationFromLongitude(start + 1e-6).gate, gate);
    assert.equal(activationFromLongitude(start + 1e-6).line, 1);
  }
});

test('design sun is 88 deg of arc back; earth opposite', () => {
  assert.equal(designSunLongitude(120), 32);
  assert.equal(designSunLongitude(10), 282);
  assert.equal(earthFromSun(300), 120);
});

test('her channel table (HDGraphEngine-2.ts): 36 channels, centers agree with GATE_TO_CENTER', () => {
  assert.equal(CHANNELS.length, 36);
  for (const c of CHANNELS) {
    assert.equal(GATE_TO_CENTER[c.gateA], c.centerA, c.id);
    assert.equal(GATE_TO_CENTER[c.gateB], c.centerB, c.id);
  }
});

test('definition: channel needs both gates; centers come from channels', () => {
  assert.deepEqual(definedChannelsFor(new Set([34])), []);
  assert.deepEqual(definedChannelsFor(new Set([34, 20])), ['20-34']);
  assert.deepEqual(definedCentersFor(['20-34']).sort(), ['Sacral', 'Throat']);
  assert.deepEqual(definedCentersFor([]), []);
});

test('buildChartFromLongitudes end to end (synthetic positions)', () => {
  // mid-gate longitudes for gates 34 and 20 -> channel 20-34
  const mid = (g: number) => {
    const order = [41,19,13,49,30,55,37,63,22,36,25,17,21,51,42,3,27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,31,33,7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,10,58,38,54,61,60];
    return (302 + order.indexOf(g) * GATE_ARC + GATE_ARC / 2) % 360;
  };
  const chart = buildChartFromLongitudes({ personality: { Sun: mid(34) }, design: { Sun: mid(20) } });
  assert.deepEqual(chart.activeGates, [20, 34]);
  assert.deepEqual(chart.definedChannels, ['20-34']);
  assert.equal(chart.openCenters.length, 7);
  assert.equal(chart.type, 'Generator');            // her determineType
  assert.equal(chart.authority, 'Sacral Authority'); // her determineAuthority
  assert.equal(chart.profile.status, 'investigating');
  const none = buildChartFromLongitudes({ personality: { Sun: mid(34) }, design: {} });
  assert.deepEqual(none.definedCenters, []);
  assert.equal(none.type, 'Reflector');
});
