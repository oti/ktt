import fs from "fs/promises";
import { join } from "path";
import sharp from "sharp";

const input = "src/image/photo-original";
const output = "src/image/photo";

// 元画像は git 管理外なので、無い環境では何もせず正常終了する
const filenames = await fs.readdir(input).catch((err) => {
  if (err.code !== "ENOENT") throw err;

  console.log(`元画像のディレクトリがないのでスキップします: ${input}`);
  return [];
});

const photos = filenames.filter((v) => /.+\.jpg$/.test(v));

const generate = (image, output, convert) => convert(sharp(join(input, image))).toFile(output);

await (() =>
  Promise.all(
    photos.map(async (image) => {
      // スペースが含まれているファイル名なので決め打ちで作る
      const basename = image.split(" ")[0];

      try {
        await Promise.all(
          [
            {
              prefix: "",
              convert: (image) => image.resize({ width: 1280 }).jpeg({ quality: 70 }),
            },
            {
              prefix: "thumb_",
              convert: (image) =>
                image.resize({ width: 336, height: 336, fit: "cover" }).jpeg({ quality: 30 }),
            },
          ].map(({ prefix, convert }) =>
            generate(image, join(output, `${prefix}${basename}.jpg`), convert),
          ),
        );

        console.log(`${basename}.jpg done!`);
      } catch (err) {
        console.error(`SKIP: ${join(input, image)}`);
        if (String(err.message).includes("header: heif")) {
          console.error(
            "JPGEの中身がHEICになっています。`npm run convert2jpg` を実行してください。",
          );
        } else {
          console.error(err.message);
        }
      }
    }),
  ))();
