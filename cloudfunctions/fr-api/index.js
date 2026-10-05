const cloud = require("@cloudbase/node-sdk");
const crypto = require("crypto");

const app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
const db = app.database();
const _ = db.command;
const storesCol = db.collection("fr_stores");
const ordersCol = db.collection("fr_orders");
const configCol = db.collection("fr_config");
const uploadsCol = db.collection("fr_uploads");

const TOKEN_SECRET = process.env.FR_TOKEN_SECRET || "ohmo-fr-token-secret-2026-x9k2";
const DEFAULT_ADMIN_PASSWORD = "ohmo2026";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function sha256(s) {
  return crypto.createHash("sha256").update(String(s), "utf8").digest("hex");
}

function hmac(s) {
  return crypto.createHmac("sha256", TOKEN_SECRET).update(String(s)).digest("base64url");
}

function signToken(storeId) {
  const exp = Date.now() + 365 * 24 * 3600 * 1000;
  const payload = `${storeId}.${exp}`;
  return `${payload}.${hmac(payload)}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [storeId, exp, sig] = parts;
  if (hmac(`${storeId}.${exp}`) !== sig) return null;
  if (Number(exp) < Date.now()) return null;
  return storeId;
}

function nowBeijing() {
  // 北京时间 ISO 字符串（无时区后缀），便于按前缀筛选日期
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  return d.toISOString().replace("T", " ").substring(0, 19);
}

function beijingDate() {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  return d.toISOString().substring(0, 10).replace(/-/g, "");
}

function genStoreCode() {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

function ok(data) {
  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify({ success: true, data }),
  };
}

function fail(statusCode, message) {
  return {
    isBase64Encoded: false,
    statusCode: statusCode || 400,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify({ success: false, error: message }),
  };
}

async function ensureAdminConfig() {
  const res = await configCol.doc("admin").get();
  if (!res.data || res.data.length === 0) {
    await configCol.doc("admin").set({
      passwordHash: sha256(DEFAULT_ADMIN_PASSWORD),
      updatedAt: nowBeijing(),
    });
    return { passwordHash: sha256(DEFAULT_ADMIN_PASSWORD) };
  }
  return res.data[0];
}

function signAdminToken() {
  const exp = Date.now() + 7 * 24 * 3600 * 1000;
  const payload = `admin.${exp}`;
  return `${payload}.${hmac(payload)}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [who, exp, sig] = parts;
  if (who !== "admin") return false;
  if (hmac(`${who}.${exp}`) !== sig) return false;
  return Number(exp) > Date.now();
}

// ==================== 加盟商端 ====================

async function bindStore(p) {
  const code = String(p.code || "").trim().toUpperCase();
  if (!code) return fail(400, "请输入门店码");
  const res = await storesCol.where({ code, active: true }).get();
  if (!res.data || res.data.length === 0) return fail(404, "门店码无效或已停用");
  const store = res.data[0];
  return ok({
    storeId: store._id,
    storeName: store.name,
    token: signToken(store._id),
  });
}

async function validateStore(p) {
  const storeId = verifyToken(p.token);
  if (!storeId) return fail(401, "登录已过期，请重新输入门店码");
  const res = await storesCol.doc(storeId).get();
  if (!res.data || res.data.length === 0) return fail(404, "门店不存在");
  const store = res.data[0];
  if (!store.active) return fail(403, "该门店已被停用，请联系品牌方");
  return ok({ storeId: store._id, storeName: store.name });
}

async function createOrder(p) {
  const storeId = verifyToken(p.token);
  if (!storeId) return fail(401, "登录已过期，请重新输入门店码");
  const storeRes = await storesCol.doc(storeId).get();
  if (!storeRes.data || storeRes.data.length === 0) return fail(404, "门店不存在");
  const store = storeRes.data[0];
  if (!store.active) return fail(403, "该门店已被停用，无法下单");

  const items = Array.isArray(p.items) ? p.items : [];
  const cleanItems = items
    .map((it) => ({
      productId: Number(it.id) || 0,
      name: String(it.name || "").trim(),
      price: Number(it.price) || 0,
      unit: String(it.unit || "箱").trim(),
      qty: Number(it.qty) || 0,
    }))
    .filter((it) => it.name && it.qty > 0);
  if (cleanItems.length === 0) return fail(400, "订单明细为空");

  const total = cleanItems.reduce((s, it) => s + it.price * it.qty, 0);

  // 凭证由前端直传云存储（绕过网关请求体大小限制），这里只接收 fileID
  const shotFileId = String(p.screenshotFileId || "");
  if (!shotFileId) return fail(400, "请上传转账凭证后再提交订单");
  if (!shotFileId.startsWith("cloud://") || shotFileId.length > 300) {
    return fail(400, "凭证信息无效，请重新上传");
  }

  // 订单号：OHMO + 北京时间日期 + 当日序号
  const dateStr = beijingDate();
  const countRes = await ordersCol
    .where({ orderDay: dateStr })
    .count();
  let seq = (countRes.total || 0) + 1;
  let orderId = `OHMO${dateStr}${String(seq).padStart(4, "0")}`;

  // 上传凭证已由前端直传，直接记录 fileID
  const fileId = shotFileId;

  const createdAt = nowBeijing();
  const doc = {
    orderId,
    orderDay: dateStr,
    storeId,
    storeName: store.name,
    items: cleanItems,
    total: Math.round(total * 100) / 100,
    screenshotFileId: fileId,
    status: "submitted",
    statusLabel: "已提交",
    remark: "",
    createdAt,
    createdAtMs: Date.now(),
    updatedAt: createdAt,
    timeline: [{ status: "submitted", time: createdAt }],
  };

  // 重试避免极小概率的订单号冲突
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const exists = await ordersCol.where({ orderId }).count();
      if (exists.total > 0) {
        seq += 1;
        orderId = `OHMO${dateStr}${String(seq).padStart(4, "0")}`;
        doc.orderId = orderId;
        continue;
      }
      await ordersCol.add(doc);
      return ok({ orderId, total: doc.total, createdAt });
    } catch (e) {
      if (attempt === 2) {
        console.error("create order failed", e);
        return fail(500, "订单保存失败，请重试");
      }
    }
  }
  return fail(500, "订单号生成冲突，请重试");
}

// ==================== 凭证分片上传（绕过网关请求体限制） ====================

async function initVoucherUpload(p) {
  const storeId = verifyToken(p.token);
  if (!storeId) return fail(401, "登录已过期，请重新输入门店码");
  const total = Number(p.totalBase64) || 0;
  if (total <= 0 || total > 6 * 1024 * 1024) return fail(400, "图片大小无效");

  // 顺手清理 1 天前的半途而废的分片
  try {
    await uploadsCol.where({ createdAtMs: _.lt(Date.now() - 24 * 3600 * 1000) }).remove();
  } catch (e) { /* 忽略清理失败 */ }

  const uploadId = crypto.randomBytes(12).toString("hex");
  await uploadsCol.add({
    uploadId,
    storeId,
    parts: {},
    totalBase64: total,
    createdAtMs: Date.now(),
  });
  return ok({ uploadId });
}

async function pushVoucherChunk(p) {
  const storeId = verifyToken(p.token);
  if (!storeId) return fail(401, "登录已过期，请重新输入门店码");
  const uploadId = String(p.uploadId || "");
  const seq = Number(p.seq);
  const data = String(p.data || "");
  if (!uploadId || !Number.isInteger(seq) || seq < 0 || seq > 500) return fail(400, "分片参数无效");
  if (!data || data.length > 30000 || !/^[A-Za-z0-9+/=]+$/.test(data)) return fail(400, "分片数据无效");
  const res = await uploadsCol.where({ uploadId, storeId }).update({
    [`parts.${seq}`]: data,
  });
  if (!res.updated) return fail(404, "上传会话不存在，请重新提交");
  return ok({});
}

async function finalizeVoucherUpload(p) {
  const storeId = verifyToken(p.token);
  if (!storeId) return fail(401, "登录已过期，请重新输入门店码");
  const uploadId = String(p.uploadId || "");
  const res = await uploadsCol.where({ uploadId, storeId }).get();
  const doc = res.data && res.data[0];
  if (!doc) return fail(404, "上传会话不存在，请重新提交");

  const seqs = Object.keys(doc.parts || {}).map(Number).sort((a, b) => a - b);
  if (seqs.length === 0) return fail(400, "没有收到分片数据，请重新提交");
  let b64 = "";
  for (const s of seqs) b64 += doc.parts[s];
  if (b64.length < 100) return fail(400, "凭证数据异常，请重新上传");
  // 校验连续性：序列号应从 0 连续递增
  for (let i = 0; i < seqs.length; i++) {
    if (seqs[i] !== i) return fail(400, "分片不完整，请重新提交");
  }

  const buf = Buffer.from(b64, "base64");
  if (buf.length < 1024 || buf.length > 6 * 1024 * 1024) return fail(400, "凭证大小异常，请重新上传");
  const ext = buf[0] === 0x89 && buf[1] === 0x50 ? "png" : "jpg";

  let fileId = "";
  try {
    const up = await app.uploadFile({
      cloudPath: `fr-screenshots/${uploadId}.${ext}`,
      fileContent: buf,
    });
    fileId = up.fileID;
  } catch (e) {
    console.error("voucher upload failed", e);
    return fail(500, "凭证保存失败，请重试");
  }
  try { await uploadsCol.doc(doc._id).remove(); } catch (e) { /* 忽略 */ }
  return ok({ fileId });
}

async function listMyOrders(p) {  const storeId = verifyToken(p.token);
  if (!storeId) return fail(401, "登录已过期，请重新输入门店码");
  const res = await ordersCol
    .where({ storeId })
    .orderBy("createdAtMs", "desc")
    .limit(50)
    .get();
  return ok({ orders: res.data || [] });
}

// ==================== 管理端 ====================

async function adminLogin(p) {
  const cfg = await ensureAdminConfig();
  if (sha256(p.password || "") !== cfg.passwordHash) return fail(401, "密码错误");
  return ok({ adminToken: signAdminToken() });
}

async function adminChangePassword(p) {
  if (!verifyAdminToken(p.adminToken)) return fail(401, "请重新登录");
  const cfg = await ensureAdminConfig();
  if (sha256(p.oldPassword || "") !== cfg.passwordHash) return fail(401, "旧密码错误");
  const np = String(p.newPassword || "");
  if (np.length < 6) return fail(400, "新密码至少 6 位");
  await configCol.doc("admin").update({
    passwordHash: sha256(np),
    updatedAt: nowBeijing(),
  });
  return ok({});
}

async function adminListStores(p) {
  if (!verifyAdminToken(p.adminToken)) return fail(401, "请重新登录");
  const res = await storesCol.orderBy("createdAtMs", "desc").limit(500).get();
  return ok({ stores: res.data || [] });
}

async function adminCreateStore(p) {
  if (!verifyAdminToken(p.adminToken)) return fail(401, "请重新登录");
  const name = String(p.name || "").trim();
  if (!name) return fail(400, "请输入门店名称");
  const code = genStoreCode();
  const createdAt = nowBeijing();
  await storesCol.add({
    name,
    code,
    active: true,
    contact: String(p.contact || "").trim(),
    createdAt,
    createdAtMs: Date.now(),
  });
  return ok({ name, code, createdAt });
}

async function adminToggleStore(p) {
  if (!verifyAdminToken(p.adminToken)) return fail(401, "请重新登录");
  if (!p.storeId) return fail(400, "缺少 storeId");
  await storesCol.doc(p.storeId).update({
    active: !!p.active,
    updatedAt: nowBeijing(),
  });
  return ok({});
}

async function adminListOrders(p) {
  if (!verifyAdminToken(p.adminToken)) return fail(401, "请重新登录");
  const cond = {};
  const f = p.filters || {};
  if (f.status) cond.status = f.status;
  if (f.storeId) cond.storeId = f.storeId;
  if (f.dateFrom && f.dateTo) {
    cond.orderDay = _.gte(f.dateFrom.replace(/-/g, "")).and(_.lte(f.dateTo.replace(/-/g, "")));
  } else if (f.dateFrom) {
    cond.orderDay = _.gte(f.dateFrom.replace(/-/g, ""));
  } else if (f.dateTo) {
    cond.orderDay = _.lte(f.dateTo.replace(/-/g, ""));
  }
  const res = await ordersCol
    .where(cond)
    .orderBy("createdAtMs", "desc")
    .limit(500)
    .get();
  return ok({ orders: res.data || [] });
}

async function adminUpdateOrderStatus(p) {
  if (!verifyAdminToken(p.adminToken)) return fail(401, "请重新登录");
  const valid = ["submitted", "confirmed", "shipped", "rejected"];
  if (!valid.includes(p.status)) return fail(400, "无效状态");
  const orderId = String(p.orderId || "");
  if (!orderId) return fail(400, "缺少订单号");
  const time = nowBeijing();
  await ordersCol.where({ orderId }).update({
    status: p.status,
    statusLabel: { submitted: "已提交", confirmed: "已确认", shipped: "已发货", rejected: "已驳回" }[p.status],
    remark: String(p.remark || ""),
    updatedAt: time,
    timeline: _.push([{ status: p.status, time }]),
  });
  return ok({});
}

async function adminGetScreenshot(p) {
  if (!verifyAdminToken(p.adminToken)) return fail(401, "请重新登录");
  if (!p.fileId) return fail(400, "缺少文件 ID");
  const res = await app.getTempFileURL({ fileList: [p.fileId] });
  const f = res.fileList && res.fileList[0];
  if (!f || !f.tempFileURL) return fail(404, "凭证文件不存在");
  return ok({ url: f.tempFileURL });
}

// ==================== 入口 ====================

exports.main = async (event) => {
  // OPTIONS 预检
  if (event.httpMethod === "OPTIONS") {
    return {
      isBase64Encoded: false,
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  let p = {};
  try {
    const raw = event.body != null ? event.body : event;
    p = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (p && typeof p.body === "string") p = JSON.parse(p.body);
  } catch (e) {
    return fail(400, "请求格式错误");
  }

  const action = p && p.action;
  try {
    switch (action) {
      case "bindStore":
        return await bindStore(p);
      case "validateStore":
        return await validateStore(p);
      case "createOrder":
        return await createOrder(p);
      case "initVoucherUpload":
        return await initVoucherUpload(p);
      case "pushVoucherChunk":
        return await pushVoucherChunk(p);
      case "finalizeVoucherUpload":
        return await finalizeVoucherUpload(p);
      case "listMyOrders":
        return await listMyOrders(p);
      case "adminLogin":
        return await adminLogin(p);
      case "adminChangePassword":
        return await adminChangePassword(p);
      case "adminListStores":
        return await adminListStores(p);
      case "adminCreateStore":
        return await adminCreateStore(p);
      case "adminToggleStore":
        return await adminToggleStore(p);
      case "adminListOrders":
        return await adminListOrders(p);
      case "adminUpdateOrderStatus":
        return await adminUpdateOrderStatus(p);
      case "adminGetScreenshot":
        return await adminGetScreenshot(p);
      default:
        return fail(400, `未知 action: ${action}`);
    }
  } catch (e) {
    console.error("internal error", action, e);
    return fail(500, "服务器内部错误，请稍后重试");
  }
};
