import { access, lstat, realpath, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";
export type Mode = "attached" | "detached" | "clear";
export interface Config {
  key: string;
  input: string;
  output: string;
  armor: boolean;
  mode: Mode;
  description: string;
}
export function boolean(value: string, name: string): boolean {
  if (value === "" || value === "false") return false;
  if (value === "true") return true;
  throw new Error(`${name} must be true or false`);
}
export function parse(
  inputs: Record<string, string>,
  cwd = process.cwd(),
): Config {
  const key = inputs.key?.trim();
  const path = inputs.path;
  if (
    !key ||
    !/^arn:(aws|aws-cn|aws-us-gov):kms:[a-z0-9-]+:\d{12}:key\/(?:[0-9a-f-]{36}|mrk-[0-9a-f]{32})$/i.test(
      key,
    )
  )
    throw new Error("key must be a concrete AWS KMS key ARN");
  if (!path) throw new Error("path is required");
  const detached = boolean(inputs.detach_sign ?? "", "detach_sign");
  const clear = boolean(inputs.clear_sign ?? "", "clear_sign");
  if (detached && clear)
    throw new Error("detach_sign and clear_sign cannot both be true");
  const armor = boolean(inputs.armor ?? "", "armor");
  const mode: Mode = clear ? "clear" : detached ? "detached" : "attached";
  const suffix = clear || armor ? ".asc" : detached ? ".sig" : ".gpg";
  const input = resolve(cwd, path),
    output = resolve(cwd, inputs.output_path || `${path}${suffix}`);
  if (input === output) throw new Error("output aliases input");
  return {
    key,
    input,
    output,
    armor,
    mode,
    description: inputs.description ?? "",
  };
}
export async function validate(config: Config): Promise<void> {
  if (!(await stat(config.input)).isFile())
    throw new Error("input must be a regular file");
  await access(config.input, constants.R_OK);
  // Resolve the output parent so paths through directory symlinks cannot alias input.
  const parent = await realpath(dirname(config.output));
  if (
    resolve(parent, config.output.slice(dirname(config.output).length + 1)) ===
    (await realpath(config.input))
  )
    throw new Error("output aliases input");
  try {
    await lstat(config.output);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      await access(parent, constants.W_OK);
      return;
    }
    throw e;
  }
  throw new Error("output already exists");
}
export function argumentsFor(config: Config): string[] {
  const args = [
    "--batch",
    "--no-tty",
    "--local-user",
    config.key,
    "--output",
    config.output,
    config.mode === "attached"
      ? "--sign"
      : config.mode === "detached"
        ? "--detach-sign"
        : "--clear-sign",
  ];
  if (config.armor) args.push("--armor");
  if (config.description) args.push("--description", config.description);
  args.push("--", config.input);
  return args;
}
