import fs from "fs/promises";
import { join } from "path";
import sharp from "sharp";

const input = "src/image/photo-original";
const output = "src/image/photo";

// 元画像が変わっていなくても作り直したいとき用（変換設定をいじったときなど）
//   npm run update:photo -- --force
const force = process.argv.includes("--force");

// 元画像は git 管理外なので、無い環境では何もせず正常終了する
const filenames = await fs.readdir(input).catch((err) => {
  if (err.code !== "ENOENT") throw err;

  console.log(`元画像のディレクトリがないのでスキップします: ${input}`);
  return [];
});

const photos = filenames.filter((v) => /.+\.jpg$/.test(v));

// 1枚の写真から作るもの
const sizes = [
  {
    prefix: "",
    convert: (image) => image.resize({ width: 1280 }).jpeg({ quality: 70 }),
  },
  {
    prefix: "thumb_",
    convert: (image) =>
      image.resize({ width: 336, height: 336, fit: "cover" }).jpeg({ quality: 30 }),
  },
];

const generate = (image, output, convert) => convert(sharp(join(input, image))).toFile(output);

// 無いファイルは null にする
const mtimeOf = (path) => fs.stat(path).then(({ mtimeMs }) => mtimeMs, () => null);

// 出力が全部あって、どれも元画像より新しければ変換済みとみなす
const isUpToDate = async (image, paths) => {
  const [source, ...generated] = await Promise.all([
    mtimeOf(join(input, image)),
    ...paths.map(mtimeOf),
  ]);

  return source !== null && generated.every((mtime) => mtime !== null && mtime >= source);
};

// 変換するものだけ選ぶ
const targets = await Promise.all(
  photos.map(async (image) => {
    // スペースが含まれているファイル名なので決め打ちで作る
    const basename = image.split(" ")[0];
    const outputs = sizes.map(({ prefix, convert }) => ({
      path: join(output, `${prefix}${basename}.jpg`),
      convert,
    }));

    if (!force && (await isUpToDate(image, outputs.map(({ path }) => path)))) return null;

    return { image, basename, outputs };
  }),
).then((v) => v.filter((target) => target !== null));

console.log(`変換対象: ${targets.length}/${photos.length} 枚`);

await Promise.all(
  targets.map(async ({ image, basename, outputs }) => {
    try {
      await Promise.all(outputs.map(({ path, convert }) => generate(image, path, convert)));

      console.log(`${basename}.jpg done!`);
    } catch (err) {
      console.error(`SKIP: ${join(input, image)}`);

      if (String(err.message).includes("header: heif")) {
        console.error("JPGEの中身がHEICになっています。`npm run convert2jpg` を実行してください。");
      } else {
        console.error(err.message);
      }
    }
  }),
);
