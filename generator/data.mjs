import fs from "fs/promises";
import { getParsedJSON } from "../utility/getParsedJSON.mjs";

const { name_jp } = await getParsedJSON("../package.json");
const input = process.argv[2] || "src/image/photo/";
const output = process.argv[3] || ".pugrc";

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

await (async () => {
  // { heading: 'YYYY年MM月', images: ['YYYY-MM-DD', ...] } の形にする
  const [recent1, recent2, recent3, ...rest] = filenames.reduce(
    (memo, filename) => {
      const heading = convert2localYM(filename);
      const index = memo.findIndex((obj) => obj.heading === heading);

      if (index > -1) {
        memo[index].images.unshift(filename);
      } else {
        memo.unshift({ heading, images: [filename] });
      }
      return memo;
    },
    [{ heading: "2013年11月", images: [] }],
  );

  const pugrc = {
    site: name_jp,
    recent: [recent1, recent2, recent3],
    rest,
  };

  await fs.writeFile(output, JSON.stringify(pugrc));
})();
