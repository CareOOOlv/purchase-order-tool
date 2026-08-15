import { useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  Download,
  RotateCcw,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Trash2,
} from "lucide-react";
import { defaultSimpleCostProducts } from "@/data/simpleCostProducts";
import type { SimpleCostProduct } from "@/data/simpleCostProducts";
import { parseOrderText } from "@/utils/parser";
import type { ParsedItem } from "@/utils/parser";
import * as XLSX from "xlsx";
import { Toaster, toast } from "sonner";

interface ProductRow extends SimpleCostProduct {
  costTotal: number;
}

interface EditableItem extends ParsedItem {
  selectedProductId: number | null;
}

// 检测微信内置浏览器（微信内无法下载文件，需引导用户用系统浏览器打开）
function isWeChatBrowser(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent);
}

export default function SimpleCost() {
  const [products, setProducts] = useState<ProductRow[]>(
    defaultSimpleCostProducts.map((p) => ({ ...p, costTotal: 0 }))
  );
  const [orderText, setOrderText] = useState("");
  const [editableItems, setEditableItems] = useState<EditableItem[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const updateQuantity = useCallback((id: number, value: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return { ...p, quantity: value, costTotal: value * p.costPrice };
      })
    );
  }, []);

  const grandCost = products.reduce((sum, p) => sum + p.costTotal, 0);
  const selectedCount = products.filter((p) => p.quantity > 0).length;

  const handleSmartParse = () => {
    if (!orderText.trim()) {
      toast.error("请输入内容");
      return;
    }
    const items = parseOrderText(orderText);
    if (items.length === 0) {
      toast.error("未能识别到任何商品");
      return;
    }
    const editable: EditableItem[] = items.map((item) => ({
      ...item,
      selectedProductId: item.productId,
    }));
    setEditableItems(editable);
    setConfirmDialogOpen(true);
  };

  const handleSelectProduct = (itemId: string, productId: number) => {
    setEditableItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, selectedProductId: productId } : item
      )
    );
  };

  const handleEditQuantity = (itemId: string, quantity: number) => {
    setEditableItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setEditableItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleConfirmFill = () => {
    const validItems = editableItems.filter(
      (item) => item.selectedProductId != null && item.quantity != null && item.quantity > 0
    );
    if (validItems.length === 0) {
      toast.error("没有可填写的商品");
      return;
    }
    const quantityMap = new Map<number, number>();
    for (const item of validItems) {
      const pid = item.selectedProductId!;
      quantityMap.set(pid, (quantityMap.get(pid) || 0) + (item.quantity || 0));
    }
    setProducts((prev) =>
      prev.map((p) => {
        const qty = quantityMap.get(p.id);
        if (qty != null && qty > 0) {
          return { ...p, quantity: qty, costTotal: qty * p.costPrice };
        }
        return p;
      })
    );
    setConfirmDialogOpen(false);
    toast.success(`已填写 ${validItems.length} 项`);
    setTimeout(() => {
      tableScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const handleReset = () => {
    setOrderText("");
    setEditableItems([]);
    setProducts(defaultSimpleCostProducts.map((p) => ({ ...p, costTotal: 0 })));
    setPreviewOpen(false);
    toast.success("已重置");
  };

  const exportCostExcel = () => {
    if (isWeChatBrowser()) {
      toast.error("微信内无法下载文件，请点击右上角「···」选择「在浏览器打开」后导出");
      return;
    }
    const filtered = products.filter((p) => p.quantity > 0);
    if (filtered.length === 0) {
      toast.error("请至少填写一项");
      return;
    }
    const dateStr = new Date().toLocaleDateString("zh-CN").replace(/\//g, "-");
    const fileName = `成本表${dateStr}.xlsx`;

    const wsData: (string | number)[][] = [];
    wsData.push(["成本明细表"]);
    wsData.push(["序号", "商品名称", "成本单价", "单位", "数量", "成本小计", "备注"]);
    filtered.forEach((p, idx) => {
      wsData.push([idx + 1, p.name, p.costPrice, p.unit, p.quantity, p.costTotal, p.note]);
    });
    wsData.push(["", "", "", "", "合计", grandCost, ""]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 8 }, { wch: 24 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 20 }];
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "成本表");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.success(`成本表已导出: ${fileName}`);
  };

  const scrollTable = (dir: "left" | "right") => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  const validCount = editableItems.filter((i) => i.selectedProductId != null).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <Toaster position="top-center" />

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 border-b">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              识别结果确认
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              共 {editableItems.length} 行，有效 {validCount} 行
              <span className="text-green-600 ml-2">● 精确</span>
              <span className="text-amber-600 ml-1">● 模糊</span>
              <span className="text-orange-500 ml-1">● 数量未识别</span>
              <span className="text-red-500 ml-1">● 未匹配</span>
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-8 px-2 sm:px-3 text-xs">状态</TableHead>
                  <TableHead className="px-2 sm:px-3 text-xs min-w-[80px]">原文</TableHead>
                  <TableHead className="px-2 sm:px-3 text-xs min-w-[160px]">匹配商品</TableHead>
                  <TableHead className="w-20 px-2 sm:px-3 text-xs">数量</TableHead>
                  <TableHead className="w-10 px-2 sm:px-3 text-xs">删除</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editableItems.map((item) => {
                  const isValid = item.selectedProductId != null;
                  return (
                    <TableRow key={item.id} className={isValid ? "hover:bg-emerald-50/50" : "bg-red-50/40 hover:bg-red-50/60"}>
                      <TableCell className="px-2 sm:px-3">
                        {item.confidence === "exact" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : item.confidence === "fuzzy" ? (
                          <HelpCircle className="w-4 h-4 text-amber-500" />
                        ) : item.confidence === "noqty" ? (
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </TableCell>
                      <TableCell className="px-2 sm:px-3">
                        <div className="text-xs text-slate-500 truncate max-w-[80px] sm:max-w-[120px]" title={item.rawText}>
                          {item.rawText}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 sm:px-3">
                        <Select value={item.selectedProductId?.toString() || ""} onValueChange={(val) => handleSelectProduct(item.id, parseInt(val, 10))}>
                          <SelectTrigger className="h-8 text-xs sm:text-sm w-full">
                            <SelectValue placeholder="选择商品..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            {defaultSimpleCostProducts.map((p) => (
                              <SelectItem key={p.id} value={p.id.toString()} className="text-xs sm:text-sm">{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-2 sm:px-3">
                        <Input type="number" min="0" value={item.quantity ?? ""} onChange={(e) => handleEditQuantity(item.id, e.target.value === "" ? 0 : Number(e.target.value))} className="h-8 w-16 sm:w-20 text-xs sm:text-sm px-1.5" />
                      </TableCell>
                      <TableCell className="px-2 sm:px-3">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="px-4 sm:px-6 py-4 border-t gap-2">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} className="w-full sm:w-auto h-10">取消</Button>
            <Button onClick={handleConfirmFill} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto h-10" disabled={validCount === 0}>
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              确认填表 ({validCount}项)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <img src="/logo.png" alt="品牌Logo" className="h-10 sm:h-14 w-auto object-contain flex-shrink-0" />
            <div className="hidden sm:block h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
              <h1 className="text-sm sm:text-lg font-bold text-slate-800 truncate">纯成本工具</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 h-9 px-2.5 sm:px-3" disabled={selectedCount === 0}>
              <Calculator className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">预览汇总</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="text-slate-600 h-9 px-2.5 sm:px-3">
              <RotateCcw className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">重置</span>
            </Button>
            <Button variant="default" size="sm" onClick={exportCostExcel} className="bg-emerald-600 hover:bg-emerald-700 h-9 px-2.5 sm:px-3">
              <Download className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">导出成本表</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Paste Input */}
        <Card className="border-slate-200 shadow-sm border-emerald-200 bg-emerald-50/30">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-emerald-800">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              智能识别填表
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-3">
            <Textarea value={orderText} onChange={(e) => setOrderText(e.target.value)} placeholder={"例如:\n1:牛奶40箱\n2:咖奶10箱\n3:茶叶2箱\n\n或逗号分隔:\n5000单杯打包袋,1箱单杯底托,2000双杯打包袋,牛奶40件"} className="min-h-[140px] text-sm sm:text-base leading-relaxed" />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleSmartParse} className="bg-emerald-600 hover:bg-emerald-700 h-11 text-base w-full sm:w-auto">
                <Sparkles className="w-4 h-4 mr-1.5" />
                识别并填表
              </Button>
              {orderText && (
                <Button variant="ghost" onClick={() => { setOrderText(""); setEditableItems([]); }} className="h-11 text-slate-500">清空</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mobile Stats */}
        {selectedCount > 0 && (
          <div className="sm:hidden bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between">
            <div className="text-sm text-slate-600">已选 <span className="font-bold text-emerald-700">{selectedCount}</span> 项</div>
            <div className="text-sm">成本 <span className="font-bold text-emerald-700 text-lg">¥ {grandCost.toFixed(2)}</span></div>
          </div>
        )}

        {/* Cost Table */}
        <Card ref={tableScrollRef} className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="pb-3 px-4 sm:px-6 border-b border-slate-100">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              成本明细
              <span className="text-xs font-normal text-slate-400 ml-1 hidden sm:inline">（数量留空默认为0，仅导出数量大于0的商品）</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="sm:hidden flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100">
              <span className="text-xs text-slate-400">← 左右滑动查看完整表格 →</span>
              <div className="flex gap-1">
                <button onClick={() => scrollTable("left")} className="p-1 rounded bg-white border border-slate-200"><ChevronLeft className="w-3 h-3 text-slate-500" /></button>
                <button onClick={() => scrollTable("right")} className="p-1 rounded bg-white border border-slate-200"><ChevronRight className="w-3 h-3 text-slate-500" /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-10 sm:w-12 text-center font-semibold text-xs sm:text-sm px-2 sm:px-4">序号</TableHead>
                    <TableHead className="font-semibold text-xs sm:text-sm min-w-[100px] sm:min-w-0">商品名称</TableHead>
                    <TableHead className="w-20 sm:w-24 font-semibold text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">成本单价</TableHead>
                    <TableHead className="w-14 sm:w-20 font-semibold text-xs sm:text-sm text-center px-2 sm:px-4">单位</TableHead>
                    <TableHead className="w-24 sm:w-28 font-semibold text-xs sm:text-sm text-center px-2 sm:px-4">数量</TableHead>
                    <TableHead className="w-20 sm:w-24 font-semibold text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">成本小计</TableHead>
                    <TableHead className="font-semibold text-xs sm:text-sm min-w-[80px] sm:min-w-0 px-2 sm:px-4">备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} className={product.quantity > 0 ? "bg-emerald-50/40 hover:bg-emerald-50/60" : "hover:bg-slate-50/50"}>
                      <TableCell className="text-center text-slate-500 text-xs sm:text-sm px-2 sm:px-4">{product.id}</TableCell>
                      <TableCell className="font-medium text-slate-800 text-xs sm:text-sm px-2 sm:px-4">{product.name}</TableCell>
                      <TableCell className="text-slate-700 tabular-nums text-xs sm:text-sm px-2 sm:px-4">
                        {product.costPending ? <span className="text-slate-300 font-normal">待补</span> : product.costPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-slate-700 text-xs sm:text-sm text-center px-2 sm:px-4">{product.unit}</TableCell>
                      <TableCell className="px-2 sm:px-4">
                        <Input type="number" min="0" value={product.quantity || ""} onChange={(e) => updateQuantity(product.id, e.target.value === "" ? 0 : Number(e.target.value))} placeholder="0" className="w-20 sm:w-28 h-10 sm:h-8 text-sm sm:text-base px-2" />
                      </TableCell>
                      <TableCell className={`font-semibold text-xs sm:text-sm tabular-nums px-2 sm:px-4 ${product.costTotal > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                        {product.costPending ? <span className="text-slate-300 font-normal">待补</span> : (product.costTotal > 0 ? product.costTotal.toFixed(2) : "—")}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">{product.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Summary Bar */}
        {selectedCount > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4 flex items-center justify-between">
            <span className="text-sm text-slate-600">
              已选 <span className="font-bold text-emerald-700">{selectedCount}</span> 项，总成本 <span className="font-bold text-emerald-700">¥ {grandCost.toFixed(2)}</span>
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)} className="text-emerald-700 border-emerald-300">
                <Calculator className="w-4 h-4 mr-1" />
                预览
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} className="text-slate-600">
                <RotateCcw className="w-4 h-4 mr-1" />
                重置
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Preview Modal - Only cost, no profit */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
                <Calculator className="w-5 h-5" />
                成本汇总
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-sm text-emerald-600">总成本</p>
                <p className="text-3xl font-bold text-emerald-700">¥ {grandCost.toFixed(2)}</p>
                <p className="text-xs text-emerald-500 mt-1">共 {selectedCount} 项商品</p>
              </div>
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs">商品</TableHead>
                      <TableHead className="text-xs">单价</TableHead>
                      <TableHead className="text-xs">数量</TableHead>
                      <TableHead className="text-xs">小计</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.filter((p) => p.quantity > 0).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-medium">{p.name}</TableCell>
                        <TableCell className="text-xs">{p.costPending ? <span className="text-slate-300 font-normal">待补</span> : p.costPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-xs">{p.quantity}</TableCell>
                        <TableCell className="text-xs font-semibold text-emerald-700">{p.costPending ? <span className="text-slate-300 font-normal">待补</span> : p.costTotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>关闭</Button>
                <Button onClick={exportCostExcel} className="bg-emerald-600 hover:bg-emerald-700">
                  <Download className="w-4 h-4 mr-1.5" />
                  导出成本表
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white mt-6 sm:mt-8">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 text-center text-xs sm:text-sm text-slate-400">
          öh mo! 어모 · 纯成本工具
        </div>
      </footer>
    </div>
  );
}
