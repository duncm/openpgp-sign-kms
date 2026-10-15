import * as core from '@actions/core';
import {parse,validate,argumentsFor} from './config.js';
import {executable,platformKey,run} from './download.js';
async function main():Promise<void> {
  platformKey();
  const inputs=Object.fromEntries(['key','path','output_path','description','armor','detach_sign','clear_sign'].map(name=>[name,core.getInput(name,{trimWhitespace:false})]));
  const config=parse(inputs); await validate(config);
  await run(await executable(),argumentsFor(config));
  core.setOutput('output_path',config.output);
}
main().catch(error=>core.setFailed(error instanceof Error?error.message:String(error)));
