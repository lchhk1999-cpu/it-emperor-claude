// APPROVED by the user on 2026-10-30: character variants (品種).
// Seven families, each with 4-5 variants. Existing workbook characters keep
// their numbers; new variants derive from the family's R-level base:
// R x1.00, SR x1.05, SSR x1.10 (user: "稍強一點"). Specialty and bonus are
// shared by the whole family.
//
// Run from the repo root:
//   ./scripts/jsc.sh tools/character_variants_proposal.js -- csv   > docs/proposals/character_variants.csv
//   ./scripts/jsc.sh tools/character_variants_proposal.js -- board > <canvas>/project/Variants.dc.html
const args = typeof scriptArgs !== "undefined" ? scriptArgs : arguments;
const mode = args[0] || "csv";

load("src/data/game_data.js");
load("src/ui/sprites.js");
load("src/ui/characters.js");

const MULT = { R: 1.0, SR: 1.05, SSR: 1.1 };

// [family id, family name, original character id, [[id, name, rarity, look note], ...]]
const FAMILIES = [
  ["FAM-ITDOG", "IT狗系列", "CH-ITDOG", [
    ["CH-ITDOG", "IT狗", "R", "柴犬；黃色衛衣、藍耳機"],
    ["CH-ITDOG-CORGI", "柯基 IT狗", "R", "橙色毛、尖耳、薄荷衛衣"],
    ["CH-ITDOG-HUSKY", "哈士奇 IT狗", "SR", "灰白毛、白色面紋、藍眼"],
    ["CH-ITDOG-GOLDEN", "黃金獵犬 IT狗", "SR", "金毛、戴眼鏡、珊瑚衛衣"],
    ["CH-ITDOG-MECHA", "機械老虎狗", "SSR", "老虎狗：虎紋、額頭「王」字、機械盔甲及天線、胸口光核（2026-10-31 改）"],
  ]],
  ["FAM-DB", "數據庫師系列", "CH-DB", [
    ["CH-DB-JR", "見習數據庫師", "R", "薄荷貝雷帽、淺藍資料庫"],
    ["CH-DB", "數據庫師", "SR", "白色實驗袍、藍色貝雷帽"],
    ["CH-DB-INDEX", "索引大師", "SR", "啡髮、眼鏡、珊瑚貝雷帽"],
    ["CH-DB-CHIEF", "首席數據庫師", "SSR", "紫色長袍、金色貝雷帽及星章、金色資料庫"],
  ]],
  ["FAM-GOLD", "職員系列", "CH-GOLD", [
    ["CH-GOLD-BRONZE", "青銅職員", "R", "銅色西裝、藍領帶"],
    ["CH-GOLD-SILVER", "白銀職員", "R", "銀色西裝、珊瑚領帶"],
    ["CH-GOLD", "黃金職員", "SR", "金色西裝、珊瑚領帶"],
    ["CH-GOLD-DIAMOND", "鑽石職員", "SSR", "鑽石藍西裝、紫領帶、閃光"],
  ]],
  ["FAM-HACK", "白帽黑客系列", "CH-HACK", [
    ["CH-HACK-ROOKIE", "見習白帽", "R", "淺灰連帽衣、深藍鏡片"],
    ["CH-HACK", "黑客", "SR", "灰色連帽衣、墨鏡、鎖頭電腦"],
    ["CH-HACK-FIREWALL", "防火牆騎士", "SR", "珊瑚色連帽衣、盾牌電腦"],
    ["CH-HACK-LEGEND", "白帽傳說", "SSR", "白色金邊連帽衣、白帽子、盾牌電腦"],
  ]],
  ["FAM-OFFICE", "辦公室系列", "CH-OFFICE", [
    ["CH-OFFICE-INTERN", "實習生", "R", "黑色短髮、黃色背心"],
    ["CH-OFFICE", "辦公室職員", "R", "髮髻、薄荷背心、試算表板"],
    ["CH-OFFICE-LEAD", "試算表主任", "SR", "眼鏡、藍色背心"],
    ["CH-OFFICE-PIVOT", "樞紐分析師", "SR", "黑髮髻、紫色背心、銀色表板"],
    ["CH-OFFICE-QUEEN", "公式女王", "SSR", "金色后冠、珊瑚背心、金色表板"],
  ]],
  ["FAM-BROADBAND", "網絡工程系列", "CH-BROADBAND", [
    ["CH-BROADBAND", "寬頻職員", "R", "黃色安全帽、網線捲"],
    ["CH-BROADBAND-FIBRE", "光纖技師", "R", "白色安全帽、發光光纖"],
    ["CH-BROADBAND-ROUTER", "路由器隊長", "SR", "藍色安全帽、天線"],
    ["CH-BROADBAND-5G", "5G 工程師", "SR", "紫色安全帽、5G 標誌"],
    ["CH-BROADBAND-CHIEF", "網絡總指揮", "SSR", "金色安全帽、耳機咪、深藍制服"],
  ]],
  ["FAM-AIBOT", "機械人系列", "CH-AIBOT", [
    ["CH-AIBOT-STUDY", "學習機械人", "R", "白頭、薄荷身、綠色眼燈"],
    ["CH-AIBOT-CHAT", "對話機械人", "SR", "藍身、對話氣泡"],
    ["CH-AIBOT", "人工智能機械人", "SSR", "銀頭、紫身、藍色眼燈"],
    ["CH-AIBOT-QUANTUM", "量子機械人", "SSR", "深藍機身、金色眼燈、量子光環"],
  ]],
];

const byId = Object.fromEntries(ITE.gameData.characters.map((c) => [c.id, c]));

function rows() {
  const out = [];
  for (const [famId, famName, baseId, variants] of FAMILIES) {
    const base = byId[baseId];
    const baseAtk = base.attack / MULT[base.rarity];
    const baseHp = base.hp / MULT[base.rarity];
    for (const [id, name, rarity, look] of variants) {
      const existing = byId[id];
      out.push({
        famId, famName, id, name, rarity, look,
        specialty: base.specialty,
        attack: existing ? existing.attack : Math.round(baseAtk * MULT[rarity]),
        hp: existing ? existing.hp : Math.round(baseHp * MULT[rarity]),
        bonus: Math.round(base.bonus * 100),
        existing: !!existing,
      });
    }
  }
  return out;
}

function csv() {
  const cols = ["character_id", "character_name", "specialty_topic", "rarity", "base_attack", "base_hp", "topic_bonus_pct",
    "max_evolution", "equipment_slots_initial", "active", "family_id", "family_name", "note"];
  const lines = [cols.join(",")];
  for (const r of rows()) {
    lines.push([r.id, r.name, r.specialty, r.rarity, r.attack, r.hp, r.bonus, 3, 1, "yes", r.famId, r.famName,
      r.existing ? "現有角色（數值不變，只補 family 欄）" : "新增品種"].join(","));
  }
  return lines.join("\n") + "\n";
}

const TOPIC = { PY_BASIC: "Python 基礎編程", SQL: "SQL", HARDWARE: "CPU RAM 儲存", SECURITY: "網絡安全與私隱", EXCEL: "Excel 公式函數", NET_DEVICE: "網絡硬件", ALL: "全部課題" };
const RARITY_BG = { R: "#e2e5ea", SR: "#8fc3e8", SSR: "#f4d36b" };

function board() {
  const all = rows();
  const count = (r) => all.filter((x) => x.rarity === r).length;
  const card = (r) => `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; width: 236px; padding: 12px 10px; box-sizing: border-box; background: ${r.rarity === "SSR" ? "#fff8e1" : "#ffffff"}; border: 3px solid #3b3330; border-radius: 22px;">
          <div style="width: 120px;">${ITE.sprites.character(r.id, "idle").replace('class="sprite"', 'width="120" height="146"')}</div>
          <div style="display: flex; align-items: center; gap: 6px;"><b style="font-size: 18px;">${r.name}</b><span style="padding: 0 7px; font-size: 12px; font-weight: 900; background: ${RARITY_BG[r.rarity]}; border: 2px solid #3b3330; border-radius: 6px;">${r.rarity}</span></div>
          <span style="font-size: 13px; font-weight: 700;">攻擊 ${r.attack}｜HP ${r.hp}${r.existing ? "（現有）" : ""}</span>
          <span style="font-size: 12px; color: #5e534d; text-align: center; line-height: 1.4;">${r.look}</span>
        </div>`;
  const families = FAMILIES.map(([famId, famName]) => {
    const list = all.filter((r) => r.famId === famId);
    return `
    <section style="display: flex; gap: 18px; align-items: stretch;">
      <div style="width: 170px; flex: none; display: flex; flex-direction: column; justify-content: center; gap: 6px;">
        <b style="font-size: 22px;">${famName}</b>
        <span style="font-size: 14px; color: #5e534d;">專長：${TOPIC[list[0].specialty]}</span>
        <span style="font-size: 14px; color: #5e534d;">專長加成 +${list[0].bonus}%</span>
      </div>
      <div style="display: flex; gap: 14px;">${list.map(card).join("")}
      </div>
    </section>`;
  }).join("");
  return `<!doctype html>
<html lang="zh-Hant-HK">
<head>
<meta charset="utf-8">
<title>IT帝 角色品種候選稿</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
body{margin:0}
</style>
</helmet>
<div style="width: 1500px; height: 2050px; box-sizing: border-box; padding: 44px 48px; background: #fbf6ee; color: #3b3330; font-family: 'Noto Sans TC', 'PingFang HK', sans-serif; display: flex; flex-direction: column; gap: 22px;">
  <header style="display: flex; justify-content: space-between; align-items: flex-end; gap: 24px;">
    <div style="display: flex; flex-direction: column; gap: 6px;">
      <p style="margin: 0; font-size: 15px; font-weight: 700; letter-spacing: 0.08em; color: #8a5a2b;">PROPOSAL · 待用戶核准 · 由遊戲繪圖程式直接產生</p>
      <h1 style="margin: 0; font-size: 42px; font-weight: 900;">角色品種候選稿：7 個系列、${all.length} 個品種</h1>
    </div>
    <p style="margin: 0; max-width: 560px; font-size: 15px; line-height: 1.6; color: #5e534d;">R ${count("R")}｜SR ${count("SR")}｜SSR ${count("SSR")}。同系列專長相同；SR 攻擊／HP +5%、SSR +10%（以系列 R 級為基準）。現有 7 個角色數值不變。</p>
  </header>${families}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1500,"height":2050}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
}

print(mode === "board" ? board() : csv());
