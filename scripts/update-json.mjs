import fs from "fs/promises";

const input = "src/image/photo";
const output = "src/photo.json";

const filenames = (await fs.readdir(input))
  .filter((v) => /.+\.jpg$/.test(v) && !/^thumb/.test(v))
  .map((v) => v.slice(0, 10));

// "YYYY-MM-DD" → "YYYY年M月" に変換する
const convert2localYM = (value) =>
  value
    .slice(0, 7)
    .split("-")
    .map((v) => Number(v))
    .join("年")
    .concat("月");

// { heading: 'YYYY年M月', images: ['YYYY-MM-DD', ...] } の形にする
const months = filenames.reduce((memo, filename) => {
  const heading = convert2localYM(filename);
  const index = memo.findIndex((obj) => obj.heading === heading);

  if (index > -1) {
    memo[index].images.unshift(filename);
  } else {
    memo.unshift({ heading, images: [filename] });
  }

  return memo;
}, []);

await fs.writeFile(output, JSON.stringify({ recent: months.slice(0, 3), rest: months.slice(3) }));
