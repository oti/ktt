import fs from "fs/promises";
import pug from "pug";
import { getParsedJSON } from "./utility/getParsedJSON.mjs";

const inputDir = process.argv[2] || "src/html/";
const outputDir = process.argv[3] || "dist/";

const photo = await getParsedJSON("../../src/photo.json");
const { name_jp: site } = await getParsedJSON("../../package.json");

// コピーするもの [コピー元, コピー先]
const assets = [
  ["src/favicon.ico", `${outputDir}favicon.ico`],
  ["src/style/", `${outputDir}style/`],
  ["src/image/", `${outputDir}image/`],
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
        `${outputDir}${filename}`,
        pug.renderFile(`${inputDir}${page}`, { ...photo, site, pretty: true }),
      );

      console.log(`${filename} done!`);
    } catch (err) {
      console.error(`FAILED: ${inputDir}${page}`);
      console.error(err.message);
      process.exitCode = 1;
    }
  }),
);
