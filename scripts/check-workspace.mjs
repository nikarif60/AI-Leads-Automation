import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Read-only browser check. Start the local server before running this script.
const origin = process.env.WORKSPACE_CHECK_URL || 'http://localhost:3001';
const session = `workspace-check-${process.pid}`;
function browser(...args) {
  const response = JSON.parse(execFileSync('npx', ['--yes', 'agent-browser', '--session', session, '--json', ...args], { encoding: 'utf8', timeout: 30000 }));
  assert(response.success, response.error);
  return response.data;
}
const evaluate = (code) => browser('eval', code).result;
const waitFor = (code) => browser('wait', '--fn', code);
function checkWindow(path) {
  waitFor(`location.pathname === ${JSON.stringify(path)} && !!document.querySelector('dialog:modal .workspace-content h1')`);
  assert(evaluate(`!document.querySelector('.sidebar') && !!document.querySelector('.office-robot')`));
  assert(evaluate(`(() => { const popup = getComputedStyle(document.querySelector('dialog:modal')); const hud = getComputedStyle(document.querySelector('.pixel-window')); return popup.colorScheme === 'dark' && popup.backgroundColor === hud.backgroundColor; })()`), `${path} must share the office palette`);
}

try {
  browser('set', 'viewport', '1440', '1000');
  browser('open', origin);
  waitFor(`!!document.querySelector('.office-robot')`);
  assert.equal(evaluate(`!!document.querySelector('dialog:modal')`), false);
  waitFor(`document.querySelector('.office-world').dataset.activity === 'desk-work'`);
  assert(evaluate(`document.querySelector('.office-world').dataset.state === 'idle' && document.querySelector('.office-robot').dataset.seated === 'true' && document.querySelector('.office-robot').dataset.pose === 'typing'`), 'Idle routine should visibly sit and type without claiming a scan');
  assert(evaluate(`new DOMMatrix(getComputedStyle(document.querySelector('.object-research-chair')).transform).m42 < 0`), 'Seated chair must roll toward the desk');
  browser('click', 'button[aria-label="Pause office animation"]');
  assert(evaluate(`new Promise(resolve => { const robot = document.querySelector('.office-robot'), chair = document.querySelector('.object-research-chair'); const before = robot.style.transform + chair.style.transform; setTimeout(() => resolve(before === robot.style.transform + chair.style.transform), 250); })`), 'Pause must hold both robot and chair');
  const roomWidth = evaluate(`document.querySelector('.office-world').getBoundingClientRect().width`);
  browser('click', 'button[aria-label="Zoom out office"]');
  assert(evaluate(`document.querySelector('.office-world').getBoundingClientRect().width`) < roomWidth);
  browser('click', 'button[aria-label="Reset office camera"]');
  browser('click', 'button[aria-label="Resume office animation"]');
  evaluate(`window.__officeCheck = document.querySelector('.office-robot'); true`);
  browser('click', '.office-topbar nav a[href="/leads"]');
  checkWindow('/leads');
  assert(evaluate(`window.__officeCheck === document.querySelector('.office-robot')`), 'The same office must survive route changes');
  evaluate(`document.querySelector('.workspace-close').focus(); true`);
  // Native dialogs may Tab to browser chrome, but never to the inert office.
  evaluate(`document.querySelector('.office-topbar nav a').focus(); true`);
  assert(evaluate(`document.querySelector('dialog:modal').contains(document.activeElement)`), 'Native modal must trap focus');
  browser('press', 'Tab');
  assert(evaluate(`document.querySelector('dialog:modal').contains(document.activeElement)`));
  browser('press', 'Escape');
  waitFor(`location.pathname === '/' && !document.querySelector('dialog:modal')`);
  browser('back');
  checkWindow('/leads');
  browser('forward');
  waitFor(`location.pathname === '/' && !document.querySelector('dialog:modal')`);

  browser('open', `${origin}/leads?score=80%2B`);
  checkWindow('/leads');
  assert(evaluate(`[...document.querySelectorAll('.opportunity-rank strong')].every(el => Number(el.textContent) >= 80)`));
  assert(evaluate(`document.querySelector('.library-filters').open`));
  browser('fill', 'input[placeholder="Find a company, city or niche"]', 'no-match-workspace-check');
  assert.equal(evaluate(`document.querySelectorAll('.opportunity-row').length`), 0);
  browser('click', '.empty-state button');
  const detail = evaluate(`document.querySelector('.opportunity-row')?.getAttribute('href')`);
  if (detail) {
    browser('click', '.opportunity-row:first-child');
    checkWindow(detail);
    browser('set', 'viewport', '393', '852');
    assert(evaluate(`document.querySelector('.workspace-content').scrollWidth <= document.querySelector('.workspace-content').clientWidth + 1`), 'Lead detail overflows mobile');
  }
  for (const path of ['/leads', '/pipeline', '/telegram', '/scans', '/scan-history', '/settings']) {
    browser('open', `${origin}${path}`);
    checkWindow(path);
    assert(evaluate(`(() => { const d = document.querySelector('dialog:modal').getBoundingClientRect(); const c = document.querySelector('.workspace-content'); return d.left >= 0 && d.right <= innerWidth && d.top >= 0 && d.bottom <= innerHeight && c.scrollWidth <= c.clientWidth + 1; })()`), `${path} overflows mobile`);
    console.log(`Passed: ${path}`);
  }
  console.log('Workspace checks passed: seated idle routine, moving chair, pause, zoom, persistent office, native popup, focus, Escape, Back/Forward, filters and mobile bounds.');
} finally {
  browser('close');
}
