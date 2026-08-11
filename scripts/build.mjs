import fs from "fs/promises";
import { join } from "path";
import pug from "pug";
import { getParsedJSON } from "./utility/getParsedJSON.mjs";

const inputDir = process.argv[2] || "src/html";
const outputDir = process.argv[3] || "dist";

// 読めなかったらレンダリングまで進まずに終了する
const exitWithError = (message) => {
  console.error(message);
  process.exit(1);
};

const photo = await getParsedJSON("src/photo.json").catch((err) =>
  exitWithError(`${err.message}\n  npm run update:json で生成してください。`),
);
const { name_jp: site } = await getParsedJSON("package.json").catch((err) =>
  exitWithError(err.message),
);

// コピーするもの [コピー元, コピー先]
const assets = [
  ["src/favicon.ico", join(outputDir, "favicon.ico")],
  ["src/style", join(outputDir, "style")],
  ["src/image", join(outputDir, "image")],
];

// 出力先を作り直す
await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

// アセットをコピーする
await Promise.all(assets.map(([from, to]) => fs.cp(from, to, { recursive: true })));

// src/html/ 直下の .pug だけをコンパイルする（src/pug/ のテンプレートは対象外）
const pages = (await fs.readdir(inputDir)).filter((v) => /\.pug$/.test(v));

await Promise.all(
  pages.map(async (page) => {
    const filename = page.replace(/\.pug$/, ".html");

    try {
      await fs.writeFile(
        join(outputDir, filename),
        pug.renderFile(join(inputDir, page), { ...photo, site, pretty: true }),
      );

      console.log(`${filename} done!`);
    } catch (err) {
      console.error(`FAILED: ${join(inputDir, page)}`);
      console.error(err.message);
      process.exitCode = 1;
    }
  }),
);
