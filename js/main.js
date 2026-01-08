/**
 * 主应用逻辑 - 优化版
 * 使用懒加载、分批渲染、防抖节流等技术提升性能
 */

import { debounce, rafThrottle, batchRender, detectPerformance } from './utils.js';

// 全局数据缓存
let cachedData = null;
let originalLinksData = [];
let performanceLevel = 'medium';

/**
 * 切换夜间/日间模式
 */
function switchNightMode() {
    const body = document.body;
    const isDark = body.classList.contains('dark-theme');
    if (isDark) {
        body.classList.remove('dark-theme');
        localStorage.setItem('darkMode', 'false');
        showModeToast('已切换为日间模式');
    } else {
        body.classList.add('dark-theme');
        localStorage.setItem('darkMode', 'true');
        showModeToast('已切换为夜间模式');
    }
}

/**
 * 显示模式切换提示
 */
let toastInstance = null;
function showModeToast(msg) {
    if (toastInstance && typeof iziToast !== 'undefined') {
        iziToast.hide({}, toastInstance);
    }
    if (typeof iziToast !== 'undefined') {
        toastInstance = iziToast.success({
            title: msg,
            position: 'topRight',
            timeout: 1200
        });
    }
}

/**
 * 创建单个链接卡片元素
 */
function createLinkCard(item, category) {
    const col = document.createElement('div');
    col.className = 'col-sm-3';
    col.innerHTML = `
        <div class="xe-widget xe-conversations box2 label-info"
            onclick="window.open('${item.url}', '_blank')"
            data-toggle="tooltip"
            data-placement="bottom"
            title="${item.url}">
            <div class="xe-comment-entry">
                <a class="xe-user-img">
                    <img data-src="./images/logos/${item.img}"
                        class="lozad img-circle"
                        width="40"
                        height="40"
                        src="./images/loading.svg"
                        alt="${item.name}"
                        loading="lazy" />
                </a>
                <div class="xe-comment">
                    <a href="#" class="xe-user-name overflowClip_1">
                        <strong>${item.name}</strong>
                    </a>
                    <p class="overflowClip_2">${item.desc}</p>
                </div>
            </div>
        </div>`;
    return col;
}

/**
 * 渲染链接内容（优化版 - 分批渲染）
 */
function renderLinks(data) {
    const linksContainer = document.getElementById('links-container');
    const categories = Object.entries(data.links);

    // 根据性能等级调整批处理大小
    const batchSizes = {
        high: 30,
        medium: 20,
        low: 10
    };
    const batchSize = batchSizes[performanceLevel] || 20;

    // 先渲染所有分类标题
    categories.forEach(([category]) => {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.setAttribute('data-category', category);
        section.innerHTML = `
            <h4 class="text-gray">
                <i class="fa-solid fa-tags" style="margin-right: 7px; color: rgb(194, 195, 199);" id="${category.replace(' ', '')}"></i>
                <span class="category-color">${category}</span>
            </h4>
            <div class="row" id="${category}-links"></div>
            <br/>`;
        linksContainer.appendChild(section);
    });

    // 分批渲染所有链接
    let allItems = [];
    categories.forEach(([category, items]) => {
        items.forEach(item => {
            allItems.push({ category, item });
        });
    });

    // 保存原始数据用于搜索
    originalLinksData = allItems;

    // 使用分批渲染
    batchRender(
        allItems,
        (data) => {
            const { category, item } = data;
            const card = createLinkCard(item, category);
            const row = document.getElementById(`${category}-links`);
            if (row) {
                row.appendChild(card);
            }
            return null; // 返回null因为我们直接appendChild了
        },
        linksContainer,
        batchSize,
        () => {
            // 渲染完成后初始化懒加载
            initLazyLoading();
            console.log(`✅ 分批渲染完成，共 ${allItems.length} 个链接`);
        }
    );
}

/**
 * 初始化图片懒加载（优化版）
 */
function initLazyLoading() {
    if (typeof lozad !== 'undefined') {
        // 根据性能等级调整懒加载参数
        const rootMargins = {
            high: '400px 0px',
            medium: '200px 0px',
            low: '100px 0px'
        };

        const observer = lozad('.lozad', {
            rootMargin: rootMargins[performanceLevel] || '200px 0px',
            threshold: 0.01,
            enableAutoReload: true
        });
        observer.observe();
    }
}

/**
 * 站内搜索（优化版 - 使用原始数据而非DOM解析）
 */
const performSearch = debounce(function(keyword) {
    const linksContainer = document.getElementById('links-container');

    if (!keyword) {
        // 恢复原始布局
        restoreOriginalLayout();
        return;
    }

    const lowerKeyword = keyword.toLowerCase();

    // 直接从数据搜索，避免DOM解析
    const matched = originalLinksData.filter(({ item }) => {
        const name = item.name.toLowerCase();
        const desc = item.desc.toLowerCase();
        return name.includes(lowerKeyword) || desc.includes(lowerKeyword);
    });

    // 清空容器并显示搜索结果
    linksContainer.innerHTML = `
        <h4 class="text-gray">
            <i class="fa-solid fa-search" style="margin-right: 7px; color: rgb(194, 195, 199);"></i>
            <span class="category-color">搜索结果 (${matched.length})</span>
        </h4>
        <div class="row" id="search-results"></div>
        <br/>`;

    const row = document.getElementById('search-results');

    // 使用文档片段批量插入
    const fragment = document.createDocumentFragment();
    matched.forEach(({ item, category }) => {
        const card = createLinkCard(item, category);
        fragment.appendChild(card);
    });
    row.appendChild(fragment);

    // 重新初始化懒加载
    initLazyLoading();
}, 300);

/**
 * 恢复原始布局
 */
function restoreOriginalLayout() {
    if (!cachedData) return;

    const linksContainer = document.getElementById('links-container');
    linksContainer.innerHTML = '';
    renderLinks(cachedData);
}

/**
 * 初始化设置面板
 */
function initSettingsPanel() {
    const settingsBtn = document.getElementById('settings-btn');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsOverlay = document.getElementById('settings-overlay');

    if (!settingsBtn || !settingsPanel) return;

    const showPanel = () => {
        settingsPanel.classList.add('is-visible');
        settingsOverlay.classList.add('is-visible');
    };

    const hidePanel = () => {
        settingsPanel.classList.remove('is-visible');
        settingsOverlay.classList.remove('is-visible');
    };

    settingsBtn.addEventListener('click', showPanel);
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', hidePanel);
    if (settingsOverlay) settingsOverlay.addEventListener('click', hidePanel);
}

/**
 * 初始化返回顶部按钮（使用RAF节流）
 */
function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    // 使用RAF节流优化滚动性能
    const handleScroll = rafThrottle(() => {
        if (window.scrollY > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });

    window.addEventListener('scroll', handleScroll, { passive: true });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/**
 * 初始化站内搜索
 */
function initSiteSearch() {
    const searchInput = document.getElementById('search-text');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const keyword = this.value.trim();
        const type = document.querySelector('input[name="type"]:checked')?.value;

        if (type !== 'site-search') return;

        performSearch(keyword);
    });

    // 切换搜索类型时恢复布局
    document.querySelectorAll('input[name="type"]').forEach(input => {
        input.addEventListener('change', function() {
            const currentType = document.querySelector('input[name="type"]:checked')?.value;
            if (currentType !== 'site-search') {
                searchInput.value = '';
                restoreOriginalLayout();
            }
        });
    });
}

/**
 * 加载数据（带缓存和错误处理）
 */
async function loadData() {
    try {
        const response = await fetch('./data.json');
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        cachedData = await response.json();
        return cachedData;
    } catch (error) {
        console.error('数据加载失败:', error);

        // 显示友好的错误提示
        const linksContainer = document.getElementById('links-container');
        if (linksContainer) {
            linksContainer.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #999;">
                    <i class="fa-solid fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <h3>数据加载失败</h3>
                    <p>请检查网络连接或刷新页面重试</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 30px; border: none; background: #667eea; color: white; border-radius: 5px; cursor: pointer;">
                        重新加载
                    </button>
                </div>`;
        }

        return null;
    }
}

/**
 * 页面初始化
 */
async function init() {
    // 1. 检测性能等级
    performanceLevel = detectPerformance();
    console.log(`📊 设备性能等级: ${performanceLevel}`);

    // 2. 初始化主题
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-theme');
    }

    // 3. 初始化设置面板
    initSettingsPanel();

    // 4. 初始化返回顶部
    initBackToTop();

    // 5. 加载并渲染数据
    console.time('数据加载与渲染');
    const data = await loadData();
    if (data) {
        renderLinks(data);

        // 6. 初始化站内搜索
        initSiteSearch();
    }
    console.timeEnd('数据加载与渲染');
}

// 暴露必要的函数到全局作用域
window.switchNightMode = switchNightMode;

// DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
