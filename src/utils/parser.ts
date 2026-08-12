import { defaultProducts } from "@/data/products";

// ==================== 商品别名映射 ====================
const productAliases: Record<string, string> = {
  "单杯袋": "透明单杯袋",
  "单杯打包袋": "透明单杯袋",
  "打包袋": "透明单杯袋",
  "双杯袋": "透明双杯袋",
  "双杯打包袋": "透明双杯袋",
  "单杯托": "透明单杯托",
  "单杯底托": "透明单杯托",
  "杯底托": "透明单杯托",
  "双杯托": "透明双杯托",
  "四杯托": "四杯纸托",
  "四杯纸托": "四杯纸托",
  "底托": "四杯纸托",
  "500杯": "500冷饮杯",
  "500注塑杯": "500冷饮杯",
  "注塑杯": "500冷饮杯",
  "700杯": "700冷饮杯",
  "700注塑杯": "700冷饮杯",
  "牛奶": "牛奶",
  "茶叶": "茶叶",
  "咖奶": "咖奶",
  "葡萄上允": "葡萄上允",
  "玫瑰上允": "玫瑰上允",
  "草莓上允": "草莓上允",
  "桃子上允": "桃子上允",
  "白桃上允": "桃子上允",
  "芭乐上允": "芭乐上允",
  "可可上允": "可可红茶上允",
  "可可红茶上允": "可可红茶上允",
  "红茶上允": "可可红茶上允",
  "红苹果上允": "红苹果上允",
  "苹果上允": "红苹果上允",
  "青苹果": "青苹果羽衣甘蓝",
  "羽衣甘蓝": "青苹果羽衣甘蓝",
  "接骨木": "接骨木莫林",
  "接骨木莫林": "接骨木莫林",
  "绿薄荷": "绿薄荷莫林",
  "绿薄荷莫林": "绿薄荷莫林",
  "水蜜桃": "水蜜桃莫林",
  "水蜜桃莫林": "水蜜桃莫林",
  "柠檬莫林": "柠檬莫林",
  "石榴汁": "定制石榴汁",
  "红苹果原浆": "红苹果原浆",
  "苹果原浆": "红苹果原浆",
  "葡萄原浆": "葡萄原浆",
  "芒果原浆": "芒果原浆",
  "厚椰乳": "厚椰乳",
  "厚椰奶": "厚椰乳",
  "香蕉粉": "香蕉粉",
  "桃子粉": "桃子粉",
  "抹茶粉": "抹茶粉",
  "五味子糖浆": "五味子糖浆",
  "糖浆": "五味子糖浆",
  "拱盖": "拱盖",
  "直饮盖": "直饮盖",
  "泰式盖": "泰式盖",
  "粗吸管": "定制粗吸管",
  "细吸管": "定制细吸管",
  "杯套": "杯套",
  "封口贴": "外卖封口贴",
  "外卖封口贴": "外卖封口贴",
  "胶带": "胶带",
  "口罩": "口罩",
  "保温袋": "保温袋纸拖",
  "纸拖": "保温袋纸拖",
  "杏茶": "杏茶",
  "芭乐果酱": "芭乐果酱",
  "冷冻凤梨浆": "冷冻凤梨浆",
  "凤梨浆": "冷冻凤梨浆",
  "定制石榴汁": "定制石榴汁",
  "芭乐": "芭乐上允",
};

// ==================== 备注干扰词库 ====================
// 这些是商品备注中常见的描述，识别时应先移除
const NOTE_PATTERNS = [
  "一箱1000个",
  "一箱2000个",
  "一箱5000个",
  "两箱起定",
  "一箱12瓶",
  "1箱30包",
  "一箱8瓶",
  "一箱6瓶",
  "一箱400个可拆卸",
  "40个加底座",
  "1箱12袋",
  "一箱1000个，单个1元",
];

// 价格单位，用于回退逻辑过滤
const PRICE_UNITS = ["元", "块", "钱", "$", "¥"];

export interface ParsedItem {
  id: string;
  rawText: string;
  productName: string;
  matchedProduct: string | null;
  productId: number | null;
  quantity: number | null;
  confidence: "exact" | "fuzzy" | "unmatched" | "noqty";
}

function cleanName(name: string): string {
  return name.replace(/[（(].*?[)）]/g, "").trim();
}

// ========== FIX 1: 保守的序号去除 ==========
// 只去除明确的序号格式（数字+.:：,，、），不去除数字+空格
// 避免误删商品名中的数字（如"500冷饮杯"）
function stripPrefix(line: string): string {
  return line.replace(/^\s*\d+[.:：．,，、]\s*/, "").trim();
}

// 预处理：从输入中移除备注内容
function removeNotes(line: string): string {
  for (const note of NOTE_PATTERNS) {
    line = line.replace(note, "");
  }
  return line.trim();
}

// 检查数字后面是否是价格单位
function isPriceContext(line: string, numStr: string, numIndex: number): boolean {
  const afterChar = line[numIndex + numStr.length];
  return PRICE_UNITS.some((c) => c === afterChar);
}

// ========== FIX 2: 先移除备注，再提取数量 ==========
function extractQuantityAndName(rawLine: string): { quantity: number | null; productName: string } {
  // 先移除备注干扰
  const line = removeNotes(rawLine);

  // 尝试匹配 "数字+中文单位"
  const regex = /(\d+)\s*(箱|个|瓶|包|卷|套|袋|件)/g;

  let bestMatch: { num: number; index: number; length: number } | null = null;

  let match;
  while ((match = regex.exec(line)) !== null) {
    const idx = match.index;
    // 选择位置靠后的匹配
    if (!bestMatch || idx > bestMatch.index) {
      bestMatch = {
        num: parseInt(match[1], 10),
        index: idx,
        length: match[0].length,
      };
    }
  }

  if (!bestMatch) {
    // 没有匹配到数量+单位，尝试只匹配数字
    const numMatch = line.match(/(\d+)/g);
    if (numMatch) {
      // 从后往前找，跳过价格相关的数字和0
      for (let i = numMatch.length - 1; i >= 0; i--) {
        const numStr = numMatch[i];
        const numVal = parseInt(numStr, 10);
        if (numVal === 0) continue; // 跳过0
        const numIdx = line.lastIndexOf(numStr);
        if (!isPriceContext(line, numStr, numIdx)) {
          // 不是价格，当作数量
          let name = line.slice(0, numIdx).trim() || line.slice(numIdx + numStr.length).trim();
          name = name.replace(/[:：]+$/, "").replace(/^[:：]+/, "").trim();
          return { quantity: numVal, productName: name || line };
        }
      }
      // 所有数字都是价格或0，清理后返回无数量
      let cleanedName = line.replace(/\d+/g, "").replace(/[:：]+/g, "").trim();
      // 清理残留的价格单位和小数点
      cleanedName = cleanedName.replace(/^[.．元块钱$¥]+/, "").replace(/[.．元块钱$¥]+$/, "").trim();
      return { quantity: null, productName: cleanedName || line };
    }
    return { quantity: null, productName: line };
  }

  // 提取商品名：去掉数量部分
  const { index, length } = bestMatch;
  let before = line.slice(0, index).trim().replace(/[:：]+$/, "");
  let after = line.slice(index + length).trim().replace(/^[:：]+/, "");
  let productName = before || after || line;

  return { quantity: bestMatch.num, productName };
}

// 匹配商品
function matchProduct(inputName: string): {
  matchedProduct: string | null;
  productId: number | null;
  confidence: "exact" | "fuzzy" | "unmatched";
} {
  const cleanInput = cleanName(inputName);
  if (!cleanInput) {
    return { matchedProduct: null, productId: null, confidence: "unmatched" };
  }

  // 1. 别名精确匹配
  if (productAliases[cleanInput]) {
    const targetName = productAliases[cleanInput];
    const prod = defaultProducts.find((p) => p.name === targetName);
    if (prod) {
      return { matchedProduct: prod.name, productId: prod.id, confidence: "exact" };
    }
  }

  // 2. 名称完全匹配
  const exactProd = defaultProducts.find(
    (p) => p.name === cleanInput || cleanName(p.name) === cleanInput || p.name === inputName
  );
  if (exactProd) {
    return { matchedProduct: exactProd.name, productId: exactProd.id, confidence: "exact" };
  }

  // 3. 正向包含匹配
  if (cleanInput.length >= 2) {
    let bestMatch = null;
    let bestLen = 0;
    for (const prod of defaultProducts) {
      const prodClean = cleanName(prod.name);
      if (prodClean.includes(cleanInput) && prodClean.length > bestLen) {
        bestLen = prodClean.length;
        bestMatch = prod;
      }
    }
    if (bestMatch) {
      return { matchedProduct: bestMatch.name, productId: bestMatch.id, confidence: "exact" };
    }
  }

  // 4. 反向包含匹配
  {
    let bestMatch = null;
    let bestScore = 0;
    for (const prod of defaultProducts) {
      const prodClean = cleanName(prod.name);
      if (prodClean.length >= 2 && cleanInput.includes(prodClean)) {
        if (prodClean.length > bestScore) {
          bestScore = prodClean.length;
          bestMatch = prod;
        }
      }
    }
    if (bestMatch) {
      return { matchedProduct: bestMatch.name, productId: bestMatch.id, confidence: "exact" };
    }
  }

  // 5. 关键词匹配
  if (cleanInput.length >= 2) {
    let bestMatch = null;
    let bestMatchCount = 0;
    for (const prod of defaultProducts) {
      const prodClean = cleanName(prod.name);
      let matchCount = 0;
      for (const char of cleanInput) {
        if (prodClean.includes(char) || prod.name.includes(char)) {
          matchCount++;
        }
      }
      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount;
        bestMatch = prod;
      }
    }
    if (bestMatch && bestMatchCount >= 2) {
      return { matchedProduct: bestMatch.name, productId: bestMatch.id, confidence: "fuzzy" };
    }
  }

  return { matchedProduct: null, productId: null, confidence: "unmatched" };
}

// ==================== 主解析函数 ====================
export function parseOrderText(text: string): ParsedItem[] {
  if (!text.trim()) return [];

  // 先按换行分割
  let lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 如果只有一行且包含中文逗号或英文逗号，按逗号分割
  if (lines.length === 1) {
    const singleLine = lines[0];
    if (singleLine.includes("，") || singleLine.includes(",")) {
      lines = singleLine
        .split(/[，,]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
  }

  const results: ParsedItem[] = [];
  let uid = 0;

  for (const line of lines) {
    const cleaned = stripPrefix(line).replace(/[,.，。;；]+$/, "");
    if (!cleaned) continue;

    const { quantity, productName } = extractQuantityAndName(cleaned);

    const { matchedProduct, productId, confidence: matchConfidence } = matchProduct(productName);

    let finalConfidence: ParsedItem["confidence"] = matchConfidence;
    if (matchConfidence !== "unmatched" && quantity === null) {
      finalConfidence = "noqty";
    }

    results.push({
      id: `item-${uid++}`,
      rawText: line,
      productName,
      matchedProduct,
      productId,
      quantity,
      confidence: finalConfidence,
    });
  }

  return results;
}
