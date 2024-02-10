import { dirname } from "std/path/mod.ts";
import { ensureDirSync } from "std/fs/mod.ts";

export const createFile = (path: string, content: string): void => {
  ensureDirSync(dirname(path));
  Deno.writeTextFileSync(path, content);
};
