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

/** 压缩图片：最长边 1600px，JPEG 质量 0.8，返回 base64（不含 data: 前缀） */
export function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<string> {
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
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl.split(",")[1]);
      };
      img.onerror = () => reject(new Error("图片读取失败"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

export function fmtMoney(n: number): string {
  return "¥" + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, "");
}
