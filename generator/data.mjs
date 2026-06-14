import fs from "fs";
import { getParsedJSON } from "../utility/getParsedJSON.mjs";

const { name_jp } = getParsedJSON("../package.json");
const input = process.argv[2] || "src/image/photo/";
const output = process.argv[3] || ".pugrc";

const files = fs.readdirSync(input).filter((v) => (/.+\.jpg$/.test(v) && !/^thumb/.test(v)));

const toBasename = (value) => value.split(".")[0];

// `2020-01-01 09.00.00` → 2020年1月1日
const toHeadingString = (value) => toBasename(value)
  .split("-")
  .slice(0, 2)
  .map((v) => Number(v))
  .join("年")
  .concat("月");

const generate_data_pug = () => {
  // ファイル名から YYYY年MM月 に変換した配列を作る
  const duplicated_list = files.map((image) => {
    return toHeadingString(image);
  });
  // ユニークな { heading: 'YYYY年MM月'} の配列を作る
  const data = [...new Set(duplicated_list)].reverse().map((heading) => ({
    heading: heading,
    images: [],
  }));

  // data[n] を { heading: 'YYYY年MM月', images: ['YYYY-MM-DD', ...] } の形にする
  files.forEach((image) => {
    const index = data.findIndex((items) => items.heading === toHeadingString(image));
    data[index].images.unshift(toBasename(image));
  });

  // falsy をトルツメ
  const filteredData = data.filter((v) => v);
  const [recent1, recent2, recent3, ...rest] = filteredData;
  const recent = [recent1, recent2, recent3];
  const pugrc = {
    site: name_jp,
    recent,
    rest,
  };

  fs.writeFileSync(output, JSON.stringify(pugrc), (err) => {
    if (err) throw err;
  });
};

generate_data_pug();
