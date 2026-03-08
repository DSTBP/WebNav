<div align="center">
    <h1>WebNav - 简约高效的个人导航页</h1>
</div>

<p align="center">
  <img src="images/favicon.png" alt="WebNav Logo" width="100">
</p>


<p align="center">
  <a href="https://github.com/DSTBP/WebNav/stargazers"><img src="https://img.shields.io/github/stars/DSTBP/WebNav?style=flat-square" alt="Stars"></a>
  <a href="https://github.com/DSTBP/WebNav/network/members"><img src="https://img.shields.io/github/forks/DSTBP/WebNav?style=flat-square" alt="Forks"></a>
  <a href="https://github.com/DSTBP/WebNav/blob/main/LICENSE"><img src="https://img.shields.io/github/license/DSTBP/WebNav?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/Language-HTML/JS/CSS-orange?style=flat-square" alt="Language">
</p>

WebNav 是一个轻量级、响应式的个人导航站点模板。它旨在帮助开发者、学生和互联网爱好者高效地管理、组织及快速访问常用工具与网站。只需简单的配置，即可拥有一个属于自己的个性化浏览器主页。

简体中文 | [English](README.md)

## ✨ 项目特性

- 🚀 **响应式设计**：基于 Bootstrap 构建，完美适配桌面、平板和移动端。
- 🌓 **深色模式**：支持一键切换深色/浅色主题，保护视力，提升体验。
- 📂 **分类管理**：通过侧边栏轻松切换不同类别的链接。
- 🔍 **URL 检查工具**：内置专用的 URL 检查器（`url-checker.html`），方便验证链接有效性。
- ⚡ **极简架构**：纯静态页面，无需后端数据库，加载速度极快，可零成本部署于 GitHub Pages 或 Vercel。
- 🎨 **高度定制**：所有导航数据均在本地 JS 文件中维护，修改方便。

## 📸 界面预览

![image-20260308164958027](images/homepage.png)
- 首页：展示所有分类的磁贴式链接。
- 侧边栏：快速跳转定位分类。
- 工具页：URL 检测功能演示。

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/DSTBP/WebNav.git
cd WebNav
```

### 2. 本地运行

由于本项目是纯静态的，您可以直接用浏览器打开 `index.html` 即可看到效果。

### 3. 部署

您可以将此仓库推送到 GitHub，并在仓库设置中开启 **GitHub Pages**，即可通过 `https://<your-username>.github.io/WebNav` 访问。

## 🛠 如何自定义导航内容

您不需要修改 HTML 结构，所有的导航链接数据都存储在：

```
asserts/js/data.js
```

只需按照以下格式编辑该文件即可：

JavaScript

```js
// 示例数据结构
const navData = [
  {
    category: "常用工具",
    links: [
      { name: "GitHub", url: "https://github.com", icon: "github" },
      { name: "Google", url: "https://google.com", icon: "google" }
    ]
  }
];
```

## 🤝 社区反馈与共建

我们非常欢迎社区成员的参与！如果您有任何想法或建议，可以通过以下方式参与：

- **提交 Issue**：发现 Bug 或有新的功能需求？请[在此提交](https://www.google.com/search?q=https://github.com/DSTBP/WebNav/issues)。
- **提交 PR**：如果您优化了 CSS 样式或增加了新功能，欢迎发起 Pull Request。
- **反馈渠道**：您可以通过 GitHub 讨论区或直接在 Issue 中与我交流。

在贡献代码前，请确保您的代码风格与项目保持一致，并经过基础的本地测试。

## 📂 文件结构

```
WebNav/
├── asserts/
│   ├── css/          # 样式表 (App, Bootstrap, FontAwesome)
│   └── js/           # 核心逻辑与数据配置 (app.js, data.js)
├── images/           # 图标与静态资源
├── index.html        # 项目主页
├── url-checker.html  # 链接检测工具页
├── LICENSE           # 开源许可证
└── README.md         # 项目说明文档
```

## 📄 许可证

本项目采用 **MIT 许可证**。您可以自由地使用、修改和分发本项目，但请保留原作者的版权声明。详情请参阅 [LICENSE](https://www.google.com/search?q=LICENSE) 文件。

------

**WebNav** - 让网络导航回归简洁。

如果这个项目对你有帮助，请点一个 **Star** ⭐，这是对我最大的鼓励！