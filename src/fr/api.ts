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
    return { success: false, error: "网络异常，请检查网络后重试" };
  }
}

// ==================== CloudBase 云存储直传（绕过网关请求体限制） ====================

const CB_ENV = "careooolv-d8gnyhzsnfe9e7356";
const CB_REGION = "ap-shanghai";

let cbAppPromise: Promise<any> | null = null;

function getCbApp(): Promise<any> {
  if (!cbAppPromise) {
    cbAppPromise = (async () => {
      const cloudbase = (await import("@cloudbase/js-sdk")).default;
      const accessKey = import.meta.env.VITE_PUBLISHABLE_KEY as string;
      if (!accessKey) throw new Error("缺少云环境配置");
      const app = cloudbase.init({
        env: CB_ENV,
        region: CB_REGION,
        accessKey,
        auth: { detectSessionInUrl: true },
      });
      return app;
    })();
  }
  return cbAppPromise;
}

/** 压缩图片为 JPEG Blob：最长边 1600px，质量 0.8 */
export function compressToBlob(file: File, maxSide = 1600, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          const ratio = Math.min(maxSide / width, maxSide / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("图片编码失败"))),
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("图片读取失败"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

/** 匿名登录并直传凭证到云存储，返回 fileID（订单接口只传这个短字符串） */
export async function uploadVoucher(file: File): Promise<string> {
  const app = await getCbApp();
  const auth = app.auth;
  try {
    const { data } = await auth.getSession();
    if (!data?.session) {
      const { error } = await auth.signInAnonymously();
      if (error) throw new Error("登录云服务失败：" + (error.message || "请稍后重试"));
    }
  } catch (e: any) {
    throw new Error("登录云服务失败，请稍后重试");
  }
  const blob = await compressToBlob(file);
  const cloudPath = `fr-screenshots/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.jpg`;
  const res = await app.uploadFile({ cloudPath, filePath: blob });
  const fileID = res?.fileID;
  if (!fileID) throw new Error("凭证上传失败，请重试");
  return fileID as string;
}

export function fmtMoney(n: number): string {
  return "¥" + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, "");
}
