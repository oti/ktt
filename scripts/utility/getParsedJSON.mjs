import { readFile } from "fs/promises";
import { resolve } from "path";

// filepath は他のスクリプトの引数と同じく、実行時のカレントディレクトリ基準で解決する
export const getParsedJSON = async (filepath) => {
  try {
    return JSON.parse(await readFile(resolve(filepath), "utf8"));
  } catch (e) {
    throw new Error(`JSONを読み込めませんでした: ${filepath}\n  ${e.message}`, { cause: e });
  }
};
