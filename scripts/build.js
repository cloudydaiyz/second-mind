import fs from "fs/promises";
import path from "path";
import { exec } from "node:child_process";
import { rollup } from "rollup";
import typescript from '@rollup/plugin-typescript';

/**
 * @typedef {Object} BuildSettings
 * @property {boolean} sandboxMode
 * @property {string} dist
 */

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

/**
 * @param {BuildSettings} settings 
 */
async function build(settings) {
  const scriptId = process.env.SCRIPT_ID;
  if (!scriptId) {
    throw new Error("SCRIPT_ID environment variable undefined.");
  }

  await fs.rm(settings.dist, { force: true, recursive: true });
  await fs.mkdir(settings.dist, { recursive: true });

  if (settings.sandboxMode) {
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
        await fs.writeFile(path.join(settings.dist, "sandbox.js"), sandboxCode);
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
    await fs.writeFile(path.join(settings.dist, "main.js"), mainCode);
  }

  const rawProjectSettings = await fs.readFile(".clasp.json", { encoding: "utf8" });
  const projectSettings = JSON.parse(rawProjectSettings)
  projectSettings.scriptId = scriptId;

  await fs.writeFile(
    path.join(settings.dist, ".clasp.json"),
    JSON.stringify(projectSettings, null, 2)
  );
  await fs.cp("appsscript.json", path.join(settings.dist, "appsscript.json"));
}

/**
 * @param {BuildSettings} settings 
 */
async function push(settings) {
  await build(settings);
  await promisifyExec("clasp push --force", { cwd: settings.dist, timeout: 30000 });
}

/**
 * @param {BuildSettings} settings 
 */
async function deploy(settings) {
  await push(settings);
  await promisifyExec("clasp deploy --force", { cwd: settings.dist, timeout: 30000 });
}

async function main() {
  const sandboxMode = process.env.INCLUDE_SANDBOX === "1";

  /** @type {BuildSettings} */
  const settings = {
    sandboxMode,
    dist: sandboxMode ? "sandbox" : "dist",
  }

  if (process.argv.length == 2) {
    await build(settings);
  } else if (process.argv.length == 3) {
    const action = process.argv[2];
    if (action == "build") {
      await build(settings);
    } else if (action == "push") {
      await push(settings);
    } else if (action == "deploy") {
      await deploy(settings);
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