export interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  note: string;
}

// 单价统一为"箱"价，客户直接输入箱数
// 对于原本按个计价但有箱装规格的商品，单价 = 单个价格 × 每箱个数，备注标注单个价格
export const defaultProducts: Product[] = [
  { id: 1, name: "透明单杯袋", price: 0.7, unit: "个", quantity: 0, note: "一箱500个" },
  { id: 2, name: "透明双杯袋", price: 0.75, unit: "个", quantity: 0, note: "一箱500个" },
  { id: 3, name: "透明单杯托", price: 0.29, unit: "个", quantity: 0, note: "一箱3000个" },
  { id: 4, name: "透明双杯托", price: 0.4, unit: "个", quantity: 0, note: "一箱1500个" },
  { id: 5, name: "保温单杯袋", price: 0.6, unit: "个", quantity: 0, note: "一箱1000个" },
  { id: 6, name: "保温双杯袋", price: 0.78, unit: "个", quantity: 0, note: "一箱1000个" },
  { id: 7, name: "四杯纸托", price: 128, unit: "箱", quantity: 0, note: "一箱400个" },
  { id: 8, name: "保温4杯袋", price: 1000, unit: "箱", quantity: 0, note: "一箱1000个" },
  { id: 9, name: "保温袋纸拖", price: 120, unit: "箱", quantity: 0, note: "" },
  { id: 10, name: "杯套", price: 360, unit: "箱", quantity: 0, note: "" },
  { id: 11, name: "外卖封口贴", price: 9, unit: "卷", quantity: 0, note: "" },
  { id: 12, name: "定制粗吸管", price: 210, unit: "箱", quantity: 0, note: "一箱2000个" },
  { id: 13, name: "定制细吸管", price: 210, unit: "箱", quantity: 0, note: "一箱5000个" },
  { id: 14, name: "拱盖", price: 100, unit: "箱", quantity: 0, note: "两箱起定" },
  { id: 15, name: "直饮盖", price: 140, unit: "箱", quantity: 0, note: "两箱起定" },
  { id: 16, name: "500冷饮杯", price: 320, unit: "箱", quantity: 0, note: "一箱1000个" },
  { id: 17, name: "700冷饮杯", price: 380, unit: "箱", quantity: 0, note: "一箱1000个" },
  { id: 18, name: "泰式盖", price: 180, unit: "箱", quantity: 0, note: "" },
  { id: 19, name: "茶叶", price: 1300, unit: "箱", quantity: 0, note: "1箱30包" },
  { id: 20, name: "胶带", price: 190, unit: "套", quantity: 0, note: "40个加底座" },
  { id: 21, name: "口罩", price: 0.4, unit: "个", quantity: 0, note: "" },
  { id: 22, name: "五味子糖浆", price: 85, unit: "瓶", quantity: 0, note: "" },
  { id: 23, name: "香蕉粉", price: 100, unit: "袋", quantity: 0, note: "一袋800克" },
  { id: 24, name: "桃子粉", price: 672, unit: "箱", quantity: 0, note: "一箱12袋" },
  { id: 25, name: "芒果原浆", price: 300, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 26, name: "红苹果原浆", price: 324, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 27, name: "葡萄原浆", price: 384, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 28, name: "定制石榴汁", price: 30, unit: "瓶", quantity: 0, note: "一箱12瓶" },
  { id: 29, name: "冷冻凤梨浆", price: 336, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 30, name: "牛奶", price: 82, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 31, name: "厚椰乳", price: 132, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 32, name: "青苹果羽衣甘蓝", price: 42, unit: "瓶", quantity: 0, note: "一箱8瓶" },
  { id: 33, name: "接骨木莫林", price: 70, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 34, name: "绿薄荷莫林", price: 70, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 35, name: "水蜜桃莫林", price: 70, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 36, name: "柠檬莫林", price: 70, unit: "瓶", quantity: 0, note: "一箱6瓶" },
  { id: 37, name: "可可红茶上允", price: 178, unit: "箱", quantity: 0, note: "一箱6瓶" },
  { id: 38, name: "草莓上允", price: 166, unit: "箱", quantity: 0, note: "一箱6瓶" },
  { id: 39, name: "红苹果上允", price: 175, unit: "箱", quantity: 0, note: "一箱6瓶" },
  { id: 40, name: "玫瑰上允", price: 228, unit: "箱", quantity: 0, note: "一箱6瓶" },
  { id: 41, name: "桃子上允", price: 232, unit: "箱", quantity: 0, note: "一箱8瓶" },
  { id: 42, name: "葡萄上允", price: 232, unit: "箱", quantity: 0, note: "一箱8瓶" },
  { id: 43, name: "抹茶粉", price: 100, unit: "袋", quantity: 0, note: "一袋250克" },
  { id: 44, name: "咖奶", price: 312, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 45, name: "杏茶", price: 268, unit: "箱", quantity: 0, note: "一箱8瓶" },
  { id: 46, name: "芭乐上允", price: 232, unit: "箱", quantity: 0, note: "一箱8瓶" },
  { id: 47, name: "芭乐果酱", price: 328, unit: "箱", quantity: 0, note: "一箱8支" },
  { id: 48, name: "树番茄上允", price: 132, unit: "箱", quantity: 0, note: "一箱6瓶" },
  { id: 49, name: "小麦草冷冻原浆", price: 175, unit: "箱", quantity: 0, note: "一箱6瓶" },
  { id: 50, name: "白薄荷莫林", price: 70, unit: "瓶", quantity: 0, note: "一瓶" },
  { id: 51, name: "青梅上允", price: 160, unit: "箱", quantity: 0, note: "一箱6瓶" },
  { id: 52, name: "啤酒花上允", price: 160, unit: "箱", quantity: 0, note: "一箱6瓶" },
  { id: 53, name: "荔枝上允", price: 240, unit: "箱", quantity: 0, note: "一箱8瓶" },
  { id: 54, name: "桑葚冷冻原浆", price: 338, unit: "箱", quantity: 0, note: "一箱12瓶" },
  { id: 55, name: "百香果上允", price: 232, unit: "箱", quantity: 0, note: "一箱8瓶" },
  { id: 56, name: "冷冻荔枝", price: 200, unit: "箱", quantity: 0, note: "一箱20斤" },
];
