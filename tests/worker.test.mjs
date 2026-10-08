import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';

test('worker health endpoint reports the deployed runtime and D1', async () => {
  let checked = false;
  const env = {DB: {prepare: sql => ({first: async () => {checked = sql === 'SELECT 1 AS ok'; return {ok: 1};}})}, AUDIO: {}};
  const response = await worker.fetch(new Request('https://example.com/api/health'), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {ok: true, runtime: 'cloudflare-worker', database: 'd1', audio: 'kv'});
  assert.equal(checked, true);
});

test('private KV audio is not exposed without a valid student or teacher session', async () => {
  let touchedKv = false;
  const env = {AUDIO: {getWithMetadata: async () => {touchedKv = true;}}};
  const response = await worker.fetch(new Request('https://example.com/api/audio/2df77476-10d2-4f18-b8e5-e815c689f0e5'), env);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {error: 'audio_not_found'});
  assert.equal(touchedKv, false);
});

test('KV audio upload requires a signed-in student account', async () => {
  const response = await worker.fetch(new Request('https://example.com/api/audio/2df77476-10d2-4f18-b8e5-e815c689f0e5?lesson=airport&duration=1&text=test', {
    method: 'POST',
    headers: {'content-type': 'audio/webm'},
    body: new Uint8Array([1, 2, 3]),
  }), {});
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {error: 'student_login_required'});
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

test('unknown browser routes fall back to the SPA shell', async () => {
  const paths = [];
  const env = {ASSETS: {fetch: request => {
    const path = new URL(request.url).pathname;
    paths.push(path);
    return Promise.resolve(path === '/index.html' ? new Response('app-shell') : new Response('missing', {status: 404}));
  }}};
  const response = await worker.fetch(new Request('https://example.com/learning/path', {headers: {accept: 'text/html'}}), env);
  assert.equal(await response.text(), 'app-shell');
  assert.deepEqual(paths, ['/learning/path', '/index.html']);
});
