import { rollup } from "rollup";
import fs from "fs/promises";
import path from "path";
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

build();