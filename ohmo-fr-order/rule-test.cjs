const { parseOrderText } = require("./parser-test.cjs");
const { defaultProducts, validateOrderRules } = require("./products-test.cjs");

let pass = 0, failCount = 0;
function check(label, cond, extra) {
  if (cond) { pass++; console.log("PASS", label); }
  else { failCount++; console.log("FAIL", label, extra ?? ""); }
}

// ---- 别名/改名解析 ----
const cases = [
  ["芒果原浆2箱", "冷冻芒果原浆", 25],
  ["红苹果原浆3箱", "冷冻红苹果原浆", 26],
  ["葡萄原浆1箱", "冷冻葡萄原浆", 27],
  ["定制石榴汁30瓶", "冷冻定制石榴汁", 28],
  ["石榴汁30瓶", "冷冻定制石榴汁", 28],
  ["冷冻凤梨浆2箱", "冷冻凤梨浆", 29],
  ["小麦草原浆1箱", "冷冻小麦草原浆", 49],
  ["小麦草冷冻原浆1箱", "冷冻小麦草原浆", 49],
  ["拱盖1箱", "透明拱盖", 14],
  ["直饮盖2箱", "透明直饮盖", 15],
  ["500冷饮杯1箱", "透明500冷饮杯", 16],
  ["500杯1箱", "透明500冷饮杯", 16],
  ["700冷饮杯1箱", "透明700冷饮杯", 17],
  ["咖奶5箱", "咖奶", 44],
  ["咖奶5箱起订", "咖奶", 44], // 备注干扰词去除后数量仍=5
];
for (const [text, name, id] of cases) {
  const r = parseOrderText(text)[0];
  const p = r.productId != null ? defaultProducts.find((x) => x.id === r.productId) : null;
  check(`parse "${text}" -> ${name}`, r.productId === id && p?.name === name && r.quantity != null,
    JSON.stringify({ matched: r.matchedProduct, id: r.productId, qty: r.quantity }));
}

// ---- 价格抽查 ----
const priceChecks = [
  [1, 350], [3, 870], [6, 780], [14, 100], [16, 320], [25, 300], [27, 384], [28, 30], [44, 312], [49, 175], [56, 200],
];
for (const [id, price] of priceChecks) {
  const p = defaultProducts.find((x) => x.id === id);
  check(`price ${p?.name}=${price}`, p?.price === price, String(p?.price));
}
check("石榴汁单位=瓶", defaultProducts.find((x) => x.id === 28)?.unit === "瓶");
check("带*共5个", defaultProducts.filter((p) => p.starred).length === 5, String(defaultProducts.filter((p) => p.starred).map((p) => p.name)));

// ---- 起订规则 ----
const P = (id, qty) => ({ productId: id, qty });
check("冷冻芒果2箱(24瓶)→blocked", validateOrderRules([P(25, 2)])?.includes("24") === true, validateOrderRules([P(25, 2)]));
check("芒果2箱+小麦草1箱=30瓶→pass", validateOrderRules([P(25, 2), P(49, 1)]) === null, validateOrderRules([P(25, 2), P(49, 1)]));
check("芒果2箱+石榴汁5瓶=29瓶→blocked", validateOrderRules([P(25, 2), P(28, 5)]) !== null, validateOrderRules([P(25, 2), P(28, 5)]));
check("芒果2箱+石榴汁6瓶=30瓶→pass", validateOrderRules([P(25, 2), P(28, 6)]) === null);
check("不订冷冻品→不触发", validateOrderRules([P(30, 1)]) === null);
check("葡萄原浆(无*)不参与30瓶", validateOrderRules([P(27, 2)]) === null, validateOrderRules([P(27, 2)]));
check("咖奶3箱→blocked", validateOrderRules([P(44, 3)])?.includes("5 箱起订") === true);
check("咖奶5箱→pass", validateOrderRules([P(44, 5)]) === null);
check("500杯1箱→blocked", validateOrderRules([P(16, 1)]) !== null);
check("500杯1箱+直饮盖1箱=2箱→pass", validateOrderRules([P(16, 1), P(15, 1)]) === null);
check("4项各1箱=4箱→pass", validateOrderRules([P(14, 1), P(15, 1), P(16, 1), P(17, 1)]) === null);
check("冷冻荔枝(20斤/箱)不在规则内", validateOrderRules([P(56, 1)]) === null);
check("冷冻品+咖奶同时不满足→报冷冻", (validateOrderRules([P(25, 1), P(44, 2)]) || "").includes("瓶"));

// ---- 新品：1L杯/盖/贴纸 ----
check("parse 1L装杯子2箱", (() => { const r = parseOrderText("1L装杯子2箱")[0]; return r.productId === 57 && r.quantity === 2; })());
check("parse 1L盖子2箱", (() => { const r = parseOrderText("1L盖子2箱")[0]; return r.productId === 58 && r.quantity === 2; })());
check("parse 1L杯贴纸3套", (() => { const r = parseOrderText("1L杯贴纸3套")[0]; return r.productId === 59 && r.quantity === 3; })());
check("1L杯不带盖→blocked", (validateOrderRules([P(57, 2)]) || "").includes("1L盖子"));
check("1L盖不带杯→blocked", (validateOrderRules([P(58, 2)]) || "").includes("1L装杯子"));
check("1L杯+盖→pass", validateOrderRules([P(57, 2), P(58, 2)]) === null);
check("贴纸不参与搭配规则", validateOrderRules([P(59, 3)]) === null);
check("parse 工服冬装5件", (() => { const r = parseOrderText("工服冬装5件")[0]; return r.productId === 60 && r.quantity === 5; })());
check("parse 工服3件(别名)", (() => { const r = parseOrderText("工服3件")[0]; return r.productId === 60 && r.quantity === 3; })());
{
  const p = defaultProducts.find((x) => x.id === 60);
  check("工服冬装 110/件+备注", p?.price === 110 && p?.unit === "件" && p?.note === "定制1-2周到货");
}

// ---- 服务端同款逻辑（从云函数源码提取） ----
const fs = require("fs");
const src = fs.readFileSync("D:/workbuddy storage/2026-10-05-14-30-24/purchase-order-tool/cloudfunctions/fr-api/index.js", "utf8");
const start = src.indexOf("const FROZEN_BOTTLES_PER");
const end = src.indexOf("async function createOrder");
const serverFn = new Function(`
  ${src.slice(start, end)}
  return validateOrderRules;
`)();
const mkServer = (id, qty, name) => ({ productId: id, qty, name: name || String(id) });
check("SR 冷冻芒果2箱→blocked", (serverFn([mkServer(25, 2, "冷冻芒果原浆")]) || "").includes("24 瓶"));
check("SR 芒果2箱+小麦草1箱→pass", serverFn([mkServer(25, 2, "冷冻芒果原浆"), mkServer(49, 1, "冷冻小麦草原浆")]) === null);
check("SR 咖奶3箱→blocked", (serverFn([mkServer(44, 3, "咖奶")]) || "").includes("5 箱起订"));
check("SR 杯盖1箱→blocked", serverFn([mkServer(16, 1, "透明500冷饮杯")]) !== null);
check("SR 杯盖2箱→pass", serverFn([mkServer(14, 1, "透明拱盖"), mkServer(16, 1, "透明500冷饮杯")]) === null);
check("SR 不订触发品→pass", serverFn([mkServer(30, 1, "牛奶")]) === null);
check("SR 1L杯不带盖→blocked", (serverFn([mkServer(57, 2, "1L装杯子")]) || "").includes("1L盖子"));
check("SR 1L杯+盖→pass", serverFn([mkServer(57, 2, "1L装杯子"), mkServer(58, 2, "1L盖子")]) === null);

console.log(`\n===== ${pass} passed, ${failCount} failed =====`);
process.exit(failCount ? 1 : 0);
