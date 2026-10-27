import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

const publicDir = fileURLToPath(new URL("../public", import.meta.url));

// Wymiary z nagłówka PNG (IHDR: szerokość i wysokość od 16. bajtu).
function pngSize(path: string) {
  const file = readFileSync(path);
  expect(file.subarray(1, 4).toString("ascii")).toBe("PNG");
  return `${file.readUInt32BE(16)}x${file.readUInt32BE(20)}`;
}

describe("manifest PWA", () => {
  const { icons = [] } = manifest();

  it("ma ikony 192, 512 i maskable", () => {
    expect(icons.map((i) => `${i.sizes} ${i.purpose}`)).toEqual([
      "192x192 any",
      "512x512 any",
      "512x512 maskable",
    ]);
  });

  it.each(icons.map((i) => [i.src, i.sizes]))(
    "%s istnieje w public/ i ma rozmiar %s",
    (src, sizes) => {
      expect(pngSize(`${publicDir}${src}`)).toBe(sizes);
    }
  );
});
