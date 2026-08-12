# 部署到 GitHub Pages 步骤

## 方式一：最简单（推荐）

### 第1步：在 GitHub 创建仓库
1. 打开 https://github.com/new
2. 仓库名称填 `purchase-order-tool`
3. 选择 **Public**（公开）
4. 点击 **Create repository**

### 第2步：上传代码
1. 在新仓库页面，点击 **Add file** → **Upload files**
2. 把本文件夹下**所有文件**（src/、public/、package.json 等）拖拽上传
3. 点击 **Commit changes**

### 第3步：开启 GitHub Pages
1. 点击仓库顶部 **Settings** 标签
2. 左侧菜单点击 **Pages**
3. **Source** 选择 **GitHub Actions**
4. 完成！等待1-2分钟

### 第4步：访问网站
- 部署完成后，在 **Settings → Pages** 里会看到绿色链接，例如：
- `https://yourname.github.io/purchase-order-tool/`

---

## 方式二：用命令行

```bash
# 1. 克隆你的空仓库
git clone https://github.com/你的用户名/purchase-order-tool.git
cd purchase-order-tool

# 2. 把本文件夹所有文件复制进去（.git 文件夹除外）
cp -r /path/to/采购单工具-源代码/* .

# 3. 推送
git add .
git commit -m "init"
git push origin main
```

推送后 GitHub Actions 会自动构建部署，1-2分钟后即可访问。

---

## 注意事项

- 仓库必须是 **Public**（公开的）才能免费使用 GitHub Pages
- logo 图片路径：`public/logo.png`，如果需要换 logo 直接替换这个文件
- 部署后访问地址：`https://你的用户名.github.io/仓库名/`
