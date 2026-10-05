export const API_URL =
  "https://careooolv-d8gnyhzsnfe9e7356-1438923118.ap-shanghai.app.tcloudbase.com/fr-api";

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function callApi<T = any>(
  payload: Record<string, unknown>
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json as ApiResult<T>;
  } catch (e) {
    return { success: false, error: "网络异常，请重试" };
  }
}

export function loadAdminToken(): string | null {
  return localStorage.getItem("ohmo_fr_admin");
}

export function saveAdminToken(token: string | null) {
  if (token) localStorage.setItem("ohmo_fr_admin", token);
  else localStorage.removeItem("ohmo_fr_admin");
}

export function fmtMoney(n: number): string {
  return "¥" + (Math.round(n * 100) / 100).toFixed(2);
}

export const STATUS_LABEL: Record<string, string> = {
  submitted: "已提交",
  confirmed: "已确认",
  shipped: "已发货",
  rejected: "已驳回",
};

export const STATUS_STYLE: Record<string, string> = {
  submitted: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};
