// Inlines index.html's stylesheet and scripts into one self-contained file, so
// the prototype opens anywhere (file preview, phone, AirDrop) without a server.
// Run from repo root via ./scripts/build.sh [dev|release]
// "release" leaves the dev sample questions out of the bundle entirely, swaps
// the imported bank for its approved-only file, and sets ITE.BUILD_MODE so only
// approved questions can be shown.
const args = typeof scriptArgs !== "undefined" ? scriptArgs : arguments;
const mode = args[0] || "dev";
if (mode !== "dev" && mode !== "release") throw new Error(`unknown build mode: ${mode}`);

let html = readFile("index.html");
html = html.replace(/<link rel="stylesheet" href="([^"]+)" \/>/g, (_, href) => `<style>\n${readFile(href)}</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  if (mode === "release" && src.includes("dev_sample_questions")) return "";
  if (mode === "release" && src === "src/data/question_bank.js") src = "src/data/question_bank.release.js";
  if (mode === "release" && src === "src/data/story_bank.js") src = "src/data/story_bank.release.js";
  if (mode === "release" && src === "src/ui/review.js") return ""; // teacher review is dev-only
  return `<script>\n${readFile(src).replace(/<\/script/gi, "<\\/script")}</script>`;
});
html = html.replace("<body>", `<body>\n<script>(globalThis.ITE = globalThis.ITE || {}).BUILD_MODE = ${JSON.stringify(mode)};</script>`);
print(html);
