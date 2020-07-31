const fs = require("fs");
const sharp = require("sharp");

const inputDir = process.argv[2] || "src/image/photo-original/";
const outputDir = process.argv[3] || "src/image/photo/";

const images = fs.readdirSync(inputDir).filter((v) => {
  return /.+\.jpg$/.test(v);
});

const convert = () => {
  images.forEach((image) => {
    // スペースが含まれているファイル名なので決め打ちで作る
    const fileBasename = image.split(" ")[0];

    sharp(`${inputDir}${image}`)
      .resize({ width: 1280 })
      .jpeg({ quality: 70 })
      .toFile(`${outputDir}${fileBasename}.jpg`)
      .then(() => {
        console.log(`${outputDir}${fileBasename}.jpg has been saved!`);
      })
      .catch((err) => {
        throw err;
      });
  });
};

const convertThumb = () => {
  images.forEach((image) => {
    // スペースが含まれているファイル名なので決め打ちで作る
    const fileBasename = image.split(" ")[0];

    sharp(`${inputDir}${image}`)
      .resize({ width: 336, height: 336, fit: "cover" })
      .jpeg({ quality: 30 })
      .toFile(`${outputDir}thumb_${fileBasename}.jpg`)
      .then(() => {
        console.log(`${outputDir}thumb_${fileBasename}.jpg has been saved!`);
      })
      .catch((err) => {
        throw err;
      });
  });
};

convert();
convertThumb();
