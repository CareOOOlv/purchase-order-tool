export interface SimpleCostProduct {
  id: number;
  name: string;
  costPrice: number;
  unit: string;
  quantity: number;
  note: string;
  costPending?: boolean; // true = 成本价待补（暂灰显）
}

export const defaultSimpleCostProducts: SimpleCostProduct[] = [
  { id: 1, name: "透明单杯袋", costPrice: 0.45, unit: "个", quantity: 0, note: "" },
  { id: 2, name: "透明双杯袋", costPrice: 0.495, unit: "个", quantity: 0, note: "" },
  { id: 3, name: "透明单杯托", costPrice: 0.215, unit: "个", quantity: 0, note: "" },
  { id: 4, name: "透明双杯托", costPrice: 0.315, unit: "个", quantity: 0, note: "" },
  { id: 5, name: "保温单杯袋", costPrice: 0.41, unit: "个", quantity: 0, note: "" },
  { id: 6, name: "保温双杯袋", costPrice: 0.505, unit: "个", quantity: 0, note: "" },
  { id: 7, name: "四杯纸托", costPrice: 100, unit: "箱", quantity: 0, note: "一箱400个可拆卸" },
  { id: 8, name: "保温4杯袋", costPrice: 720, unit: "箱", quantity: 0, note: "一箱1000个" },
  { id: 9, name: "保温袋纸拖", costPrice: 105, unit: "箱", quantity: 0, note: "" },
  { id: 10, name: "杯套", costPrice: 275, unit: "箱", quantity: 0, note: "" },
  { id: 11, name: "外卖封口贴", costPrice: 6, unit: "卷", quantity: 0, note: "" },
  { id: 12, name: "定制粗吸管", costPrice: 135, unit: "箱", quantity: 0, note: "一箱2000个" },
  { id: 13, name: "定制细吸管", costPrice: 125, unit: "箱", quantity: 0, note: "一箱5000个" },
  { id: 14, name: "拱盖", costPrice: 82, unit: "箱", quantity: 0, note: "两箱起定" },
  { id: 15, name: "直饮盖", costPrice: 120, unit: "箱", quantity: 0, note: "两箱起定" },
  { id: 16, name: "500冷饮杯", costPrice: 240, unit: "箱", quantity: 0, note: "一箱1000个" },
  { id: 17, name: "700冷饮杯", costPrice: 292, unit: "箱", quantity: 0, note: "一箱1000个" },
  { id: 18, name: "泰式盖", costPrice: 160, unit: "箱", quantity: 0, note: "" },
  { id: 19, name: "茶叶", costPrice: 1050, unit: "箱", quantity: 0, note: "1箱30包" },
  { id: 20, name: "胶带", costPrice: 180, unit: "套", quantity: 0, note: "40个加底座" },
  { id: 21, name: "口罩", costPrice: 0.35, unit: "个", quantity: 0, note: "" },
  { id: 22, name: "五味子糖浆", costPrice: 75, unit: "瓶", quantity: 0, note: "" },
  { id: 23, name: "香蕉粉", costPrice: 80, unit: "袋", quantity: 0, note: "" },
  { id: 24, name: "桃子粉", costPrice: 642, unit: "箱", quantity: 0, note: "1箱12袋" },
  { id: 25, name: "芒果原浆", costPrice: 216, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 26, name: "红苹果原浆", costPrice: 252, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 27, name: "葡萄原浆", costPrice: 312, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 28, name: "定制石榴汁", costPrice: 25, unit: "瓶", quantity: 0, note: "一箱12瓶" },
  { id: 29, name: "冷冻凤梨浆", costPrice: 264, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 30, name: "牛奶", costPrice: 68, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 31, name: "厚椰乳", costPrice: 120, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 32, name: "青苹果羽衣甘蓝", costPrice: 38, unit: "瓶", quantity: 0, note: "一箱8瓶" },
  { id: 33, name: "接骨木莫林", costPrice: 63, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 34, name: "绿薄荷莫林", costPrice: 63, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 35, name: "水蜜桃莫林", costPrice: 63, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 36, name: "柠檬莫林", costPrice: 63, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 37, name: "可可红茶上允", costPrice: 162, unit: "箱", quantity: 0, note: "" },
  { id: 38, name: "草莓上允", costPrice: 150, unit: "箱", quantity: 0, note: "" },
  { id: 39, name: "红苹果上允", costPrice: 150, unit: "箱", quantity: 0, note: "" },
  { id: 40, name: "玫瑰上允", costPrice: 186, unit: "箱", quantity: 0, note: "" },
  { id: 41, name: "桃子上允", costPrice: 200, unit: "箱", quantity: 0, note: "" },
  { id: 42, name: "葡萄上允", costPrice: 200, unit: "箱", quantity: 0, note: "" },
  { id: 43, name: "抹茶粉", costPrice: 80, unit: "袋", quantity: 0, note: "" },
  { id: 44, name: "杏茶", costPrice: 216, unit: "箱", quantity: 0, note: "" },
  { id: 45, name: "芭乐上允", costPrice: 200, unit: "箱", quantity: 0, note: "" },
  { id: 46, name: "芭乐果酱", costPrice: 324, unit: "箱", quantity: 0, note: "" },
  // 新增商品（成本价待补，costPending 灰显）
  { id: 47, name: "树番茄上允", costPrice: 0, unit: "箱", quantity: 0, note: "一箱6瓶", costPending: true },
  { id: 48, name: "小麦草冷冻原浆", costPrice: 0, unit: "箱", quantity: 0, note: "一箱6瓶", costPending: true },
  { id: 49, name: "白薄荷莫林", costPrice: 0, unit: "瓶", quantity: 0, note: "一瓶", costPending: true },
  { id: 50, name: "青梅上允", costPrice: 0, unit: "箱", quantity: 0, note: "一箱6瓶", costPending: true },
  { id: 51, name: "啤酒花上允", costPrice: 0, unit: "箱", quantity: 0, note: "一箱6瓶", costPending: true },
  { id: 52, name: "荔枝上允", costPrice: 0, unit: "箱", quantity: 0, note: "一箱8瓶", costPending: true },
  { id: 53, name: "桑葚冷冻原浆", costPrice: 0, unit: "箱", quantity: 0, note: "一箱12瓶", costPending: true },
  { id: 54, name: "百香果上允", costPrice: 0, unit: "箱", quantity: 0, note: "一箱8瓶", costPending: true },
  { id: 55, name: "冷冻荔枝", costPrice: 0, unit: "箱", quantity: 0, note: "一箱20斤", costPending: true },
];
