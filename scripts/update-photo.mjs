import fs from "fs/promises";
import sharp from "sharp";

const inputDir = process.argv[2] || "src/image/photo-original/";
const outputDir = process.argv[3] || "src/image/photo/";

const images = (await fs.readdir(inputDir)).filter((v) => /.+\.jpg$/.test(v));

const generate = (image, output, convert) => convert(sharp(`${inputDir}${image}`)).toFile(output);

await (() =>
  Promise.all(
    images.map(async (image) => {
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
            generate(image, `${outputDir}${prefix}${basename}.jpg`, convert),
          ),
        );

        console.log(`${basename}.jpg done!`);
      } catch (err) {
        console.error(`SKIP: ${inputDir}${image}`);
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
