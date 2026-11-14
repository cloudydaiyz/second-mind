import fs from "fs/promises";
import path from "path";
import { exec } from "node:child_process";
import { rollup } from "rollup";
import typescript from '@rollup/plugin-typescript';

/**
 * @param {string} command 
 * @param {Parameters<typeof import("node:child_process").exec>[1]} options 
 * @param {Parameters<typeof import("node:child_process").exec>[2]} callback 
 */
function promisifyExec(command, options, callback) {
  return new Promise((res, rej) => {
    exec(command, options, (error, stdout, stderr) => {
      if (callback) {
        callback(error, stdout, stderr);
        return;
      }

      if (error) {
        rej(error);
      }
      res();
    });
  });
}

async function build() {
  const scriptId = process.env.SCRIPT_ID;
  if (!scriptId) {
    throw new Error("SCRIPT_ID environment variable undefined.");
  }

  await fs.rm("dist", { force: true, recursive: true });
  await fs.mkdir("dist", { recursive: true });

  const INCLUDE_SANDBOX = process.env.INCLUDE_SANDBOX;
  if (INCLUDE_SANDBOX === "1") {
    const sandboxExists = await fs.access(path.join("src", "sandbox.ts"))
      .then(() => true).catch(() => false);
    if (sandboxExists) {
      const sandboxBundle = await rollup({
        input: path.join("src", "sandbox.ts"),
        plugins: [typescript()],
      });
      const { output: sandboxOutput } = await sandboxBundle.generate({ format: 'cjs' });

      const sandboxModuleId = sandboxOutput[0].moduleIds[0];
      if (sandboxOutput[0].modules[sandboxModuleId].renderedLength != 0) {
        const sandboxCode = sandboxOutput[0].code;
        await fs.writeFile(path.join("dist", "sandbox.js"), sandboxCode);
      }
    } else {
      console.warning("No sandbox file detected.");
    }
  } else {
    const mainBundle = await rollup({
      input: path.join("src", "main.ts"),
      plugins: [typescript()]
    });
    const { output: mainOutput } = await mainBundle.generate({ format: 'cjs' });
    const mainCode = mainOutput[0].code;
    await fs.writeFile(path.join("dist", "main.js"), mainCode);
  }

  const rawProjectSettings = await fs.readFile(".clasp.json", { encoding: "utf8" });
  const projectSettings = JSON.parse(rawProjectSettings)
  projectSettings.scriptId = scriptId;

  await fs.writeFile(
    path.join("dist", ".clasp.json"),
    JSON.stringify(projectSettings, null, 2)
  );
  await fs.cp("appsscript.json", path.join("dist", "appsscript.json"));
}

async function push() {
  await build();
  await promisifyExec("clasp push --force", { cwd: "dist", timeout: 30000 });
}

async function deploy() {
  await push();
  await promisifyExec("clasp deploy --force", { cwd: "dist", timeout: 30000 });
}

async function main() {
  if (process.argv.length == 2) {
    await build();
    return;
  }

  if (process.argv.length == 3) {
    const action = process.argv[2];
    if (action == "build") {
      await build();
    } else if (action == "push") {
      await push();
    } else if (action == "deploy") {
      await deploy();
    } else {
      console.log("Error: Invalid action");
      process.exit(1);
    }
  } else {
    console.log("Error: At most 1 command line argument is accepted");
    process.exit(1);
  }
}

main();