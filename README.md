# Region Plus

一個專為 JavaScript 和 Vue.js 開發者設計的 VS Code 擴展，提供增強的 region 區塊管理功能。

## ✨ 功能特性

- 🎨 **視覺化區塊標記** - 為 `#region` / `#endregion` 區塊提供顏色高亮顯示
- 📁 **程式碼折疊** - 支援 JavaScript 和 Vue 檔案的 region 區塊折疊
- 🚀 **快速導航** - 透過側邊欄樹狀視圖快速跳轉到指定區塊
- ⚠️ **語法檢查** - 自動檢測未完整配對的 region 區塊並提供警告
- 🎛️ **自訂配色** - 可調整區塊標記和背景顏色
- 🖱️ **智慧高亮** - 當游標在區塊內時自動高亮整個區塊範圍

## 🚀 使用方式

### 快速導航

1. 在側邊欄的「Explorer」中找到「region-block」面板
2. 點擊任意區塊名稱即可快速跳轉到對應位置
3. 或使用命令面板 (`Ctrl+Shift+P`) 執行「jump to region by line number」命令

## ⚙️ 設定選項

在 VS Code 設定中調整以下選項：

- `region-plus.firstLineColor`: 設定 region 起始行的背景顏色 (預設: `rgba(43, 106, 75, 0.3)`)
- `region-plus.blockColor`: 設定游標位於區塊內時的背景顏色 (預設: `rgba(43, 106, 75, 0.1)`)

## 🎯 支援語言

- JavaScript (.js)
- Vue.js (.vue)
