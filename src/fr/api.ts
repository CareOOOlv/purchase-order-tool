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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(blob);
  });
}

/**
 * 分片上传凭证：压缩后切成 <32KB 的分片依次过 HTTP 网关，
 * 云函数在服务端拼装并上传云存储，返回 fileID。
 * 不依赖任何浏览器直连（兼容任意部署域名，包括微信内打开）。
 */
export async function uploadVoucher(
  token: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const blob = await compressToBlob(file);
  const b64 = await blobToBase64(blob);

  // 1. 初始化，拿 uploadId
  const init = await callApi<{ uploadId: string }>({
    action: "initVoucherUpload",
    token,
    totalBase64: b64.length,
  });
  if (!init.success || !init.data) throw new Error(init.error || "凭证上传初始化失败");
  const uploadId = init.data.uploadId;

  // 2. 分片推送（每片失败自动重试 2 次）
  const CHUNK = 24000; // base64 字符数/片，请求体 <32KB
  const total = Math.ceil(b64.length / CHUNK);
  for (let seq = 0; seq < total; seq++) {
    const data = b64.slice(seq * CHUNK, (seq + 1) * CHUNK);
    let done = false;
    for (let retry = 0; retry < 3 && !done; retry++) {
      const r = await callApi({
        action: "pushVoucherChunk",
        token,
        uploadId,
        seq,
        data,
      });
      if (r.success) done = true;
      else if (retry === 2) throw new Error(r.error || "凭证上传失败，请重试");
    }
    onProgress?.(Math.round(((seq + 1) / total) * 100));
  }

  // 3. 完成拼装，换取 fileID
  const fin = await callApi<{ fileId: string }>({
    action: "finalizeVoucherUpload",
    token,
    uploadId,
  });
  if (!fin.success || !fin.data) throw new Error(fin.error || "凭证上传失败，请重试");
  return fin.data.fileId;
}

export function fmtMoney(n: number): string {
  return "¥" + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, "");
}
