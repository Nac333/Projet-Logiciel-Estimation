import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createAppServer } from '../../scripts/serve-test.mjs';

const appFile = 'Quantif-Plancher-V7.html';
const html = '<!doctype html><title>Server fixture only</title><button>Open</button>';

async function fixture(t, withApp = true) {
  const root = await mkdtemp(join(tmpdir(), 'estimation-server-'));
  if (withApp) await writeFile(join(root, appFile), html);
  await writeFile(join(root, 'secret.txt'), 'never served');
  const server = createAppServer(root);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
    await rm(root, { recursive: true, force: true });
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test('serves the application unchanged at its filename and at root', async t => {
  const base = await fixture(t);
  for (const path of ['/', `/${appFile}`, `/${appFile}?test=1`]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.equal(await response.text(), html);
  }
});

test('HEAD reports the resource without a response body', async t => {
  const base = await fixture(t);
  const response = await fetch(`${base}/${appFile}`, { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
});

test('does not serve secrets, directory listings, or traversal paths', async t => {
  const base = await fixture(t);
  for (const path of ['/secret.txt', '/.git/config', '/package.json', '/%2e%2e%2fsecret.txt', '/missing']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404, path);
    assert.equal(await response.text(), 'Not found');
  }
});

test('rejects methods that could mutate data', async t => {
  const base = await fixture(t);
  const response = await fetch(base + '/', { method: 'POST', body: 'data' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, HEAD');
});

test('fails explicitly when the application file is absent', async t => {
  const base = await fixture(t, false);
  const response = await fetch(base + '/');
  assert.equal(response.status, 503);
  assert.equal(await response.text(), 'Application file unavailable');
});
