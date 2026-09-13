import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseLeadFilters, matchesLeadFilters } from '../src/lib/lead-filters.ts';
import { officeStatus, countdown, malaysiaDayStart } from '../src/lib/office-state.ts';
import { chairPosition, officeCamera, idleRoute, workingRoute, sampleRoute, robotFrame, officeObjects, stations, ROOM } from '../src/lib/office-world.ts';

const now = Date.parse('2026-09-09T16:10:00Z');
const base = { mode: 'live', fetchedAt: now, scansEnabled: true, nextScanAt: new Date(now + 6120000).toISOString(), job: { id: 'fixture-job', github_run_id: '123', status: 'running', phase: 'checking_websites', cities: ['Shah Alam'], new_unique_leads: 6, qualified_leads: 3, notifications_sent: 2, last_error: null } };
assert.equal(officeStatus(base, now).state, 'running');
assert.equal(officeStatus({ ...base, mode: 'demo' }, now).state, 'idle');
assert.equal(officeStatus({ ...base, job: { ...base.job, github_run_id: null } }, now).state, 'idle');
assert.equal(officeStatus({ ...base, fetchedAt: now - 91000 }, now).title, 'Status unavailable');
assert.equal(officeStatus({ ...base, job: null }, now).title, 'Idle · next scan in 1h 42m');
assert.equal(officeStatus({ ...base, job: { ...base.job, status: 'completed_with_leads' } }, now).title, '6 new leads found');
assert.equal(officeStatus({ ...base, job: { ...base.job, status: 'completed_no_leads' } }, now).state, 'completed_no_leads');
assert.equal(officeStatus({ ...base, job: { ...base.job, status: 'failed', last_error: 'Quota reached' } }, now).detail, 'Quota reached');
assert.equal(countdown(null, now), 'next scan not scheduled');
assert.equal(countdown('invalid', now), 'next scan not scheduled');
assert.equal(countdown(new Date(now - 1).toISOString(), now), 'waiting for the next scan');
assert.equal(malaysiaDayStart(now), '2026-09-09T16:00:00.000Z');

const lead = { score: 88, status: 'Draft Ready', state: 'Selangor', city: 'Shah Alam' };
assert(matchesLeadFilters(lead, parseLeadFilters({ location: 'Selangor' })));
assert(matchesLeadFilters(lead, parseLeadFilters({ location: 'Shah Alam' })));
assert(!matchesLeadFilters(lead, parseLeadFilters({ location: 'Johor' })));
assert(matchesLeadFilters(lead, parseLeadFilters({ status: 'Draft Ready' })));
assert(matchesLeadFilters(lead, parseLeadFilters({ status: 'New / high priority' })));
assert(!matchesLeadFilters({ ...lead, status: 'Contacted' }, parseLeadFilters({ status: 'New / high priority' })));
assert(matchesLeadFilters(lead, parseLeadFilters({ status: 'Awaiting approach', score: '80+' })));
assert(!matchesLeadFilters({ ...lead, score: 79 }, parseLeadFilters({ score: '80+' })));
assert.deepEqual(parseLeadFilters({ status: ['New'], score: 'anything', location: 'x'.repeat(101) }), { status: 'All', score: 'All', location: 'All' });

// Test the full waypoint routes at sub-frame resolution, including wraparound.
const assets = JSON.parse(await readFile(new URL('../public/office/assets.json', import.meta.url), 'utf8'));
const footprints = officeObjects.filter(object => ['desk', 'cabinet'].includes(object.asset)).map(object => {
  const asset = assets[object.asset], offset = object.asset === 'desk' ? 31 : 24;
  return [object.x, object.y + offset, asset.width, asset.height - offset];
});
for (const route of [idleRoute, workingRoute]) {
  const duration = route.reduce((total, point) => total + point.duration, 0);
  for (let t = 0; t < duration * 2; t += 16) {
    const point = sampleRoute(route, t);
    assert(point.x > 7 && point.x < ROOM.width - 7 && point.y > 65 && point.y < ROOM.height - 5);
    for (const [x, y, width, height] of footprints) assert(!(point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height), `Collision at ${point.x},${point.y}`);
    const frame = robotFrame(point.pose, t);
    assert(frame.column >= 0 && frame.column < 4 && frame.row >= 0 && frame.row < 8);
    const chair = chairPosition(point);
    if (chair.seated) assert.equal(chair.y + 26, point.y, 'Chair must move with the seated robot');
  }
  assert.deepEqual(sampleRoute(route, 0), sampleRoute(route, duration));
}
assert.equal(sampleRoute(idleRoute, 3000).pose, 'typing');
assert.equal(chairPosition(sampleRoute(idleRoute, 3000)).seated, true);
assert.notEqual(chairPosition(sampleRoute(idleRoute, 0)).y, chairPosition(sampleRoute(idleRoute, 3000)).y);
assert.equal(idleRoute.some(point => point.pose === 'scanning'), false, 'Idle office routines must not simulate an active scan');
for (const action of ['sit-down', 'desk-work', 'stand-up', 'files', 'printer', 'map', 'telegram', 'break']) assert(idleRoute.some(point => point.activity === action));
for (const [width, height] of [[1440, 640], [1280, 400], [1920, 760]]) {
  const camera = officeCamera(width, height, { x: 381, y: 235 });
  assert(camera.left >= 0 && camera.top >= 0);
  assert(camera.left + ROOM.width * camera.scale <= width && camera.top + ROOM.height * camera.scale <= height, 'Wide camera must contain the entire room');
}
assert.equal(new Set(officeObjects.map((object) => object.id)).size, officeObjects.length);
for (const station of stations) {
  assert(officeObjects.some((object) => object.station === station.id), `Missing station ${station.id}`);
  assert(station.href.startsWith('/') && !station.href.startsWith('//'));
}
assert.equal(new URL(stations.find((s) => s.id === 'map').href, 'http://localhost').searchParams.get('location'), 'Kuala Lumpur');
assert.equal(new URL(stations.find((s) => s.id === 'inbox').href, 'http://localhost').searchParams.get('status'), 'New / high priority');
assert.equal(new URL(stations.find((s) => s.id === 'whatsapp').href, 'http://localhost').searchParams.get('status'), 'Draft Ready');
assert.equal(stations.find((s) => s.id === 'telegram').href, '/telegram');
for (const asset of new Set(officeObjects.map((object) => object.asset))) assert((await readFile(new URL(`../public/office/${asset}.png`, import.meta.url))).length > 100);
console.log('Office checks passed: truthful job states, Malaysia dates, collision-free paths, sprite frames and six station destinations.');
