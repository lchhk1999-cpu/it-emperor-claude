// Inlines index.html's stylesheet and scripts into one self-contained file, so
// the prototype opens anywhere (file preview, phone, AirDrop) without a server.
// Run from repo root via ./scripts/build.sh [dev|release]
// "release" leaves the dev sample questions out of the bundle entirely, swaps
// the imported bank for its approved-only file, and sets ITE.BUILD_MODE so only
// approved questions can be shown.
// "offline" (單機版) leaves the guild screen and its demo data out and sets
// ITE.EDITION so the game hides online features.
const args = typeof scriptArgs !== "undefined" ? scriptArgs : arguments;
const mode = args[0] || "dev";
const edition = args[1] || "online";
// "demo" (老師示範版): release content with a rich starting profile (src/core/demo.js).
const demo = args[2] === "demo";
if (mode !== "dev" && mode !== "release") throw new Error(`unknown build mode: ${mode}`);
if (edition !== "online" && edition !== "offline") throw new Error(`unknown edition: ${edition}`);
const ONLINE_ONLY = ["src/ui/guild.js", "src/data/demo_guilds.js"];

let html = readFile("index.html");
html = html.replace(/<link rel="stylesheet" href="([^"]+)" \/>/g, (_, href) => `<style>\n${readFile(href)}</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  if (mode === "release" && src.includes("dev_sample_questions")) return "";
  if (mode === "release" && src === "src/data/question_bank.js") src = "src/data/question_bank.release.js";
  if (mode === "release" && src === "src/data/story_bank.js") src = "src/data/story_bank.release.js";
  if (mode === "release" && src === "src/ui/review.js") return ""; // teacher review is dev-only
  if (edition === "offline" && ONLINE_ONLY.includes(src)) return "";
  return `<script>\n${readFile(src).replace(/<\/script/gi, "<\\/script")}</script>`;
});
html = html.replace(
  "<body>",
  `<body>\n<script>(globalThis.ITE = globalThis.ITE || {}).BUILD_MODE = ${JSON.stringify(mode)}; ITE.EDITION = ${JSON.stringify(edition)};${demo ? " ITE.DEMO = true;" : ""}</script>`
);
print(html);
