const fs = require("fs");
const src = fs.readFileSync("online-bundle.js", "utf8");
const keyItems = ["透明单杯袋","透明双杯袋","透明单杯托","透明双杯托","保温单杯袋","保温双杯袋","四杯纸托","保温4杯袋","保温袋纸拖","杯套","外卖封口贴","定制粗吸管","定制细吸管","透明拱盖","透明直饮盖","透明500冷饮杯","透明700冷饮杯","泰式盖","茶叶","胶带","口罩","五味子糖浆","香蕉粉","桃子粉","冷冻芒果原浆","冷冻红苹果原浆","冷冻葡萄原浆","冷冻定制石榴汁","冷冻凤梨浆","牛奶","厚椰乳","青苹果羽衣甘蓝","接骨木莫林","绿薄荷莫林","水蜜桃莫林","柠檬莫林","可可红茶上允","定制款草莓","红苹果上允","定制款玫瑰","桃子上允","葡萄上允","抹茶粉","咖奶","杏茶","芭乐上允","芭乐果酱","树番茄上允","冷冻小麦草原浆","白薄荷莫林","青梅上允","啤酒花上允","荔枝上允","桑葚冷冻原浆","百香果上允","冷冻荔枝"];
const re = /\{[^{}]*?name:\s*"([^"]+)"[^{}]*?\}/g;
const map = {};
let m;
while ((m = re.exec(src)) !== null) {
  const obj = m[0];
  const name = m[1];
  if (!keyItems.includes(name)) continue;
  const price = obj.match(/price:\s*([\d.]+e\d?|\d.+)/);
  const unit = obj.match(/unit:\s*"([^"]+)"/);
  const bpb = obj.match(/bottlesPerBox:\s*(\d+)/);
  map[name] = {
    price: price ? Number(price[1]) : null,
    unit: unit ? unit[1] : null,
    starred: /starred:\s*(!0|true)/.test(obj),
    bottlesPerBox: bpb ? Number(bpb[1]) : null,
  };
}
const missing = keyItems.filter((k) => !map[k]);
console.log("found", Object.keys(map).length, "/", keyItems.length);
if (missing.length) console.log("MISSING:", missing.join(","));
for (const k of keyItems) {
  const v = map[k];
  if (v) console.log(`${k}  price=${v.price}  unit=${v.unit}${v.starred ? "  [*]" : ""}${v.bottlesPerBox ? "  " + v.bottlesPerBox + "瓶/箱" : ""}`);
}
