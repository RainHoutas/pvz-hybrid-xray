# 🌻 杂交版关卡快捷查看器 | PvZ Hybrid Level Quick Viewer

[中文](#中文介绍) | [English](#english-introduction)

---

## 中文介绍

**杂交版关卡快捷查看器 (Hybrid Level Quick Viewer)** 是一个专为《植物大战僵尸：杂交版》设计的 Web 应用工具。它允许玩家和开发者快速解析、可视化和检索游戏内的关卡配置数据。

无论你是想提前了解关卡的波次安排、分析地形机制，还是查看隐藏的实体属性，这个工具都能为你提供直观、详细的数据展示。

### ✨ 核心功能
*   **多模式关卡支持**: 完美兼容常规防守波次 (Wave)、砸罐子 (Vase) 和 我僵 (IZM) 等多种游戏模式。
*   **直观的沙盒网格可视化**: 高度还原游戏内的场地布局，支持图层叠加显示，并通过 React Portal 解决了复杂的 UI 遮挡问题。
*   **详细的实体属性悬浮窗**: 鼠标悬停即可查看植物和僵尸的具体属性（如：是否可移动、特殊的 Override 逻辑等）。
*   **波次时间轴预测**: 结合 TipsPlay 事件，以时间轴形式可视化每一波的僵尸攻势和游戏提示。
*   **本地缓存与搜索历史**: 智能记录你的检索历史，并在刷新页面后保持当前关卡状态，提升使用体验。

### 🛠️ 技术栈
*   **框架**: [Next.js](https://nextjs.org/) (App Router) + React
*   **样式**: Vanilla CSS / CSS Modules
*   **其他**: React Portals (用于全局悬浮提示)

### 🚀 快速开始

1.  克隆仓库:
    ```bash
    git clone https://github.com/RainHoutas/pvz-hybrid-xray.git
    cd pvz-hybrid-xray
    ```
2.  安装依赖:
    ```bash
    npm install
    ```
3.  启动开发服务器:
    ```bash
    npm run dev
    ```
4.  在浏览器中打开 [http://localhost:3000](http://localhost:3000) 即可使用。

### 📢 开发者絮语 / 欢迎交流

本项目目前处于**早期开发阶段**，可能会有一些 Bug 或未完善的地方。劳烦大家帮忙测试，如遇问题欢迎通过 GitHub 提交 Issue！

另外，本项目全程使用 Antigravity 进行 Vibe Coding 辅助开发。本人目前代码技术不精，还在不断学习中，如有代码不够优雅之处敬请谅解。

非常欢迎进行 AI 开发相关的探讨与交流！
*   **联系 QQ**: 1271084579

---

## English Introduction

**PvZ Hybrid Level Quick Viewer** is a dedicated web application designed for "Plants vs. Zombies: Hybrid Edition". It allows players and developers to quickly parse, visualize, and search through in-game level configuration data.

Whether you want to preview wave arrangements, analyze terrain mechanics, or uncover hidden entity attributes, this tool provides an intuitive and detailed data presentation.

### ✨ Core Features
*   **Multi-Mode Level Support**: Fully compatible with various game modes including standard Defense Waves, Vasebreaker, and I, Zombie (IZM).
*   **Intuitive Sandbox Grid Visualization**: Highly accurate recreation of in-game lawn layouts, supporting multi-layer entity display, and utilizing React Portals to resolve complex UI occlusion.
*   **Detailed Entity Tooltips**: Hover over plants and zombies to view specific attributes (e.g., movability, special Override logic).
*   **Wave Timeline Forecast**: Visualizes zombie offensives and game tips for each wave along a timeline, integrating `TipsPlay` events.
*   **Local Caching & Search History**: Smartly records your search history and persists the current level state across page refreshes for a seamless user experience.

### 🛠️ Tech Stack
*   **Framework**: [Next.js](https://nextjs.org/) (App Router) + React
*   **Styling**: Vanilla CSS / CSS Modules
*   **Other**: React Portals (for global tooltips)

### 🚀 Getting Started

1.  Clone the repository:
    ```bash
    git clone https://github.com/RainHoutas/pvz-hybrid-xray.git
    cd pvz-hybrid-xray
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 📢 Developer's Note / Contact

This project is currently in the **early development stage**. There might be some bugs or incomplete features. Your help in testing is greatly appreciated! If you encounter any problems, please feel free to submit an issue.

Furthermore, this project was developed entirely using Antigravity for Vibe Coding. I am currently a beginner and still learning how to code, so please be understanding of any unpolished code.

I warmly welcome any communication or discussions related to AI-assisted development!
*   **Contact QQ**: 1271084579
