import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';

test('worker health endpoint reports the deployed runtime and D1', async () => {
  let checked = false;
  const env = {DB: {prepare: sql => ({first: async () => {checked = sql === 'SELECT 1 AS ok'; return {ok: 1};}})}};
  const response = await worker.fetch(new Request('https://example.com/api/health'), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {ok: true, runtime: 'cloudflare-worker', database: 'd1'});
  assert.equal(checked, true);
});

test('worker rejects cross-origin API mutations before reading secrets', async () => {
  const response = await worker.fetch(new Request('https://example.com/api/auth/teacher', {
    method: 'POST',
    headers: {'content-type': 'application/json', origin: 'https://attacker.example'},
    body: JSON.stringify({token: 'anything'}),
  }), {});
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, 'invalid_origin');
});

test('non-API requests are served through the Workers Assets binding', async () => {
  const env = {ASSETS: {fetch: request => new Response(`asset:${new URL(request.url).pathname}`)}};
  const response = await worker.fetch(new Request('https://example.com/learning/path'), env);
  assert.equal(await response.text(), 'asset:/learning/path');
});
