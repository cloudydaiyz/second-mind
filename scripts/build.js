import fs from "fs/promises";
import path from "path";
import { exec } from "node:child_process";
import { rollup } from "rollup";
import typescript from '@rollup/plugin-typescript';

async function build() {
  const scriptId = process.env.SCRIPT_ID;
  if (!scriptId) {
    console.log("Error: SCRIPT_ID environment variable undefined.");
    process.exit(1);
  }

  const bundle = await rollup({
    input: path.join("src", "main.ts"),
    plugins: [typescript()]
  });
  const { output } = await bundle.generate({ format: 'cjs' });
  const code = output[0].code;

  await fs.mkdir("dist", { recursive: true });
  await fs.writeFile(path.join("dist", "main.js"), code);

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
  await new Promise((res, rej) => {
    exec("clasp push", { cwd: "dist", timeout: 30000 }, (error) => {
      if (error) {
        rej(error);
      }
      res();
    });
  });
}

async function deploy() {
  await push();
  await new Promise((res, rej) => {
    exec("clasp deploy", { cwd: "dist", timeout: 30000 }, (error) => {
      if (error) {
        rej(error);
      }
      res();
    });
  });
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