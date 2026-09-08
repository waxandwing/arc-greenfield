import fs from 'node:fs';
import assert from 'node:assert/strict';
import { EXPECTED_PASSWORD_HASH, accessToken, sha256 } from '../lib/beta-access.js';

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const beta = read('public/beta/index.html');
const sync = read('public/sync/index.html');
const entry = read('public/entry.html');
const callback = read('public/auth/callback/index.html');
const vercel = read('vercel.json');

assert.equal(sha256(process.env.ARC_TEST_PASSWORD || ''), EXPECTED_PASSWORD_HASH, 'ARC_TEST_PASSWORD must match beta password');
assert.equal(accessToken(), 'f71a2c00d75bf02eb1116c85a124c46f7f209c51cd063be144cfd9121e6574ea');
assert.match(entry, /href="\/beta"/);
assert.match(entry, /href="\/interest"/);
assert.match(beta, /Beta password/);
assert.match(beta, /Arc access does not require Google/);
assert.doesNotMatch(beta, /icarus/);
assert.match(sync, /Sync is optional\./);
assert.match(sync, /Skip for now/);
assert.match(callback, /\/core\/planner/);
assert.match(vercel, /"source": "\/core\/planner"/);
assert.match(vercel, /"destination": "\/index\.html"/);
assert.match(vercel, /"destination": "\/beta\/index\.html"/);
assert.ok(!fs.existsSync(new URL('../api/planner.js', import.meta.url)), 'historical planner API must not exist');
assert.ok(!fs.existsSync(new URL('../public/core/planner/index.html', import.meta.url)), 'historical static planner must not exist');
console.log('PASS Group 4 entry/gate contract');
