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
  assert.doesNotMatch(html, /<h1>APEX<\/h1>|class="productSuffix"/, "The central Apex Analytic wordmark must stay removed.");
  assert.match(html, /<form id="chatForm"[\s\S]*?id="analyzeDealBtn"[\s\S]*?<\/form>/, "Deal analysis must remain visible inside the message bar.");
  assert.match(html, /id="memoryPanel"[\s\S]*?PRIVATE TO YOUR ACCOUNT[\s\S]*?id="memoryList"/, "Signed-in users need a private memory review screen.");
  assert.match(html, /id="shortlistPanel"[\s\S]*?DEAL SHORTLIST[\s\S]*?id="shortlistList"/, "Analysed properties need an inline comparison shortlist.");
  assert.match(html, /id="billingSummary"[\s\S]*?id="billingPlanName"[\s\S]*?id="billingActions"/, "Signed-in accounts need one compact plan and usage surface.");
  assert.match(html, /id="reportsPanel"[\s\S]*?DEAL REPORTS[\s\S]*?id="reportsList"/, "Signed-in accounts need private report history.");
  assert.match(html, /id="journalPanel"[\s\S]*?DECISION JOURNAL[\s\S]*?id="journalEditor"/, "Signed-in accounts need an inline decision journal.");
  assert.doesNotMatch(html, /ESTATELAB \/ JARVIS|<b>J<\/b>/, "Legacy visible branding must not return.");
  assert.match(app, /FRAMEWORK ONLY/, "Framework fallback responses need an explicit badge.");
  assert.match(app, /FRAMEWORK \+ AI/, "External reasoning responses need a model-neutral badge.");
  assert.doesNotMatch(app, /FRAMEWORK \+ DEEPSEEK|modelLabel\(/, "The frontend must not expose a specific reasoning model.");
  assert.match(app, /result\.memoryCandidate/, "The chat must surface memory candidates for review.");
  assert.match(app, /data-memory-action="approve"/, "Memory candidates must require explicit approval.");
  assert.match(app, /data-analysis-action="report"/, "Every structured analysis needs a printable deal report.");
  assert.match(app, /analysis\.dimensions/, "Deal results must render separate decision dimensions.");
  assert.match(app, /analysis\.scenarios/, "Deal results must render downside scenarios.");
  assert.match(app, /marketIntelligenceMarkup\(analysis\.marketIntelligence\)/, "Deal results must render matched dated market intelligence.");
  assert.match(app, /type === "market"/, "Market observations need a distinct source label.");
  assert.match(app, /\/api\/billing\/status/, "The account surface must load report entitlements.");
  assert.match(app, /\/api\/reports/, "The report-history surface must use private account storage.");
  assert.match(app, /\/api\/journal/, "The decision journal must use private account storage.");
  assert.match(app, /data-analysis-action="journal"/, "Saved reports need a direct decision-record action.");
  assert.match(styles, /\.memoryOpen \.transcript[\s\S]*?display:\s*none;/, "The memory screen must replace chat content instead of opening a popup.");
  assert.match(styles, /\.reportsOpen \.transcript[\s\S]*?display:\s*none;/, "The report history must replace chat content instead of opening a popup.");
  assert.match(styles, /\.journalOpen \.transcript[\s\S]*?display:\s*none;/, "The decision journal must replace chat content instead of opening a popup.");
  assert.match(styles, /\.analysisMarketPulse[\s\S]*?overflow-wrap:\s*anywhere;/, "Market observations must remain readable without overflowing the report.");

  assert.match(styles, /\.conversation:has\(\.contextPanel\.expanded\) \.transcript[\s\S]*?display:\s*none;/, "Expanded cards must replace the transcript instead of overflowing beneath it.");
  assert.match(styles, /\.contextPanel\.expanded \.contextGrid[\s\S]*?overflow-y:\s*auto|\.contextGrid[\s\S]*?overflow-y:\s*auto/, "Expanded card fields must remain scrollable.");
  assert.match(styles, /max-height:\s*calc\(100dvh - 260px\)/, "Mobile expanded cards need a viewport-bound field area.");
  assert.match(styles, /\.identity #assistantPrompt[\s\S]*?text-align:\s*center;/, "The ready prompt must remain centered beneath the orb on mobile.");
  assert.match(styles, /\.sourceSummary p[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\);/, "Mobile source details must stack instead of squeezing text into columns.");
  assert.match(styles, /\.cornerBottomLeft[\s\S]*?bottom:\s*max\(4px, env\(safe-area-inset-bottom\)\);[\s\S]*?left:\s*10px;/, "The mobile HUD frame must sit outside the bottom controls.");
  assert.match(styles, /\.conversation[\s\S]*?bottom:\s*max\(24px, calc\(env\(safe-area-inset-bottom\) \+ 16px\)\);/, "Mobile controls need clearance above the HUD frame.");
});
