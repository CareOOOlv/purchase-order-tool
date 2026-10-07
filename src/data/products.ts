export interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  note: string;
  /** 带 * 号（红字提醒）：参与「每单合计满30瓶起订」规则 */
  starred?: boolean;
  /** 每箱瓶数（用于 30 瓶起订折算）；按瓶计价的商品为 1 */
  bottlesPerBox?: number;
  /**
   * 起订规则分组：
   * - frozen30: 带*冷冻品，合计满 30 瓶起订（不满 30 瓶无法发货；一件不订则不触发）
   * - kamilk5:  咖奶 5 箱起订
   * - cups2:    直饮盖/拱盖/500杯/700杯 合计满 2 箱起订（整箱，不接受拼箱）
   */
  minRule?: "frozen30" | "kamilk5" | "cups2";
}

/** 带*产品红字提醒文案（表头、商品备注、底部栏共用） */
export const STARRED_NOTICE = "带 * 产品每单合计需满 30 瓶起订，不满 30 瓶无法发货";

export const CUPS_NOTICE = "透明直饮盖 / 透明拱盖 / 透明500冷饮杯 / 透明700冷饮杯 合计满 2 箱起订（整箱）";
export const KAMILK_NOTICE = "咖奶 5 箱起订";

// 单价与定价表（ohmo 订货表.xlsx）一致：
// - 包装类按「箱」计价（箱价 = 单价 × 装箱数）
// - 冷冻定制石榴汁按「瓶」计价
export const defaultProducts: Product[] = [
  { id: 1, name: "透明单杯袋", price: 350, unit: "箱", quantity: 0, note: "一箱500个" },
  { id: 2, name: "透明双杯袋", price: 375, unit: "箱", quantity: 0, note: "一箱500个" },
  { id: 3, name: "透明单杯托", price: 870, unit: "箱", quantity: 0, note: "一箱3000个" },
  { id: 4, name: "透明双杯托", price: 600, unit: "箱", quantity: 0, note: "一箱1500个" },
  { id: 5, name: "保温单杯袋", price: 600, unit: "箱", quantity: 0, note: "一箱1000个" },
  { id: 6, name: "保温双杯袋", price: 780, unit: "箱", quantity: 0, note: "一箱1000个" },
  { id: 7, name: "四杯纸托", price: 128, unit: "箱", quantity: 0, note: "一箱400个" },
  { id: 8, name: "保温4杯袋", price: 1000, unit: "箱", quantity: 0, note: "一箱1000个" },
  { id: 9, name: "保温袋纸拖", price: 120, unit: "箱", quantity: 0, note: "" },
  { id: 10, name: "杯套", price: 360, unit: "箱", quantity: 0, note: "" },
  { id: 11, name: "外卖封口贴", price: 9, unit: "卷", quantity: 0, note: "" },
  { id: 12, name: "定制粗吸管", price: 210, unit: "箱", quantity: 0, note: "一箱2000个" },
  { id: 13, name: "定制细吸管", price: 210, unit: "箱", quantity: 0, note: "一箱5000个" },
  { id: 14, name: "透明拱盖", price: 100, unit: "箱", quantity: 0, note: "合计满2箱起订", minRule: "cups2" },
  { id: 15, name: "透明直饮盖", price: 140, unit: "箱", quantity: 0, note: "合计满2箱起订", minRule: "cups2" },
  { id: 16, name: "透明500冷饮杯", price: 320, unit: "箱", quantity: 0, note: "一箱1000个 · 合计满2箱起订", minRule: "cups2" },
  { id: 17, name: "透明700冷饮杯", price: 380, unit: "箱", quantity: 0, note: "一箱1000个 · 合计满2箱起订", minRule: "cups2" },
  { id: 18, name: "泰式盖", price: 180, unit: "箱", quantity: 0, note: "" },
  { id: 19, name: "茶叶", price: 1300, unit: "箱", quantity: 0, note: "1箱30包" },
  { id: 20, name: "胶带", price: 190, unit: "套", quantity: 0, note: "40个加底座" },
  { id: 21, name: "口罩", price: 0.4, unit: "个", quantity: 0, note: "" },
  { id: 22, name: "五味子糖浆", price: 85, unit: "瓶", quantity: 0, note: "" },
  { id: 23, name: "香蕉粉", price: 100, unit: "袋", quantity: 0, note: "一袋800克" },
  { id: 24, name: "桃子粉", price: 672, unit: "箱", quantity: 0, note: "一箱12袋" },
  { id: 25, name: "冷冻芒果原浆", price: 300, unit: "箱", quantity: 0, note: "一箱12瓶 · 带*每单合计满30瓶起订", starred: true, bottlesPerBox: 12, minRule: "frozen30" },
  { id: 26, name: "冷冻红苹果原浆", price: 324, unit: "箱", quantity: 0, note: "一箱12瓶 · 带*每单合计满30瓶起订", starred: true, bottlesPerBox: 12, minRule: "frozen30" },
  { id: 27, name: "冷冻葡萄原浆", price: 384, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 28, name: "冷冻定制石榴汁", price: 30, unit: "瓶", quantity: 0, note: "按瓶计价 · 带*每单合计满30瓶起订", starred: true, bottlesPerBox: 1, minRule: "frozen30" },
  { id: 29, name: "冷冻凤梨浆", price: 336, unit: "箱", quantity: 0, note: "一箱12瓶 · 带*每单合计满30瓶起订", starred: true, bottlesPerBox: 12, minRule: "frozen30" },
  { id: 30, name: "牛奶", price: 82, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 31, name: "厚椰乳", price: 132, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 32, name: "青苹果羽衣甘蓝", price: 42, unit: "瓶", quantity: 0, note: "一箱8瓶" },
  { id: 33, name: "接骨木莫林", price: 70, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 34, name: "绿薄荷莫林", price: 70, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 35, name: "水蜜桃莫林", price: 70, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 36, name: "柠檬莫林", price: 70, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 37, name: "可可红茶上允", price: 178, unit: "箱", quantity: 0, note: "一箱6瓶" },
  { id: 38, name: "定制款草莓", price: 400, unit: "箱", quantity: 0, note: "一箱8瓶，1kg/瓶" },
  { id: 39, name: "红苹果上允", price: 175, unit: "箱", quantity: 0, note: "一箱6瓶" },
  { id: 40, name: "定制款玫瑰", price: 580, unit: "箱", quantity: 0, note: "一箱8瓶，1kg/瓶" },
  { id: 41, name: "桃子上允", price: 232, unit: "箱", quantity: 0, note: "一箱8瓶" },
  { id: 42, name: "葡萄上允", price: 232, unit: "箱", quantity: 0, note: "一箱8瓶" },
  { id: 43, name: "抹茶粉", price: 100, unit: "袋", quantity: 0, note: "一袋250克" },
  { id: 44, name: "咖奶", price: 312, unit: "箱", quantity: 0, note: "一箱12瓶 · 5箱起订", minRule: "kamilk5" },
  { id: 45, name: "杏茶", price: 268, unit: "箱", quantity: 0, note: "一箱8瓶" },
  { id: 46, name: "芭乐上允", price: 232, unit: "箱", quantity: 0, note: "一箱8瓶" },
  { id: 47, name: "芭乐果酱", price: 328, unit: "箱", quantity: 0, note: "一箱8支" },
  { id: 48, name: "树番茄上允", price: 132, unit: "箱", quantity: 0, note: "一箱6瓶" },
  { id: 49, name: "冷冻小麦草原浆", price: 175, unit: "箱", quantity: 0, note: "一箱6瓶 · 带*每单合计满30瓶起订", starred: true, bottlesPerBox: 6, minRule: "frozen30" },
  { id: 50, name: "白薄荷莫林", price: 70, unit: "瓶", quantity: 0, note: "一瓶" },
  { id: 51, name: "青梅上允", price: 160, unit: "箱", quantity: 0, note: "一箱6瓶" },
  { id: 52, name: "啤酒花上允", price: 160, unit: "箱", quantity: 0, note: "一箱6瓶" },
  { id: 53, name: "荔枝上允", price: 240, unit: "箱", quantity: 0, note: "一箱8瓶" },
  { id: 54, name: "桑葚冷冻原浆", price: 338, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 55, name: "百香果上允", price: 232, unit: "箱", quantity: 0, note: "一箱8瓶" },
  { id: 56, name: "冷冻荔枝", price: 200, unit: "箱", quantity: 0, note: "一箱20斤" },
];

// ==================== 起订规则校验（客户端与服务端共用逻辑说明） ====================
// 返回 null 表示通过；返回字符串为不通过原因
export function validateOrderRules(
  items: { productId: number; qty: number }[]
): string | null {
  const map = new Map(defaultProducts.map((p) => [p.id, p]));

  // 规则1：带*冷冻品合计满30瓶（一件不订则不触发）
  let frozenBottles = 0;
  const frozenNames: string[] = [];
  for (const it of items) {
    const p = map.get(it.productId);
    if (p?.minRule === "frozen30" && it.qty > 0) {
      frozenBottles += it.qty * (p.bottlesPerBox || 1);
      frozenNames.push(p.name);
    }
  }
  if (frozenBottles > 0 && frozenBottles < 30) {
    return `带 * 冷冻品（${frozenNames.join("、")}）合计 ${frozenBottles} 瓶，不满 30 瓶无法发货，还需 ${30 - frozenBottles} 瓶`;
  }

  // 规则2：咖奶 5 箱起订
  const kamilk = items.find((it) => map.get(it.productId)?.minRule === "kamilk5" && it.qty > 0);
  if (kamilk && kamilk.qty < 5) {
    return `咖奶 5 箱起订，当前 ${kamilk.qty} 箱`;
  }

  // 规则3：杯盖四品合计满2箱（整箱）
  let cupsQty = 0;
  const cupNames: string[] = [];
  for (const it of items) {
    const p = map.get(it.productId);
    if (p?.minRule === "cups2" && it.qty > 0) {
      cupsQty += it.qty;
      cupNames.push(p.name);
    }
  }
  if (cupsQty > 0 && cupsQty < 2) {
    return `透明直饮盖 / 透明拱盖 / 透明500冷饮杯 / 透明700冷饮杯 合计满 2 箱起订，当前合计 ${cupsQty} 箱`;
  }

  return null;
}
