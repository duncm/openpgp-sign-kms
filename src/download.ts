import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {chmod, readFile, mkdtemp, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import * as tc from '@actions/tool-cache';
import release from '../cli-release.json' with {type:'json'};
interface Asset {name:string; sha256:string; binary_sha256:string}
export async function digest(path:string):Promise<string> {const hash=createHash('sha256');for await(const chunk of createReadStream(path)) hash.update(chunk);return hash.digest('hex');}
export function platformKey(platform=process.platform,arch=process.arch):string {
  if(platform!=='linux'||!['x64','arm64'].includes(arch)) throw new Error('Supported runners: Linux x86_64 and ARM64');
  return arch==='x64'?'x86_64-unknown-linux-gnu':'aarch64-unknown-linux-gnu';
}
export async function executable():Promise<string> {
  const target=platformKey();
  const asset=(release.assets as Record<string,Asset>)[target];
  if(!asset||![asset.sha256,asset.binary_sha256].every(h=>/^[a-f0-9]{64}$/.test(h))) throw new Error('CLI release is not pinned yet; maintainers must run scripts/pin-cli.mjs before releasing the action');
  const cacheName=`openpgp-sign-kms-${asset.binary_sha256}`;
  const cached=tc.find(cacheName,release.version,target);
  if(cached) {const binary=join(cached,'openpgp-sign-kms');if(await digest(binary)!==asset.binary_sha256) throw new Error('Cached CLI checksum mismatch');return binary;}
  const dir=await mkdtemp(join(tmpdir(),'openpgp-kms-'));
  try {
    const archive=await tc.downloadTool(`https://github.com/${release.repository}/releases/download/v${release.version}/${asset.name}`,join(dir,'archive.tar.gz'));
    if(await digest(archive)!==asset.sha256) throw new Error('CLI archive checksum mismatch');
    const extracted=await tc.extractTar(archive,join(dir,'extracted'));
    const binary=join(extracted,'openpgp-sign-kms');
    if(await digest(binary)!==asset.binary_sha256) throw new Error('CLI executable checksum mismatch');
    await chmod(binary,0o755);
    const dest=await tc.cacheFile(binary,'openpgp-sign-kms',cacheName,release.version,target);
    return join(dest,'openpgp-sign-kms');
  } finally {await rm(dir,{recursive:true,force:true});}
}
export async function run(binary:string,args:string[]):Promise<void> {
  await new Promise<void>((resolve,reject)=>{const child=spawn(binary,args,{stdio:['ignore','inherit','inherit'],shell:false});child.once('error',reject);child.once('exit',(code,signal)=>code===0?resolve():reject(new Error(`CLI failed (${signal??code})`)));});
}
// Kept separate to let maintenance validate pins without invoking AWS.
export async function readManifest(path:string):Promise<unknown> {return JSON.parse(await readFile(path,'utf8'));}
