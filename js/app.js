/**
 * WebNav 主应用脚本
 * 处理主题切换、设置面板、动态内容加载和站内搜索
 */

(function() {
    'use strict';

    /**
     * 切换夜间/日间模式
     */
    window.switchNightMode = function() {
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
    };

    /**
     * 显示模式切换提示
     * @param {string} msg - 要显示的消息
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
     * 初始化设置面板
     */
    function initSettingsPanel() {
        const settingsBtn = document.getElementById('settings-btn');
        const mobileSettingsBtn = document.getElementById('mobile-settings-btn');
        const closeSettingsBtn = document.getElementById('close-settings-btn');
        const settingsPanel = document.getElementById('settings-panel');
        const settingsOverlay = document.getElementById('settings-overlay');

        function openSettings() {
            if (settingsPanel && settingsOverlay) {
                settingsPanel.classList.add('is-visible');
                settingsOverlay.classList.add('is-visible');
            }
        }

        function closeSettings() {
            if (settingsPanel && settingsOverlay) {
                settingsPanel.classList.remove('is-visible');
                settingsOverlay.classList.remove('is-visible');
            }
        }

        // 桌面端设置按钮
        if (settingsBtn) {
            settingsBtn.addEventListener('click', openSettings);
        }

        // 手机端设置按钮
        if (mobileSettingsBtn) {
            mobileSettingsBtn.addEventListener('click', openSettings);
        }

        // 关闭按钮
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', closeSettings);
        }

        // 点击遮罩层关闭
        if (settingsOverlay) {
            settingsOverlay.addEventListener('click', closeSettings);
        }
    }

    /**
     * 使用防抖优化搜索性能
     */
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    /**
     * 站内搜索功能
     */
    function initSiteSearch(originalLinksHTML, linksContainer, searchInput) {
        const debouncedSearch = debounce(function() {
            const keyword = this.value.trim().toLowerCase();
            const type = document.querySelector('input[name="type"]:checked');

            if (!type || type.value !== 'site-search') return;

            if (!keyword) {
                linksContainer.innerHTML = originalLinksHTML;
            } else {
                const parser = new DOMParser();
                const doc = parser.parseFromString(originalLinksHTML, 'text/html');
                const widgets = Array.from(doc.querySelectorAll('.xe-widget'));
                const matched = widgets.filter(item => {
                    const name = item.querySelector('.xe-user-name strong')?.textContent.toLowerCase() || '';
                    const desc = item.querySelector('.xe-comment p')?.textContent.toLowerCase() || '';
                    return name.includes(keyword) || desc.includes(keyword);
                });

                linksContainer.innerHTML = '';
                const row = document.createElement('div');
                row.className = 'row';
                matched.forEach(item => {
                    const col = document.createElement('div');
                    col.className = 'col-sm-3';
                    col.innerHTML = item.outerHTML;
                    row.appendChild(col);
                });
                linksContainer.appendChild(row);
            }

            // 重新初始化懒加载
            if (typeof lozad !== 'undefined') {
                lozad('.lozad', { rootMargin: '200px 0px', threshold: 0.1 }).observe();
            }
        }, 250);

        searchInput.addEventListener('input', debouncedSearch);
    }

    /**
     * 搜索类型切换处理
     */
    function initSearchTypeSwitch(originalLinksHTML, linksContainer, searchInput) {
        document.querySelectorAll('input[name="type"]').forEach(input => {
            input.addEventListener('change', function() {
                const selectedType = document.querySelector('input[name="type"]:checked');
                if (selectedType && selectedType.value !== 'site-search') {
                    searchInput.value = '';
                    linksContainer.innerHTML = originalLinksHTML;
                    if (typeof lozad !== 'undefined') {
                        lozad('.lozad', { rootMargin: '200px 0px', threshold: 0.1 }).observe();
                    }
                }
            });
        });
    }

    /**
     * 加载并渲染动态内容
     */
    function loadDynamicContent() {
        const linksContainer = document.getElementById('links-container');
        const searchInput = document.getElementById('search-text');

        if (!linksContainer || !searchInput) {
            console.error('Required elements not found');
            return;
        }

        fetch('./data.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (!data.links) {
                    throw new Error('Invalid data format');
                }

                // 动态生成链接内容区
                Object.entries(data.links).forEach(([category, items]) => {
                    const section = document.createElement('div');
                    section.innerHTML = `
                        <h4 class="text-gray">
                            <i class="fa-solid fa-tags" style="margin-right: 7px; color: rgb(194, 195, 199);" id="${category.replace(/\s+/g, '')}"></i><span class="category-color">${category}</span>
                        </h4>
                        <div class="row" id="${category}-links"></div>
                        <br/>`;
                    linksContainer.appendChild(section);

                    const row = document.getElementById(`${category}-links`);
                    if (row) {
                        items.forEach(item => {
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
                                                src="./images/loading.svg"
                                                alt="${item.name}" />
                                        </a>
                                        <div class="xe-comment">
                                            <a href="#" class="xe-user-name overflowClip_1">
                                                <strong>${item.name}</strong>
                                            </a>
                                            <p class="overflowClip_2">${item.desc}</p>
                                        </div>
                                    </div>
                                </div>`;
                            row.appendChild(col);
                        });
                    }
                });

                // 初始化图片懒加载
                if (typeof lozad !== 'undefined') {
                    lozad('.lozad', { rootMargin: '200px 0px', threshold: 0.1 }).observe();
                }

                // 保存原始HTML，便于站内搜索后恢复
                const originalLinksHTML = linksContainer.innerHTML;

                // 初始化站内搜索
                initSiteSearch(originalLinksHTML, linksContainer, searchInput);

                // 初始化搜索类型切换
                initSearchTypeSwitch(originalLinksHTML, linksContainer, searchInput);
            })
            .catch(error => {
                console.error('数据加载失败:', error);
                if (linksContainer) {
                    linksContainer.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">数据加载失败，请刷新页面重试</div>';
                }
            });
    }

    /**
     * 页面初始化
     */
    function init() {
        // 初始化设置面板
        initSettingsPanel();

        // 加载动态内容
        loadDynamicContent();
    }

    // DOMContentLoaded 时执行初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
