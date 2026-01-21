# Region Plus

A VS Code extension that provides enhanced region block management functionality for all languages.

![Region Plus Screenshot](./demo.gif)

## ✨ Features

- 🎨 **Visual Block Markers** - Provides color highlighting for `#region` / `#endregion` blocks
- 📁 **Code Folding** - Supports region block folding for all file types
- 🚀 **Quick Navigation** - Jump to specific blocks quickly through the sidebar tree view
- ⚠️ **Syntax Validation** - Automatically detects unmatched region blocks and provides warnings
- 🎛️ **Custom Styling** - Adjustable block marker and background colors
- 🖱️ **Smart Highlighting** - Automatically highlights the entire block range when the cursor is within a block

## 🚀 Usage

### Quick Navigation

1. Find the "region-block" panel in the sidebar "Explorer"
2. Click on any block name to quickly jump to the corresponding location
3. Or use the command palette (`Ctrl+Shift+P`) to execute the "jump to region by line number" command

## ⚙️ Configuration Options

Adjust the following options in VS Code settings:

- `region-plus.firstLineColor`: Set the background color for the region start line (default: `rgba(43, 106, 75, 0.3)`)
- `region-plus.blockColor`: Set the background color when the cursor is within a block (default: `rgba(43, 106, 75, 0.1)`)

## ⚠️ Note

This extension only supports the `// #region` / `// #endregion` comment syntax. Languages that use preprocessor directives for regions (such as C#'s `#region` or C/C++'s `#pragma region`) are not supported by this extension, but their native region functionality will still work normally in VS Code.
