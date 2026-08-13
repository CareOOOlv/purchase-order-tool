# OHMO 采购单 / 成本测算工具

React 19 + Vite 7 + Tailwind CSS + shadcn/ui 构建的移动端工具集。

## 三个工具（独立入口，互不互通）

| 工具 | 访问地址 | 适用 |
|------|----------|------|
| 采购单生成 | https://ohmo-purchase-careooolv-d8gnyhzsnfe9e7356.webapps.tcloudbase.com | 门店订货 |
| 成本利润测算 | https://ohmo-cost-careooolv-d8gnyhzsnfe9e7356.webapps.tcloudbase.com | 内部（含售价利润） |
| 纯成本工具 | https://ohmo-simplecost-careooolv-d8gnyhzsnfe9e7356.webapps.tcloudbase.com | 外部（仅成本） |

- 部署：CloudBase 静态托管（国内 CDN，手机普通浏览器/微信均可稳定访问）
- 微信内置浏览器无法下载文件，页面已检测并引导用户「在浏览器打开」后导出
- GitHub Pages 备份：https://careooolv.github.io/purchase-order-tool/（index/cost/simplecost.html）

## 开发

```bash
npm install
npm run dev      # 本地开发
npm run build    # 三入口构建（index/cost/simplecost）
```

## 构建

- `vite.config.ts` 三入口：index.html / cost.html / simplecost.html
- 部署目录：`cloudbase-deploy/{purchase,cost,simplecost}/`（各工具独立子域名）
