import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test("frontend selectors and stylesheet structure stay valid", async () => {
  const [html, app, styles] = await Promise.all([
    readFile(path.join(repoDir, "public", "index.html"), "utf8"),
    readFile(path.join(repoDir, "public", "app.js"), "utf8"),
    readFile(path.join(repoDir, "public", "styles.css"), "utf8")
  ]);

  const selectorIds = [...app.matchAll(/querySelector\("#([A-Za-z][\w-]*)"\)/g)].map((match) => match[1]);
  for (const id of selectorIds) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `Missing HTML element for #${id}`);
  }

  let braceDepth = 0;
  for (const character of styles) {
    if (character === "{") braceDepth += 1;
    if (character === "}") braceDepth -= 1;
    assert.ok(braceDepth >= 0, "Stylesheet has an unexpected closing brace.");
  }
  assert.equal(braceDepth, 0, "Stylesheet has an unclosed block.");

  assert.match(html, /<title>Apex Analytic<\/title>/);
  assert.match(html, /class="orbCore"><b>A<\/b>/, "The orb must use only the Apex A mark.");
  assert.match(html, /<form id="chatForm"[\s\S]*?id="analyzeDealBtn"[\s\S]*?<\/form>/, "Deal analysis must remain visible inside the message bar.");
  assert.doesNotMatch(html, /ESTATELAB \/ JARVIS|<b>J<\/b>/, "Legacy visible branding must not return.");
  assert.match(app, /FRAMEWORK ONLY/, "Framework fallback responses need an explicit badge.");
  assert.match(app, /FRAMEWORK \+ AI/, "External reasoning responses need a model-neutral badge.");
  assert.doesNotMatch(app, /FRAMEWORK \+ DEEPSEEK|modelLabel\(/, "The frontend must not expose a specific reasoning model.");

  assert.match(styles, /\.conversation:has\(\.contextPanel\.expanded\) \.transcript[\s\S]*?display:\s*none;/, "Expanded cards must replace the transcript instead of overflowing beneath it.");
  assert.match(styles, /\.contextPanel\.expanded \.contextGrid[\s\S]*?overflow-y:\s*auto|\.contextGrid[\s\S]*?overflow-y:\s*auto/, "Expanded card fields must remain scrollable.");
  assert.match(styles, /max-height:\s*calc\(100dvh - 260px\)/, "Mobile expanded cards need a viewport-bound field area.");
  assert.match(styles, /\.identity \.productSuffix[\s\S]*?text-align:\s*center;/, "The Apex identity must remain centered on mobile.");
  assert.match(styles, /\.sourceSummary p[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\);/, "Mobile source details must stack instead of squeezing text into columns.");
  assert.match(styles, /\.cornerBottomLeft[\s\S]*?bottom:\s*max\(4px, env\(safe-area-inset-bottom\)\);[\s\S]*?left:\s*10px;/, "The mobile HUD frame must sit outside the bottom controls.");
  assert.match(styles, /\.conversation[\s\S]*?bottom:\s*max\(24px, calc\(env\(safe-area-inset-bottom\) \+ 16px\)\);/, "Mobile controls need clearance above the HUD frame.");
});
