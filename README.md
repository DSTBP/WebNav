<div align="center">
  <h1>WebNav - A Minimal and Efficient Personal Navigation Page</h1>
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

WebNav is a lightweight, responsive personal start page template. It helps developers, students, and web enthusiasts manage, organize, and quickly access frequently used tools and websites. With a simple configuration, you can have a customized browser homepage of your own.

## Features

- Responsive design based on Bootstrap, works well on desktop, tablet, and mobile.
- Dark mode with one-click theme switch for eye comfort.
- Category management with a sidebar to jump between sections.
- Built-in URL checker (`url-checker.html`) to verify link availability.
- Minimal static architecture with fast loading and no backend; can be deployed to GitHub Pages or Vercel.
- Highly customizable: all navigation data is maintained in local JS files for easy editing.

## Preview

![homepage](images/homepage.png)

- Home: shows all category cards.
- Sidebar: quick navigation to categories.
- Tools: URL checker demo.

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/DSTBP/WebNav.git
cd WebNav
```

### 2. Run locally

This project is purely static. Open `index.html` in your browser to see the result.

### 3. Deploy

Push the repo to GitHub and enable GitHub Pages in the repository settings. Then visit:

```
https://<your-username>.github.io/WebNav
```

## Customize Navigation Content

You do not need to change the HTML structure. All navigation data is stored in:

```
asserts/js/data.js
```

Edit the file using the following structure:

```js
const navData = [
  {
    category: "Common Tools",
    links: [
      { name: "GitHub", url: "https://github.com", icon: "github" },
      { name: "Google", url: "https://google.com", icon: "google" }
    ]
  }
];
```

## Community and Contributions

Contributions are welcome. If you have ideas or suggestions, you can:

- Submit an issue for bugs or feature requests: https://github.com/DSTBP/WebNav/issues
- Open a PR for style improvements or new features.
- Join the GitHub Discussions or comment on issues to share feedback.

Before contributing, keep your code style consistent with the project and run basic local checks.

## Project Structure

```
WebNav/
  asserts/
    css/          # Stylesheets (app, Bootstrap, FontAwesome)
    js/           # Core logic and data (app.js, data.js)
  images/         # Icons and static assets
  index.html      # Main page
  url-checker.html# URL checker tool page
  LICENSE         # License
  README.md       # Documentation
```

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

WebNav - Bringing web navigation back to simplicity.

If this project helps you, please consider giving it a Star.
