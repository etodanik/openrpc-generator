/**
 * Modified code
 * https://github.com/metaplex-foundation/kinobi/blob/f399702c0a2281270e09642a54029f348b8753e7/src/shared/RenderMap.ts
 * Original code by @lorisleiva
 * MIT license
 * Copyright (c) 2023 Metaplex Foundation
 */

import { createFile } from "./utils.ts";

export class RenderMap {
  protected readonly _map: Map<string, string> = new Map();

  add(relativePath: string, code: string): RenderMap {
    this._map.set(relativePath, code);
    return this;
  }

  remove(relativePath: string): RenderMap {
    this._map.delete(relativePath);
    return this;
  }

  mergeWith(...others: (RenderMap | undefined)[]): RenderMap {
    others.forEach((other) => {
      if (other) {
        other._map.forEach((code, relativePath) => {
          this.add(relativePath, code);
        });
      }
    });
    return this;
  }

  isEmpty(): boolean {
    return this._map.size === 0;
  }

  has(key: string): boolean {
    return this._map.has(key);
  }

  get(key: string): string {
    const value = this.safeGet(key);
    if (value === undefined) {
      throw new Error(`Cannot find key "${key}" in RenderMap.`);
    }
    return value;
  }

  safeGet(key: string): string | undefined {
    return this._map.get(key);
  }

  contains(key: string, value: string | RegExp): boolean {
    const content = this.get(key);
    return typeof value === "string" ? content.includes(value) : value.test(content);
  }

  write(path: string): void {
    this._map.forEach((code, relativePath) => {
      createFile(`${path}/${relativePath}`, code);
    });
  }

  clear() {
    this._map.clear();
  }
}
