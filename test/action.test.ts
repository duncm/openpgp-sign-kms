import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,symlink,link,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parse,validate,argumentsFor} from '../src/config.js';
import {platformKey,digest,run,verifyFile} from '../src/download.js';
const key='arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012';
test('modes, armor and default filenames',()=>{
  for(const armor of ['true','false']) for(const mode of ['attached','detached','clear']) {
    const c=parse({key,path:'file',armor,detach_sign:String(mode==='detached'),clear_sign:String(mode==='clear')},'/tmp');
    assert.equal(c.mode,mode); assert.equal(c.output,`/tmp/file${mode==='clear'||armor==='true'?'.asc':mode==='detached'?'.sig':'.gpg'}`);
  }
});
test('invalid inputs fail',()=>{
  for(const extra of ([{detach_sign:'true',clear_sign:'true'},{armor:'yes'},{key:'alias/foo'},{path:''},{output_path:'file'}] as Record<string,string>[])) assert.throws(()=>parse({key,path:'file',...extra}));
});
test('arguments preserve shell metacharacters literally',()=>{const c=parse({key,path:'a ; $(touch bad)',description:'hi\nthere',output_path:'b'}); const args=argumentsFor(c); assert.equal(args.at(-1),c.input);assert.equal(args.at(-2),'--');assert.ok(args.includes('hi\nthere'));});
test('destinations, symlinks, hardlinks and missing input',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'kms-test-'));
  try {await writeFile(join(dir,'input'),'data'); const c=parse({key,path:'input'},dir); await validate(c);
    await writeFile(c.output,'existing');await assert.rejects(validate(c));await rm(c.output);
    await symlink(c.input,c.output);await assert.rejects(validate(c));await rm(c.output);
    await link(c.input,c.output);await assert.rejects(validate(c));await rm(c.output);
    await assert.rejects(validate({...c,input:join(dir,'missing')}));
    assert.equal(await digest(c.input),'3a6eb0790f39ac87c94f3856b2dd2c5d110e6811602261a9a923d3bb23adc8b7');
    await verifyFile(c.input,await digest(c.input));
    await assert.rejects(verifyFile(c.input,'0'.repeat(64)));
    await assert.rejects(verifyFile(c.input,'not-a-hash'));
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('platform gate',()=>{assert.equal(platformKey('linux','arm64'),'aarch64-unknown-linux-gnu');assert.equal(platformKey('linux','x64'),'x86_64-unknown-linux-gnu');assert.throws(()=>platformKey('win32','x64'));});
test('child failures are propagated',async()=>{await assert.rejects(run('/bin/false',[]));await assert.rejects(run('/does/not/exist',[]));await run('/bin/true',[]);});
