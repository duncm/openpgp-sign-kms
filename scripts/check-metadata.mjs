import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const metadata=await readFile('action.yml','utf8');
for(const name of ['key','path','output_path','description','armor','detach_sign','clear_sign']) assert.match(metadata,new RegExp(`^  ${name}:`,'m'));
assert.match(metadata,/using: node24/);assert.match(metadata,/main: dist\/index.cjs/);
await readFile('dist/index.cjs');
console.log('Action metadata checked');
