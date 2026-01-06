<div align="center">
<img src="./favicon.png">
<h1>WebNav</h1>
<p>一个简单美观的个人网址导航主页</p>
<p>依托 GitHubPages 和 Workflows 无服务器部署</p>
<p>Powered by 
<a href="https://github.com/geneasy/geneasy" target="_blank"><strong>GenEasy</strong></a> & 
<a href="https://github.com/imsyy/OneNav" target="_blank"><strong>OneNav</strong></a> & 
<a href="https://github.com/WebStackPage/WebStackPage.github.io" target="_blank"><strong>WebStackPage</strong></a>
</p>
</div>


## 项目简介

DSTBP Navigation 是一个简洁、优雅的个人网址导航页面，为用户提供了丰富多样的实用网址分类集合，涵盖学术资源、赛题平台、AI 站点、设计素材等多个领域。用户可以通过该导航页快速访问各类常用网站，提高上网效率。

## 项目结构

```plaintext
123/
├── css/
│   ├── animation.min.css
│   ├── background.css
│   ├── bootstrap.min.css
│   ├── dark.min.css
│   ├── loading.min.css
│   ├── mobile.min.css
│   └── style.min.css
├── js/
│   ├── background.js
│   ├── lozad.min.js
│   ├── jquery.min.js
│   ├── search.js
│   └── url-checker.js
├── data.json
├── favicon.ico
└── index.html
```

### 主要文件说明

- **index.html**：项目的主页面，负责页面的整体布局和结构，包括侧边栏菜单、搜索区域和链接内容区等。页面加载完成后，会根据 data.json 文件动态生成侧边栏菜单和链接内容。
- **data.json**：存储了所有导航链接的信息，包括网站名称、URL、图标和描述等，并且按照不同的类别进行了分组，如 “赛题平台”、“学术资源”、“AI 站点” 等。
- **css/ 文件夹**：包含了项目所需的所有 CSS 样式文件，用于美化页面，实现不同的主题效果（如夜间模式）和响应式布局。
- **js/ 文件夹**：包含了项目所需的 JavaScript 脚本文件，实现了页面的交互功能，如搜索功能、背景设置、URL 检查等。

## 功能特性

### 1. 主题切换

支持夜间 / 日间模式切换，用户可以根据自己的喜好在 localStorage 中设置 `darkMode` 为 `true` 或 `false` 来切换主题。夜间模式采用了现代、简洁且稍亮的深色主题，提升了用户在低光环境下的视觉体验。

### 2. 搜索功能

- 提供多种搜索引擎供用户选择，用户可以在不同的搜索引擎之间切换。
- 支持在新窗口中打开搜索结果，用户可以通过勾选 “在新窗口中打开” 复选框来设置。
- 搜索框会根据当前选中的搜索引擎显示相应的占位提示文字。

### 3. 背景设置

用户可以通过点击设置按钮打开背景设置面板，自定义页面的背景图片和透明度。支持使用 Bing 每日壁纸作为背景，也可以输入自定义的图片 URL。设置会保存到 localStorage 中，下次打开页面时会自动应用。

### 4. URL 检查

项目中包含了 url-checker.js 文件，用于检查单个 URL 的可用性、响应时间、重定向情况和安全性。检查结果会记录下来，方便用户了解链接的状态。

## 使用方法

### 1. 克隆项目

```bash
git clone <项目仓库地址>
```

### 2. 打开项目

将项目文件夹中的 index.html 文件在浏览器中打开，即可看到导航页面。

### 3. 搜索功能使用

- 在搜索框中输入关键词，选择合适的搜索引擎，点击搜索按钮即可进行搜索。
- 若要切换搜索引擎，点击相应的搜索引擎选项，搜索框的占位提示文字和表单的 action 属性会自动更新。
- 若要在新窗口中打开搜索结果，勾选 “在新窗口中打开” 复选框。

### 4. 背景设置使用

点击页面上的设置按钮，打开背景设置面板。在面板中可以输入自定义的图片 URL，调整背景透明度，点击 “应用” 按钮即可应用设置。若要恢复默认设置，点击 “重置” 按钮。

### 5. 主题切换

在 localStorage 中设置 `darkMode` 为 `true` 或 `false`，刷新页面即可切换主题。

## 贡献指南

如果你想为这个项目做出贡献，可以按照以下步骤进行：

1. Fork 这个项目到你的 GitHub 账户。
2. 创建一个新的分支：`git checkout -b your-feature-branch`。
3. 进行代码修改和功能添加。
4. 提交你的更改：`git commit -m "Add your commit message"`。
5. 推送分支到你的 GitHub 仓库：`git push origin your-feature-branch`。
6. 在原项目仓库中创建一个 Pull Request。

## 注意事项

- 部分网站可能需要科学上网才能访问，请确保你有合法的网络访问权限。
- 项目中的一些功能可能依赖于特定的浏览器特性，请使用现代浏览器（如 Chrome、Firefox 等）打开页面。

## 许可证

本项目采用 [MIT 许可证](https://opensource.org/licenses/MIT)，你可以自由使用、修改和分发该项目。