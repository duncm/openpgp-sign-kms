import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const current=JSON.parse(await readFile('cli-release.json','utf8'));
const check=process.argv[2]==='--check';
const version=check?current.version:process.argv[2];
if(!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version??'')) throw new Error('Provide a semantic version, or --check');
const repo='duncm/openpgp-sign-kms-cli';
const release=JSON.parse(execFileSync('gh',['api',`repos/${repo}/releases/tags/v${version}`],{encoding:'utf8'}));
if(release.draft) throw new Error('Cannot pin a draft release');
const dir=await mkdtemp(join(tmpdir(),'kms-pin-'));
const manifest={version,repository:repo,assets:{}};
try {
 for(const target of ['x86_64-unknown-linux-gnu','aarch64-unknown-linux-gnu']) {
  const name=`openpgp-sign-kms-${version}-${target}.tar.gz`;
  const file=join(dir,name);
  execFileSync('gh',['release','download',`v${version}`,'--repo',repo,'--pattern',name,'--dir',dir],{stdio:'inherit'});
  execFileSync('gh',['attestation','verify',file,'--repo',repo],{stdio:'inherit'});
  const sha256=createHash('sha256').update(await readFile(file)).digest('hex');
  // Extract only the expected file to stdout, not arbitrary archive paths.
  const binary=execFileSync('tar',['-xOzf',file,'openpgp-sign-kms'],{maxBuffer:256*1024*1024});
  const binary_sha256=createHash('sha256').update(binary).digest('hex');
  manifest.assets[target]={name,sha256,binary_sha256};
 }
 if(check) {if(JSON.stringify(manifest)!==JSON.stringify(current)) throw new Error('Pinned CLI manifest differs from verified release');}
 else await writeFile('cli-release.json',JSON.stringify(manifest,null,2)+'\n');
} finally {await rm(dir,{recursive:true,force:true});}
