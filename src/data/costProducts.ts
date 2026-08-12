export interface CostProduct {
  id: number;
  name: string;
  costPrice: number; // 成本单价
  salePrice: number; // 售价（即采购工具中的单价）
  unit: string;
  quantity: number;
  note: string;
}

export const defaultCostProducts: CostProduct[] = [
  { id: 1, name: "透明单杯袋", costPrice: 0.45, salePrice: 0.7, unit: "个", quantity: 0, note: "" },
  { id: 2, name: "透明双杯袋", costPrice: 0.495, salePrice: 0.75, unit: "个", quantity: 0, note: "" },
  { id: 3, name: "透明单杯托", costPrice: 0.215, salePrice: 0.29, unit: "个", quantity: 0, note: "" },
  { id: 4, name: "透明双杯托", costPrice: 0.315, salePrice: 0.4, unit: "个", quantity: 0, note: "" },
  { id: 5, name: "保温单杯袋", costPrice: 0.41, salePrice: 0.725, unit: "个", quantity: 0, note: "" },
  { id: 6, name: "保温双杯袋", costPrice: 0.505, salePrice: 0.84, unit: "个", quantity: 0, note: "" },
  { id: 7, name: "四杯托", costPrice: 170, salePrice: 200, unit: "箱", quantity: 0, note: "一箱1000个" },
  { id: 8, name: "保温4杯袋", costPrice: 720, salePrice: 1000, unit: "箱", quantity: 0, note: "一箱1000个，单个1元" },
  { id: 9, name: "保温袋纸拖", costPrice: 105, salePrice: 120, unit: "箱", quantity: 0, note: "" },
  { id: 10, name: "杯套", costPrice: 275, salePrice: 360, unit: "箱", quantity: 0, note: "" },
  { id: 11, name: "外卖封口贴", costPrice: 6, salePrice: 9, unit: "卷", quantity: 0, note: "" },
  { id: 12, name: "定制粗吸管", costPrice: 135, salePrice: 210, unit: "箱", quantity: 0, note: "一箱2000个" },
  { id: 13, name: "定制细吸管", costPrice: 125, salePrice: 210, unit: "箱", quantity: 0, note: "一箱5000个" },
  { id: 14, name: "拱盖", costPrice: 82, salePrice: 100, unit: "箱", quantity: 0, note: "两箱起定" },
  { id: 15, name: "直饮盖", costPrice: 120, salePrice: 140, unit: "箱", quantity: 0, note: "两箱起定" },
  { id: 16, name: "500冷饮杯", costPrice: 240, salePrice: 320, unit: "箱", quantity: 0, note: "一箱1000个" },
  { id: 17, name: "700冷饮杯", costPrice: 292, salePrice: 380, unit: "箱", quantity: 0, note: "一箱1000个" },
  { id: 18, name: "泰式盖", costPrice: 160, salePrice: 180, unit: "箱", quantity: 0, note: "" },
  { id: 19, name: "茶叶", costPrice: 1050, salePrice: 1300, unit: "箱", quantity: 0, note: "1箱30包" },
  { id: 20, name: "胶带", costPrice: 180, salePrice: 190, unit: "套", quantity: 0, note: "40个加底座" },
  { id: 21, name: "口罩", costPrice: 0.35, salePrice: 0.4, unit: "个", quantity: 0, note: "" },
  { id: 22, name: "五味子糖浆", costPrice: 75, salePrice: 85, unit: "瓶", quantity: 0, note: "" },
  { id: 23, name: "香蕉粉", costPrice: 80, salePrice: 100, unit: "袋", quantity: 0, note: "" },
  { id: 24, name: "桃子粉", costPrice: 642, salePrice: 672, unit: "箱", quantity: 0, note: "1箱12袋" },
  { id: 25, name: "芒果原浆", costPrice: 216, salePrice: 300, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 26, name: "红苹果原浆", costPrice: 252, salePrice: 324, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 27, name: "葡萄原浆", costPrice: 312, salePrice: 384, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 28, name: "定制石榴汁", costPrice: 25, salePrice: 30, unit: "瓶", quantity: 0, note: "一箱12瓶" },
  { id: 29, name: "冷冻凤梨浆", costPrice: 264, salePrice: 336, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 30, name: "牛奶", costPrice: 68, salePrice: 82, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 31, name: "厚椰乳", costPrice: 120, salePrice: 132, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 32, name: "青苹果羽衣甘蓝", costPrice: 38, salePrice: 42, unit: "瓶", quantity: 0, note: "一箱8瓶" },
  { id: 33, name: "接骨木莫林", costPrice: 63, salePrice: 70, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 34, name: "绿薄荷莫林", costPrice: 63, salePrice: 70, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 35, name: "水蜜桃莫林", costPrice: 63, salePrice: 70, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 36, name: "柠檬莫林", costPrice: 63, salePrice: 70, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 37, name: "可可红茶上允", costPrice: 162, salePrice: 178, unit: "箱", quantity: 0, note: "" },
  { id: 38, name: "草莓上允", costPrice: 150, salePrice: 166, unit: "箱", quantity: 0, note: "" },
  { id: 39, name: "红苹果上允", costPrice: 150, salePrice: 175, unit: "箱", quantity: 0, note: "" },
  { id: 40, name: "玫瑰上允", costPrice: 186, salePrice: 228, unit: "箱", quantity: 0, note: "" },
  { id: 41, name: "桃子上允", costPrice: 200, salePrice: 232, unit: "箱", quantity: 0, note: "" },
  { id: 42, name: "葡萄上允", costPrice: 200, salePrice: 232, unit: "箱", quantity: 0, note: "" },
  { id: 43, name: "抹茶粉", costPrice: 80, salePrice: 80, unit: "袋", quantity: 0, note: "" },
  // 咖奶已删除
  { id: 45, name: "杏茶", costPrice: 216, salePrice: 268, unit: "箱", quantity: 0, note: "" },
  { id: 46, name: "芭乐上允", costPrice: 200, salePrice: 232, unit: "箱", quantity: 0, note: "" },
  { id: 47, name: "芭乐果酱", costPrice: 324, salePrice: 328, unit: "箱", quantity: 0, note: "" },
];
