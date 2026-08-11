import fs from "fs/promises";
import { join } from "path";
import photo from "../src/photo.json" with { type: "json" };

const { recent, rest } = photo;

const layoutFile = "src/base.html";
const outputDir = "dist";

const site = "今朝はTKGを食べました。";

// 読めなかったらレンダリングまで進まずに終了する
const exitWithError = (message) => {
  console.error(message);
  process.exit(1);
};

const layout = await fs.readFile(layoutFile, "utf8").catch((err) => exitWithError(err.message));

// base.html の ${値} を差し替える。式は書けない
const render = (values) =>
  layout.replace(/\$\{(\w+)\}/g, (matched, key) => {
    if (!(key in values)) throw new Error(`${layoutFile} に未知の値があります: ${matched}`);

    return values[key];
  });

// base.html の ${main} 行の字下げに合わせて、2行目以降を下げる
const mainIndent = layout.match(/^[ \t]*(?=\$\{main\})/m)?.[0] ?? "";

const indent = (html) => html.split("\n").join(`\n${mainIndent}`);

// "YYYY-MM-DD" をばらす
const toDate = (image) => {
  const [year, month, day] = image.split("-");

  return { year, month, day };
};

// 写真1枚分のサムネール
const thumb = (image) => {
  const { year, month, day } = toDate(image);
  const alt = `${year}年${Number(month)}月${Number(day)}日に食べたTKG写真のサムネール`;

  return `<a class="thumb" href="./image/photo/${image}.jpg" id="photo-${image}"><img src="./image/photo/thumb_${image}.jpg" alt="${alt}" loading="lazy" width="168" height="168"></a>`;
};

const thumbs = (images) => images.map(thumb).join("");

const extra = (inner) => `<p class="extra">${inner}</p>`;

const empty = "<p>食べたTKGはありません。</p>";

// 月ごとに見出しを付けて並べる。sectionId は id の付け方がページで違うので受け取る
const months = (items, sectionId) =>
  items.length === 0
    ? empty
    : items
        .map((item) => {
          const { year, month } = toDate(item.images[0]);
          const id = sectionId(year, month);

          return [
            `<section id="${id}">`,
            `  <h2><a href="#${id}">${item.heading}</a></h2>`,
            `  <div class="grid">${thumbs(item.images)}</div>`,
            `</section>`,
          ].join("\n");
        })
        .join("\n");

// 見出しなしで全部並べる
const grid = (items) => {
  const images = items.flatMap((item) => item.images);

  return images.length === 0
    ? empty
    : ["<section>", `  <div class="grid">${thumbs(images)}</div>`, "</section>"].join("\n");
};

const all = [...recent, ...rest];
const backToIndex = `<a href="/">インデックスへ戻る</a>`;

// 出力するページ
const pages = [
  {
    filename: "index.html",
    main: [
      months(recent, (year, month) => `_${year}${month}`),
      extra(`<a href="all.html">全TKG</a>｜<a href="grid.html">グリッド表示</a>`),
    ].join("\n"),
  },
  {
    filename: "all.html",
    main: [months(all, (year, month) => `list-${year}-${month}`), extra(backToIndex)].join("\n"),
  },
  {
    filename: "grid.html",
    bodyClass: "grid-page",
    main: [grid(all), extra(backToIndex)].join("\n"),
  },
];

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

await Promise.all(
  pages.map(async ({ filename, bodyClass = "", main }) => {
    const bodyAttribute = bodyClass ? ` class="${bodyClass}"` : "";
    const html = render({ site, bodyAttribute, main: indent(main) });

    await fs.writeFile(join(outputDir, filename), `${html}\n`);

    console.log(`${filename} done!`);
  }),
);
