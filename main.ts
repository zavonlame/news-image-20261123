// THE WORLD TODAY — front page summing up Monday 23 November 2026.
//
// The front page is pre-rendered and checked into this repository as
// entry.png. This program's only job is to copy that image to the
// grader's output directory, unchanged.
//
// Why no rendering here: the make.fun grader runs in a pinned node22
// image that has no Chrome binary, so rendering with headless Chrome
// fails at run time. Copying the committed PNG keeps the entry
// deterministic and dependency-free.
//
// Node 22, standard library only. No network, no Chrome, no external
// programs, no timestamps, no randomness.
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_NAME = "entry.png";
const OUTPUT_NAME = "entry.png";

function main(): void {
  // Resolve entry.png relative to this program file, not the cwd, so
  // the program works no matter where the grader invokes it from.
  const here = dirname(fileURLToPath(import.meta.url));
  const source = join(here, SOURCE_NAME);

  if (!existsSync(source)) {
    throw new Error(
      `Missing ${SOURCE_NAME}: expected it next to main.ts at ${source}. ` +
        "The front-page image must be committed to the repository.",
    );
  }

  const outputDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outputDir, { recursive: true });

  const dest = join(outputDir, OUTPUT_NAME);

  // Never copy the file onto itself: if the output dir is the repo dir,
  // source and destination are the same file and the copy would destroy it.
  if (dest === source) {
    throw new Error(
      `Refusing to copy ${SOURCE_NAME} onto itself: ` +
        `MAKEFUN_OUTPUT_DIR (${outputDir}) is the repository directory.`,
    );
  }

  copyFileSync(source, dest);

  // Verify the copy landed whole: sizes must match exactly.
  const sourceSize = statSync(source).size;
  const destSize = statSync(dest).size;
  if (destSize !== sourceSize) {
    throw new Error(
      `Incomplete copy of ${SOURCE_NAME}: copied ${destSize} bytes, ` +
        `expected ${sourceSize} bytes.`,
    );
  }

  console.log(`Copied ${SOURCE_NAME} (${sourceSize} bytes) to ${dest}`);
}

main();
