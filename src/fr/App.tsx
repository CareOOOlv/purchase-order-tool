import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultProducts,
  STARRED_NOTICE,
  CUPS_NOTICE,
  KAMILK_NOTICE,
  validateOrderRules,
  type Product,
} from "@/data/products";
import { parseOrderText } from "@/utils/parser";
import { callApi, uploadVoucher, compressToBlob, fmtMoney } from "./api";

interface StoreInfo {
  storeId: string;
  storeName: string;
  token: string;
}

interface OrderRow {
  qty: number;
}

const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function loadStore(): StoreInfo | null {
  try {
    const raw = localStorage.getItem("ohmo_fr_store");
    return raw ? (JSON.parse(raw) as StoreInfo) : null;
  } catch {
    return null;
  }
}

async function saveStore(info: StoreInfo | null) {
  if (info) localStorage.setItem("ohmo_fr_store", JSON.stringify(info));
  else localStorage.removeItem("ohmo_fr_store");
}

// ==================== 门店码绑定页 ====================
function BindScreen({ onBound }: { onBound: (s: StoreInfo) => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError("");
    const res = await callApi<StoreInfo>({ action: "bindStore", code: code.trim() });
    setLoading(false);
    if (res.success && res.data) {
      await saveStore(res.data);
      onBound(res.data);
    } else {
      setError(res.error || "绑定失败");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-blue-600 mb-1">OHMO 冰奶</div>
          <div className="text-slate-500">加盟商订货工具</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">门店码</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="请输入品牌方分配的门店码"
            className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          <button
            onClick={submit}
            disabled={loading || !code.trim()}
            className="mt-5 w-full bg-blue-600 text-white rounded-lg py-3 font-medium disabled:opacity-50 active:bg-blue-700"
          >
            {loading ? "验证中..." : "进入订货"}
          </button>
        </div>
        <div className="mt-6 text-center text-xs text-slate-400">
          没有门店码？请联系品牌方获取
        </div>
      </div>
    </div>
  );
}

// ==================== 下单页 ====================
function OrderScreen({ store, onSubmitted }: { store: StoreInfo; onSubmitted: (orderId: string) => void }) {
  const [rows, setRows] = useState<Record<number, OrderRow>>({});
  const [search, setSearch] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [screenshot, setScreenshot] = useState<{ file: File; preview: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const products = defaultProducts;
  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(kw) || (p.note && p.note.toLowerCase().includes(kw))
    );
  }, [search, products]);

  const setQty = (p: Product, qty: number) => {
    setRows((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[p.id];
      else next[p.id] = { qty };
      return next;
    });
  };

  const selectedItems = useMemo(() => {
    return Object.entries(rows)
      .map(([id, r]) => {
        const p = products.find((x) => x.id === Number(id))!;
        return { id: p.id, name: p.name, price: p.price, unit: p.unit, qty: r.qty };
      })
      .sort((a, b) => a.id - b.id);
  }, [rows, products]);

  const total = selectedItems.reduce((s, it) => s + it.price * it.qty, 0);

  const applyParse = () => {
    const results = parseOrderText(pasteText);
    const valid = results.filter(
      (r) => r.productId != null && r.quantity != null && r.quantity > 0
    );
    if (valid.length === 0) {
      setError("没有识别到有效商品，请检查文字格式（如：定制款草莓2箱）");
      return;
    }
    setRows((prev) => {
      const next = { ...prev };
      for (const r of valid) {
        next[r.productId!] = { qty: (next[r.productId!]?.qty || 0) + r.quantity! };
      }
      return next;
    });
    setError("");
    setShowPaste(false);
    setPasteText("");
  };

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      // 只做压缩预览；真实上传发生在提交时（直传云存储）
      const blob = await compressToBlob(file);
      setScreenshot({ file, preview: URL.createObjectURL(blob) });
    } catch {
      setError("图片处理失败，请重试");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (submitting) return;
    if (selectedItems.length === 0) {
      setError("请先选择商品");
      return;
    }
    // 起订规则校验（带*冷冻品满30瓶 / 咖奶5箱 / 杯盖类合计2箱）
    const ruleError = validateOrderRules(selectedItems.map((it) => ({ productId: it.id, qty: it.qty })));
    if (ruleError) {
      setError(ruleError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!screenshot) {
      setError("请上传转账凭证后再提交订单");
      return;
    }
    setSubmitting(true);
    setError("");
    let fileId = "";
    try {
      fileId = await uploadVoucher(store.token, screenshot.file, (pct) =>
        setSubmitStatus(`上传凭证中 ${pct}%`)
      );
    } catch (e: any) {
      setSubmitting(false);
      setSubmitStatus("");
      setError(e?.message || "凭证上传失败，请重试");
      return;
    }
    setSubmitStatus("提交订单中...");
    const res = await callApi<{ orderId: string }>({
      action: "createOrder",
      token: store.token,
      items: selectedItems,
      total,
      screenshotFileId: fileId,
    });
    setSubmitting(false);
    setSubmitStatus("");
    if (res.success && res.data) {
      setRows({});
      setScreenshot(null);
      onSubmitted(res.data.orderId);
    } else if (res.error === "登录已过期，请重新输入门店码") {
      await saveStore(null);
      location.reload();
    } else {
      setError(res.error || "提交失败，请重试");
    }
  };

  return (
    <div
      className="pt-1"
      style={{ paddingBottom: "calc(300px + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* 粘贴识别 */}
      <div className="bg-white px-4 py-3 border-b border-slate-100">
        <button
          onClick={() => setShowPaste((v) => !v)}
          className="text-sm text-blue-600 font-medium"
        >
          {showPaste ? "收起文字识别 ▲" : "📋 粘贴订货文字自动识别 ▼"}
        </button>
        {showPaste && (
          <div className="mt-3">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={4}
              placeholder={"每行一条，例如：\n定制款草莓2箱\n700冷饮杯1箱"}
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={applyParse}
              disabled={!pasteText.trim()}
              className="mt-2 w-full bg-slate-800 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            >
              识别并加入清单
            </button>
          </div>
        )}
      </div>

      {/* 搜索 */}
      <div className="bg-slate-50 px-4 py-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索商品名称 / 规格"
          className="w-full border border-slate-300 rounded-full px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 表头起订规则提醒 */}
      <div className="px-4 pt-3">
        <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-[13px] leading-relaxed">
          <div className="font-bold text-red-600">⚠️ 起订规则（请务必阅读）</div>
          <div className="text-red-600 mt-1 font-medium">★ {STARRED_NOTICE}</div>
          <div className="text-red-500 mt-0.5">· {KAMILK_NOTICE}</div>
          <div className="text-red-500 mt-0.5">· {CUPS_NOTICE}</div>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="px-4 divide-y divide-slate-100">
        {filtered.map((p) => {
          const row = rows[p.id];
          return (
            <div key={p.id} className="py-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 text-[15px]">
                  {p.name}
                  {p.starred && <span className="text-red-600 font-bold ml-0.5">*</span>}
                </div>
                <div className={`text-xs mt-1 ${p.starred ? "text-red-500 font-medium" : "text-slate-400"}`}>
                  {p.note ? p.note + " · " : ""}
                  <span className="text-blue-600 font-semibold">{fmtMoney(p.price)}/{p.unit}</span>
                </div>
              </div>
              {row ? (
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setQty(p, row.qty - 1)}
                    className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 text-xl leading-none active:bg-slate-300"
                  >−</button>
                  <input
                    value={row.qty}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setQty(p, isNaN(v) ? 0 : v);
                    }}
                    inputMode="numeric"
                    className="w-14 text-center border border-slate-300 rounded-lg py-1.5 text-[15px] font-medium"
                  />
                  <button
                    onClick={() => setQty(p, row.qty + 1)}
                    className="w-9 h-9 rounded-full bg-blue-600 text-white text-xl leading-none active:bg-blue-700"
                  >＋</button>
                </div>
              ) : (
                <button
                  onClick={() => setQty(p, 1)}
                  className="px-5 py-2 rounded-full border border-blue-600 text-blue-600 text-sm font-medium active:bg-blue-50"
                >
                  添加
                </button>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">没有匹配的商品</div>
        )}
      </div>

      {/* 错误提示：固定悬浮在顶部栏下方，确保任何滚动位置都可见 */}
      {error && (
        <div className="fixed top-[60px] left-0 right-0 z-40 px-4">
          <div className="mx-auto max-w-md flex items-start justify-between gap-3 p-3 bg-red-600 text-white rounded-xl text-sm shadow-lg">
            <span className="flex-1">⚠️ {error}</span>
            <button onClick={() => setError("")} className="text-white/80 text-lg leading-none shrink-0 px-1">
              ×
            </button>
          </div>
        </div>
      )}

      {/* 底部：凭证 + 合计 + 提交（位于主 Tab 栏上方） */}
      <div
        className="fixed bottom-[54px] left-0 right-0 bg-white border-t border-slate-200 px-4 pt-3 z-20 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]"
        style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* 凭证 */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-slate-600 shrink-0">
            转账凭证 <span className="text-red-500">*</span>
          </span>
          {screenshot ? (
            <div className="relative">
              <img src={screenshot.preview} className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
              <button
                onClick={() => setScreenshot(null)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none"
              >×</button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 text-sm active:bg-slate-50"
            >
              📷 上传凭证
            </button>
          )}
          <span className="text-xs text-slate-400">拍照或从相册选择</span>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
        </div>
        {/* 末尾起订提醒 */}
        <div className="mb-2 text-[11px] leading-snug text-red-500 font-medium">
          ★ {STARRED_NOTICE}；{KAMILK_NOTICE}；杯盖四品合计满 2 箱起订（整箱）
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-400">
              共 {selectedItems.reduce((s, i) => s + i.qty, 0)} 件 · {selectedItems.length} 种商品
            </div>
            <div className="text-[22px] leading-tight font-bold text-red-600">{fmtMoney(total)}</div>
          </div>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-8 py-3.5 bg-red-600 text-white rounded-xl font-semibold text-base disabled:opacity-50 active:bg-red-700 shrink-0"
          >
            {submitStatus || (submitting ? "提交中..." : "提交订单")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== 我的订单页 ====================
interface OrderDoc {
  orderId: string;
  items: { name: string; price: number; qty: number; unit: string }[];
  total: number;
  status: string;
  statusLabel: string;
  remark: string;
  createdAt: string;
}

function MyOrdersScreen({ store }: { store: StoreInfo }) {
  const [orders, setOrders] = useState<OrderDoc[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await callApi<{ orders: OrderDoc[] }>({
      action: "listMyOrders",
      token: store.token,
    });
    setLoading(false);
    if (res.success && res.data) setOrders(res.data.orders);
    else if (res.error === "登录已过期，请重新输入门店码") {
      await saveStore(null);
      location.reload();
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500">最近 50 笔订单</span>
        <button onClick={load} className="text-sm text-blue-600 font-medium">
          {loading ? "刷新中..." : "刷新"}
        </button>
      </div>
      {orders?.length === 0 && (
        <div className="py-16 text-center text-slate-400 text-sm">还没有订单，快去下单吧</div>
      )}
      <div className="space-y-3">
        {orders?.map((o) => (
          <div key={o.orderId} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2" onClick={() => setExpanded(expanded === o.orderId ? null : o.orderId)}>
              <div>
                <div className="font-medium text-slate-800 text-sm">{o.orderId}</div>
                <div className="text-xs text-slate-400 mt-0.5">{o.createdAt}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-600">{fmtMoney(o.total)}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[o.status] || "bg-slate-100 text-slate-600"}`}>
                  {o.statusLabel}
                </span>
              </div>
            </div>
            {expanded === o.orderId && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                {o.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm text-slate-600 py-0.5">
                    <span>{it.name}</span>
                    <span className="text-slate-500">
                      {it.qty}{it.unit} × {fmtMoney(it.price)} = {fmtMoney(it.price * it.qty)}
                    </span>
                  </div>
                ))}
                {o.status === "rejected" && o.remark && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                    驳回原因：{o.remark}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== 提交成功弹窗 ====================
function SuccessDialog({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
        <div className="text-4xl mb-3">✅</div>
        <div className="text-lg font-bold text-slate-800 mb-1">订单提交成功</div>
        <div className="text-sm text-slate-500 mb-1">订单号</div>
        <div className="text-xl font-mono font-bold text-blue-600 mb-4">{orderId}</div>
        <div className="text-xs text-slate-400 mb-5">
          品牌方确认转账凭证后订单状态会更新，可在「我的订单」中查看进度
        </div>
        <button onClick={onClose} className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium">
          知道了
        </button>
      </div>
    </div>
  );
}

// ==================== 主应用 ====================
export default function App() {
  const [store, setStore] = useState<StoreInfo | null>(loadStore);
  const [tab, setTab] = useState<"order" | "mine">("order");
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  const handleBound = (s: StoreInfo) => setStore(s);

  const switchStore = async () => {
    if (!confirm("确定要切换门店吗？")) return;
    await saveStore(null);
    setStore(null);
  };

  if (!store) return <BindScreen onBound={handleBound} />;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶栏 */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div>
          <div className="text-base font-bold leading-tight">{store.storeName}</div>
          <div className="text-xs text-blue-200">OHMO 冰奶加盟商订货</div>
        </div>
        <button onClick={switchStore} className="text-xs bg-white/20 rounded-full px-3 py-1.5">
          切换门店
        </button>
      </div>

      {tab === "order" ? (
        <OrderScreen store={store} onSubmitted={(id) => setSuccessOrderId(id)} />
      ) : (
        <MyOrdersScreen store={store} />
      )}

      {/* 底部 Tab */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-30"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {(
          [
            ["order", "🛒 下单"],
            ["mine", "📦 我的订单"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3.5 text-[15px] font-medium ${
              tab === key ? "text-blue-600" : "text-slate-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {successOrderId && (
        <SuccessDialog orderId={successOrderId} onClose={() => setSuccessOrderId(null)} />
      )}
    </div>
  );
}
