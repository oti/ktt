import crypto from "crypto";
import fs from "fs/promises";
import { join } from "path";
import sharp from "sharp";

const input = "src/image/photo-original";
const output = "src/image/photo";
const cacheFile = "src/photo-cache.json";

// 変換設定が同じでも作り直したいとき用
//   npm run update:photo -- --force
const force = process.argv.includes("--force");

// 元画像は git 管理外なので、無い環境では読めなくて正常
const readPhotos = async () => {
  const filenames = await fs.readdir(input).catch((err) => {
    if (err.code !== "ENOENT") throw err;

    return [];
  });

  return filenames.filter((v) => /.+\.jpg$/.test(v));
};

const photos = await readPhotos();

// 1枚も見えないなら同期漏れかもしれない。掃除まで進むと出力を全部消すので、何もせず終わる
if (photos.length === 0) {
  console.log(`元画像が見つかりません: ${input}`);
  process.exit(0);
}

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

// スペースが含まれているファイル名なので決め打ちで作る
const basenameOf = (image) => image.split(" ")[0];

const outputsOf = (image) =>
  sizes.map(({ prefix, convert }) => ({
    path: join(output, `${prefix}${basenameOf(image)}.jpg`),
    convert,
  }));

const generate = (image, path, convert) => convert(sharp(join(input, image))).toFile(path);

const exists = (path) => fs.access(path).then(() => true, () => false);

// 元画像の指紋。mtime とサイズのどちらかが変われば中身が変わったとみなす
const fingerprint = ({ mtimeMs, size }) => `${mtimeMs}:${size}`;

// 変換設定を変えたときも作り直したいので、設定そのものも指紋にする
const configId = crypto
  .createHash("sha256")
  .update(sizes.map(({ prefix, convert }) => `${prefix}:${convert}`).join("\n"))
  .digest("hex");

// 前回の記録。無い / 壊れている / 設定が変わった / --force ならまっさらから始める
const readCache = async () => {
  const cache = await fs
    .readFile(cacheFile, "utf8")
    .then(JSON.parse)
    .catch(() => null);

  if (cache && cache.config !== configId) {
    console.log("変換設定が変わったのですべて作り直す");
  }

  return !force && cache?.config === configId ? cache.sources : {};
};

const cache = await readCache();

const candidates = await Promise.all(
  photos.map(async (image) => {
    const stamp = fingerprint(await fs.stat(join(input, image)));
    const outputs = outputsOf(image);
    const generated = await Promise.all(outputs.map(({ path }) => exists(path)));
    const skip = cache[image] === stamp && generated.every(Boolean);
    // 写真1枚ぶんの作業指示。前回と同じ指紋で出力も揃っていれば skip
    return { image, stamp, outputs, skip };
  })
);

// 変換できたら記録用のエントリを返す。失敗したら記録せず、次回もう一度試す
const convert = async ({ image, stamp, outputs }) => {
  try {
    await Promise.all(outputs.map(({ path, convert }) => generate(image, path, convert)));
    console.log(`${basenameOf(image)}.jpg done!`);
    return [image, stamp];
  } catch (err) {
    console.error(`SKIP: ${join(input, image)}`);
    String(err.message).includes("header: heif")
      ? console.error("JPEGの中身がHEICになっています。`npm run convert2jpg` を実行してください。")
      : console.error(err.message)
    return null;
  }
};

const converted = (await Promise.all(candidates.filter(({ skip }) => !skip).map(convert))).filter(Boolean);
const skipped = candidates.filter(({ skip }) => skip).map(({ image, stamp }) => [image, stamp]);
const sources = Object.fromEntries([...skipped, ...converted].sort(([a], [b]) => a.localeCompare(b)));

// キャッシュファイルを保存
await fs.writeFile(cacheFile, `${JSON.stringify({ config: configId, sources }, null, 2)}\n`);

// 元画像が消えている分の処理
const expected = new Set(candidates.flatMap(({ outputs }) => outputs.map(({ path }) => path)));
const orphans = (await fs.readdir(output))
  .map((v) => join(output, v))
  .filter((path) => /\.jpg$/.test(path) && !expected.has(path));

await Promise.all(
  orphans.map(async (path) => {
    await fs.rm(path);
    console.log(`元画像が無いので削除: ${path}`);
  }),
);
