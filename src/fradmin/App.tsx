import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  callApi,
  fmtMoney,
  loadAdminToken,
  saveAdminToken,
  STATUS_LABEL,
  STATUS_STYLE,
} from "./api";

interface OrderDoc {
  _id: string;
  orderId: string;
  orderDay: string;
  storeId: string;
  storeName: string;
  items: { productId: number; name: string; price: number; qty: number; unit: string }[];
  total: number;
  screenshotFileId: string;
  status: string;
  statusLabel: string;
  remark: string;
  createdAt: string;
  timeline?: { status: string; time: string }[];
}

interface StoreDoc {
  _id: string;
  name: string;
  code: string;
  active: boolean;
  contact: string;
  createdAt: string;
}

function handleAuthError(msg?: string) {
  if (msg === "请重新登录") {
    saveAdminToken(null);
    location.reload();
    return true;
  }
  return false;
}

// ==================== 登录 ====================
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!password || loading) return;
    setLoading(true);
    setError("");
    const res = await callApi<{ adminToken: string }>({
      action: "adminLogin",
      password,
    });
    setLoading(false);
    if (res.success && res.data) {
      saveAdminToken(res.data.adminToken);
      onLogin(res.data.adminToken);
    } else {
      setError(res.error || "登录失败");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-slate-800">OHMO 订货管理后台</div>
          <div className="text-sm text-slate-400 mt-1">品牌方专用 · 请勿外传链接</div>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="管理员密码"
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        <button
          onClick={submit}
          disabled={loading}
          className="mt-4 w-full bg-slate-800 text-white rounded-lg py-2.5 font-medium disabled:opacity-50"
        >
          {loading ? "登录中..." : "登录"}
        </button>
      </div>
    </div>
  );
}

// ==================== 订单管理 ====================
function OrdersScreen({ adminToken, stores }: { adminToken: string; stores: StoreDoc[] }) {
  const [orders, setOrders] = useState<OrderDoc[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [storeId, setStoreId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detail, setDetail] = useState<OrderDoc | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await callApi<{ orders: OrderDoc[] }>({
      action: "adminListOrders",
      adminToken,
      filters: { status: status || undefined, storeId: storeId || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
    });
    setLoading(false);
    if (handleAuthError(res.error)) return;
    if (res.success && res.data) setOrders(res.data.orders);
    else setMsg(res.error || "加载失败");
  };

  useEffect(() => {
    load();
  }, []);

  const viewScreenshot = async (order: OrderDoc) => {
    setDetail(order);
    setScreenshotUrl(null);
    setScreenshotLoading(true);
    const res = await callApi<{ url: string }>({
      action: "adminGetScreenshot",
      adminToken,
      fileId: order.screenshotFileId,
    });
    setScreenshotLoading(false);
    if (res.success && res.data) setScreenshotUrl(res.data.url);
  };

  const updateStatus = async (order: OrderDoc, newStatus: string, remark = "") => {
    if (newStatus === "rejected" && !remark) {
      const r = prompt("请输入驳回原因（加盟商端可见）：");
      if (r === null) return;
      remark = r.trim();
      if (!remark) return;
    }
    const res = await callApi({
      action: "adminUpdateOrderStatus",
      adminToken,
      orderId: order.orderId,
      status: newStatus,
      remark,
    });
    if (handleAuthError(res.error)) return;
    if (res.success) {
      setMsg(`订单 ${order.orderId} 已更新为「${STATUS_LABEL[newStatus]}」`);
      setDetail(null);
      load();
    } else {
      setMsg(res.error || "操作失败");
    }
  };

  const exportXlsx = () => {
    if (!orders || orders.length === 0) return;
    // Sheet1: SKU 明细
    const rows: any[] = [];
    orders.forEach((o) => {
      o.items.forEach((it) => {
        rows.push({
          订单号: o.orderId,
          门店: o.storeName,
          下单时间: o.createdAt,
          商品: it.name,
          单价: it.price,
          数量: it.qty,
          单位: it.unit,
          小计: it.price * it.qty,
          状态: o.statusLabel,
        });
      });
      rows.push({
        订单号: o.orderId,
        门店: o.storeName,
        下单时间: o.createdAt,
        商品: "—— 合计 ——",
        单价: "",
        数量: "",
        单位: "",
        小计: o.total,
        状态: o.statusLabel,
      });
    });
    const ws1 = XLSX.utils.json_to_sheet(rows);
    // Sheet2: 订单汇总
    const summary = orders.map((o) => ({
      订单号: o.orderId,
      门店: o.storeName,
      下单时间: o.createdAt,
      商品种类: o.items.length,
      总件数: o.items.reduce((s, i) => s + i.qty, 0),
      总金额: o.total,
      状态: o.statusLabel,
      备注: o.remark,
    }));
    const ws2 = XLSX.utils.json_to_sheet(summary);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "订货明细");
    XLSX.utils.book_append_sheet(wb, ws2, "订单汇总");
    XLSX.writeFile(wb, `OHMO订货单_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const totalAmount = orders?.reduce((s, o) => s + o.total, 0) || 0;

  return (
    <div>
      {/* 筛选栏 */}
      <div className="bg-white border-b border-slate-200 p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">状态</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm">
            <option value="">全部</option>
            <option value="submitted">已提交</option>
            <option value="confirmed">已确认</option>
            <option value="shipped">已发货</option>
            <option value="rejected">已驳回</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">门店</label>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm">
            <option value="">全部</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">开始日期</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">结束日期</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-slate-300 rounded-md px-3 py-1.5 text-sm" />
        </div>
        <button onClick={load} className="bg-blue-600 text-white rounded-md px-4 py-1.5 text-sm font-medium">
          {loading ? "查询中..." : "查询"}
        </button>
        <button onClick={exportXlsx} disabled={!orders?.length} className="bg-green-600 text-white rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-40">
          导出 xlsx
        </button>
        <div className="ml-auto text-sm text-slate-600">
          共 {orders?.length || 0} 单 · 合计 <span className="font-bold text-red-600">{fmtMoney(totalAmount)}</span>
        </div>
      </div>

      {msg && <div className="mx-4 mt-3 p-2 bg-blue-50 text-blue-700 text-sm rounded">{msg}</div>}

      {/* 订单列表 */}
      <div className="p-4 space-y-3">
        {orders?.length === 0 && <div className="py-16 text-center text-slate-400">没有符合条件的订单</div>}
        {orders?.map((o) => (
          <div key={o._id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-slate-800">{o.orderId}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[o.status]}`}>{o.statusLabel}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {o.storeName} · {o.createdAt}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-red-600 text-lg">{fmtMoney(o.total)}</span>
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-600">
              {o.items.map((it) => `${it.name}×${it.qty}${it.unit}`).join("、")}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => viewScreenshot(o)} className="px-3 py-1.5 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-50">
                查看凭证
              </button>
              {o.status === "submitted" && (
                <button onClick={() => updateStatus(o, "confirmed")} className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm">
                  确认订单
                </button>
              )}
              {o.status === "confirmed" && (
                <button onClick={() => updateStatus(o, "shipped")} className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm">
                  标记发货
                </button>
              )}
              {o.status !== "rejected" && o.status !== "shipped" && (
                <button onClick={() => updateStatus(o, "rejected")} className="px-3 py-1.5 rounded-md border border-red-300 text-red-600 text-sm">
                  驳回
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 凭证查看弹窗 */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl p-4 max-w-lg w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium text-slate-800">{detail.orderId} · 转账凭证</div>
              <button onClick={() => setDetail(null)} className="text-slate-400 text-xl leading-none">×</button>
            </div>
            {screenshotLoading && <div className="py-16 text-center text-slate-400">加载中...</div>}
            {screenshotUrl && <img src={screenshotUrl} className="w-full rounded-lg" />}
            {!screenshotLoading && !screenshotUrl && <div className="py-16 text-center text-red-500 text-sm">凭证加载失败</div>}
            <div className="mt-3 text-sm text-slate-500">
              {detail.storeName} · {fmtMoney(detail.total)} · {detail.createdAt}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 门店管理 ====================
function StoresScreen({ adminToken, stores, reload }: { adminToken: string; stores: StoreDoc[]; reload: () => void }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [msg, setMsg] = useState("");
  const [created, setCreated] = useState<{ name: string; code: string } | null>(null);

  const create = async () => {
    if (!name.trim()) return;
    const res = await callApi<{ name: string; code: string }>({
      action: "adminCreateStore",
      adminToken,
      name: name.trim(),
      contact: contact.trim(),
    });
    if (handleAuthError(res.error)) return;
    if (res.success && res.data) {
      setCreated({ name: res.data.name, code: res.data.code });
      setName("");
      setContact("");
      reload();
    } else {
      setMsg(res.error || "创建失败");
    }
  };

  const toggle = async (s: StoreDoc) => {
    const res = await callApi({
      action: "adminToggleStore",
      adminToken,
      storeId: s._id,
      active: !s.active,
    });
    if (handleAuthError(res.error)) return;
    if (res.success) reload();
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* 新增门店 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="font-medium text-slate-800 mb-3">新增门店</div>
        <div className="flex flex-wrap gap-2 items-center">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="门店名称（必填）" className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1 min-w-40" />
          <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="联系人（选填）" className="border border-slate-300 rounded-md px-3 py-2 text-sm flex-1 min-w-40" />
          <button onClick={create} disabled={!name.trim()} className="bg-blue-600 text-white rounded-md px-5 py-2 text-sm font-medium disabled:opacity-40">
            创建
          </button>
        </div>
        {created && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            ✅ 门店「{created.name}」创建成功，门店码：<span className="font-mono font-bold text-lg tracking-widest text-green-700">{created.code}</span>
            <span className="text-slate-400 ml-2">（请发给加盟商）</span>
          </div>
        )}
        {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}
      </div>

      {/* 门店列表 */}
      <div className="space-y-2">
        {stores.map((s) => (
          <div key={s._id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-800">{s.name}</span>
                {!s.active && <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-500 text-xs">已停用</span>}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                门店码 <span className="font-mono text-slate-600">{s.code}</span>
                {s.contact ? ` · ${s.contact}` : ""} · 创建于 {s.createdAt}
              </div>
            </div>
            <button
              onClick={() => toggle(s)}
              className={`px-3 py-1.5 rounded-md text-sm ${s.active ? "border border-red-300 text-red-600" : "bg-green-600 text-white"}`}
            >
              {s.active ? "停用" : "启用"}
            </button>
          </div>
        ))}
        {stores.length === 0 && <div className="py-12 text-center text-slate-400 text-sm">还没有门店，先创建一个</div>}
      </div>
    </div>
  );
}

// ==================== 修改密码 ====================
function PasswordScreen({ adminToken }: { adminToken: string }) {
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const submit = async () => {
    setMsg("");
    setOkMsg("");
    const res = await callApi({ action: "adminChangePassword", adminToken, oldPassword, newPassword });
    if (handleAuthError(res.error)) return;
    if (res.success) {
      setOkMsg("密码修改成功");
      setOld("");
      setNew("");
    } else {
      setMsg(res.error || "修改失败");
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="font-medium text-slate-800 mb-3">修改管理员密码</div>
        <input type="password" value={oldPassword} onChange={(e) => setOld(e.target.value)} placeholder="旧密码" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mb-2" />
        <input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} placeholder="新密码（至少 6 位）" className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm" />
        {msg && <div className="mt-2 text-sm text-red-600">{msg}</div>}
        {okMsg && <div className="mt-2 text-sm text-green-600">{okMsg}</div>}
        <button onClick={submit} className="mt-3 w-full bg-slate-800 text-white rounded-md py-2 text-sm font-medium">
          保存
        </button>
      </div>
    </div>
  );
}

// ==================== 主应用 ====================
export default function App() {
  const [adminToken, setAdminToken] = useState<string | null>(loadAdminToken);
  const [tab, setTab] = useState<"orders" | "stores" | "pwd">("orders");
  const [stores, setStores] = useState<StoreDoc[]>([]);

  const loadStores = async () => {
    if (!adminToken) return;
    const res = await callApi<{ stores: StoreDoc[] }>({ action: "adminListStores", adminToken });
    if (handleAuthError(res.error)) return;
    if (res.success && res.data) setStores(res.data.stores);
  };

  useEffect(() => {
    if (adminToken) loadStores();
  }, [adminToken]);

  if (!adminToken) return <LoginScreen onLogin={setAdminToken} />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="font-bold">OHMO 订货管理后台</div>
        <button
          onClick={() => {
            saveAdminToken(null);
            setAdminToken(null);
          }}
          className="text-xs bg-white/10 rounded-full px-3 py-1.5"
        >
          退出
        </button>
      </div>
      <div className="bg-white border-b border-slate-200 flex">
        {(
          [
            ["orders", "订单管理"],
            ["stores", "门店管理"],
            ["pwd", "修改密码"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "orders" && <OrdersScreen adminToken={adminToken} stores={stores} />}
      {tab === "stores" && <StoresScreen adminToken={adminToken} stores={stores} reload={loadStores} />}
      {tab === "pwd" && <PasswordScreen adminToken={adminToken} />}
    </div>
  );
}
