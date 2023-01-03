import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getParsedJSON = (filepath) => {
  try {
    return JSON.parse(readFileSync(resolve(__dirname, filepath), "utf8"));
  } catch (e) {
    console.error(e);
  }
};
