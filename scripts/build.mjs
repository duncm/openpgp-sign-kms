import {build} from 'esbuild';
await build({entryPoints:['src/index.ts'],bundle:true,platform:'node',target:'node24',format:'cjs',outfile:'dist/index.cjs',sourcemap:true,legalComments:'external'});
import {readFile,readdir,writeFile} from 'node:fs/promises';
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
const notices=[];
for(const [path,pkg] of Object.entries(lock.packages).sort(([a],[b])=>a.localeCompare(b,'en'))) {
  if(!path || pkg.dev) continue;
  const names=(await readdir(path)).filter(n=>/^(license|licence|copying|notice)([.-]|$)/i.test(n)).sort();
  const name=path.split('node_modules/').at(-1);
  if(!names.length) throw new Error(`Missing license file for ${name}`);
  notices.push(`${name}@${pkg.version}\n${pkg.license??''}\n`+(await Promise.all(names.map(n=>readFile(`${path}/${n}`,'utf8')))).join('\n'));
}
await writeFile('dist/THIRD-PARTY-NOTICES.txt',notices.join('\n\n----------------\n\n')+'\n');
