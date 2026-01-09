/**
 * WebNav 应用主文件
 * 整合了搜索、背景设置、主题切换、内容加载等所有功能
 * @version 2.0
 */

// ==================== 工具函数模块 ====================
const Utils = {
    // DOM 快速选择器
    $: (id) => document.getElementById(id),
    $$: (selector) => document.querySelectorAll(selector),

    // LocalStorage 操作
    storage: {
        get: (key, defaultValue = null) => {
            const value = localStorage.getItem(key);
            try {
                return value ? JSON.parse(value) : defaultValue;
            } catch {
                return value || defaultValue;
            }
        },
        set: (key, value) => {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        },
        remove: (key) => localStorage.removeItem(key)
    },

    // Toast 提示单例
    toast: (() => {
        let instance = null;
        return {
            show: (msg, type = 'success') => {
                if (instance) iziToast.hide({}, instance);
                instance = iziToast[type]({
                    title: msg,
                    position: 'topRight',
                    timeout: 1200
                });
            }
        };
    })(),

    // 懒加载初始化
    initLazyLoad: () => {
        if (typeof lozad !== 'undefined') {
            lozad('.lozad', { rootMargin: '100px 0px', threshold: 0.01 }).observe();
        }
    },

    // 防抖函数
    debounce: (fn, delay = 300) => {
        let timer = null;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    // 节流函数
    throttle: (fn, delay = 200) => {
        let last = 0;
        return function(...args) {
            const now = Date.now();
            if (now - last > delay) {
                fn.apply(this, args);
                last = now;
            }
        };
    }
};

// ==================== 主题模块 ====================
const ThemeModule = {
    STORAGE_KEY: 'theme-preference',
    mediaQuery: null,

    init() {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const systemHandler = this._handleSystemChange.bind(this);
        if (this.mediaQuery.addEventListener) {
            this.mediaQuery.addEventListener('change', systemHandler);
        } else {
            this.mediaQuery.addListener(systemHandler);
        }

        const stored = this._getStoredTheme();
        const initialTheme = stored ?? (this.mediaQuery.matches ? 'dark' : 'light');
        this.applyTheme(initialTheme, false);

        requestAnimationFrame(() => document.body.classList.add('theme-ready'));
    },

    _getStoredTheme() {
        let value = Utils.storage.get(this.STORAGE_KEY);
        if (value === null || typeof value === 'undefined') {
            const legacy = Utils.storage.get('darkMode');
            if (legacy !== null && typeof legacy !== 'undefined') {
                value = legacy === 'true' ? 'dark' : 'light';
            }
        }
        if (value === 'dark' || value === 'light') return value;
        if (value === 'true') return 'dark';
        if (value === 'false') return 'light';
        return null;
    },

    applyTheme(theme, persist = true) {
        document.body.setAttribute('data-theme', theme);
        if (persist) {
            Utils.storage.set(this.STORAGE_KEY, theme);
            Utils.storage.remove('darkMode');
        }
    },

    toggle() {
        const nextTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        this.applyTheme(nextTheme);
        Utils.toast.show(nextTheme === 'dark' ? '已切换为夜间模式' : '已切换为日间模式');
    },

    _handleSystemChange(event) {
        if (this._getStoredTheme()) return;
        this.applyTheme(event.matches ? 'dark' : 'light', false);
    }
};

// 暴露全局切换函数供 HTML onclick 调用
window.switchNightMode = () => ThemeModule.toggle();

// ==================== 搜索模块 ====================
const SearchModule = {
    elements: null,
    STORAGE_PREFIX: 'search_',

    init() {
        this.elements = {
            form: Utils.$('super-search-fm'),
            input: Utils.$('search-text'),
            typeRadios: Utils.$$('input[name="type"]'),
            newWindowCheckbox: Utils.$('set-search-blank'),
            groups: Utils.$$('.search-group')
        };

        if (!this.elements.form) return;

        this._setupDefaultType();
        this._setupNewWindowPreference();
        this._bindEvents();
    },

    // 获取当前选中的搜索引擎
    _getCheckedRadio() {
        return document.querySelector('input[name="type"]:checked');
    },

    // 设置默认搜索类型
    _setupDefaultType() {
        const defaultType = Utils.storage.get(`${this.STORAGE_PREFIX}type`) ||
                          (this.elements.typeRadios[0]?.value || '');
        const defaultRadio = document.querySelector(`input[name="type"][value="${defaultType}"]`);

        if (defaultRadio) {
            defaultRadio.checked = true;
            this._highlightGroup(defaultRadio);
        }

        this._updateUI();
    },

    // 设置"在新窗口中打开"偏好
    _setupNewWindowPreference() {
        const openInNew = Utils.storage.get(`${this.STORAGE_PREFIX}new_window`, '1') === '1';
        this.elements.newWindowCheckbox.checked = openInNew;
        this._updateTarget(openInNew);
    },

    // 更新 UI
    _updateUI() {
        const radio = this._getCheckedRadio();
        if (!radio) return;

        const placeholder = radio.getAttribute('data-placeholder') || '输入关键字搜索';
        const actionUrl = radio.value;

        this.elements.input.placeholder = placeholder;
        if (actionUrl && actionUrl !== 'site-search') {
            this.elements.form.action = actionUrl;
        }
    },

    // 更新表单 target
    _updateTarget(openInNew) {
        if (openInNew) {
            this.elements.form.target = '_blank';
        } else {
            this.elements.form.removeAttribute('target');
        }
    },

    // 高亮当前分组
    _highlightGroup(radioElement) {
        this.elements.groups.forEach(g => g.classList.remove('s-current'));
        radioElement?.closest('.search-group')?.classList.add('s-current');
    },

    // 绑定事件
    _bindEvents() {
        // 切换搜索引擎
        this.elements.typeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this._updateUI();
                this._highlightGroup(e.target);
                Utils.storage.set(`${this.STORAGE_PREFIX}type`, e.target.value);
                this.elements.input.focus();
            });
        });

        // 切换新窗口打开
        this.elements.newWindowCheckbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            Utils.storage.set(`${this.STORAGE_PREFIX}new_window`, isChecked ? '1' : '0');
            this._updateTarget(isChecked);
        });

        // 表单提交
        this.elements.form.addEventListener('submit', (e) => {
            // 阻止表单默认提交行为
            e.preventDefault();

            const keyword = this.elements.input.value.trim();
            const actionUrl = this._getCheckedRadio()?.value;

            // 站内搜索：不跳转，搜索逻辑由 ContentModule 的 input 事件处理
            if (actionUrl === 'site-search') {
                return;
            }

            // 外部搜索：跳转到搜索引擎
            if (!keyword) {
                this.elements.input.focus();
                return;
            }

            const url = actionUrl + encodeURIComponent(keyword);
            const openInNew = this.elements.newWindowCheckbox.checked;
            openInNew ? window.open(url, '_blank') : window.location.href = url;
        });
    }
};

// ==================== 背景设置模块 ====================
const BackgroundModule = {
    STORAGE_KEY: 'backgroundSettings',
    BING_API_URL: 'https://bing.img.run/rand.php',
    elements: null,

    init() {
        this.elements = {
            panel: Utils.$('settings-panel'),
            overlay: Utils.$('settings-overlay'),
            urlInput: Utils.$('bg-image-url'),
            opacitySlider: Utils.$('bg-opacity-slider'),
            opacityVal: Utils.$('bg-opacity-value'),
            applyBtn: Utils.$('apply-bg-btn'),
            resetBtn: Utils.$('reset-bg-btn'),
            body: document.body
        };

        if (!this.elements.panel) return;

        this._applySettings();
        this._bindEvents();
    },

    // 获取设置
    _getSettings() {
        return Utils.storage.get(this.STORAGE_KEY, { url: '', opacity: 0.9 });
    },

    // 应用设置
    _applySettings() {
        const { url, opacity } = this._getSettings();

        // 背景图
        if (url) {
            const finalUrl = (url === 'bing_daily') ? this.BING_API_URL : url;
            this.elements.body.style.backgroundImage = `url('${finalUrl}')`;
            this.elements.body.classList.add('with-custom-bg');
        } else {
            this.elements.body.style.backgroundImage = '';
            this.elements.body.classList.remove('with-custom-bg');
        }

        // 透明度
        this.elements.body.style.setProperty('--content-opacity', opacity);
        if (this.elements.opacitySlider) this.elements.opacitySlider.value = opacity;
        if (this.elements.opacityVal) this.elements.opacityVal.textContent = `${Math.round(opacity * 100)}%`;
        if (this.elements.urlInput) {
            this.elements.urlInput.value = (url && url !== 'bing_daily') ? url : '';
        }
    },

    // 保存设置
    _saveSettings(patch) {
        const newSettings = { ...this._getSettings(), ...patch };
        Utils.storage.set(this.STORAGE_KEY, newSettings);
        this._applySettings();
    },

    // 切换面板显示
    _togglePanel(show) {
        const method = show ? 'add' : 'remove';
        this.elements.panel.classList[method]('is-visible');
        this.elements.overlay.classList[method]('is-visible');
    },

    // 绑定事件
    _bindEvents() {
        // 关闭面板（由 SettingsPanelModule 统一处理）
        this.elements.overlay?.addEventListener('click', () => this._togglePanel(false));

        // 透明度实时预览
        this.elements.opacitySlider?.addEventListener('input', (e) => {
            const val = e.target.value;
            this.elements.body.style.setProperty('--content-opacity', val);
            this.elements.opacityVal.textContent = `${Math.round(val * 100)}%`;
        });

        // 透明度松手保存
        this.elements.opacitySlider?.addEventListener('change', (e) => {
            this._saveSettings({ opacity: parseFloat(e.target.value) });
        });

        // 应用背景
        this.elements.applyBtn?.addEventListener('click', () => {
            this._saveSettings({
                url: this.elements.urlInput.value.trim() || 'bing_daily',
                opacity: parseFloat(this.elements.opacitySlider.value)
            });
            this._togglePanel(false);
        });

        // 重置
        this.elements.resetBtn?.addEventListener('click', () => {
            Utils.storage.remove(this.STORAGE_KEY);
            window.location.reload();
        });
    }
};

// ==================== 设置面板模块（统一管理） ====================
const SettingsPanelModule = {
    init() {
        const settingsBtn = Utils.$('settings-btn');
        const mobileSettingsBtn = Utils.$('mobile-settings-btn');
        const closeBtn = Utils.$('close-settings-btn');
        const panel = Utils.$('settings-panel');
        const overlay = Utils.$('settings-overlay');

        if (!panel) return;

        const togglePanel = (show) => {
            const method = show ? 'add' : 'remove';
            panel.classList[method]('is-visible');
            overlay.classList[method]('is-visible');
        };

        // 打开设置面板
        settingsBtn?.addEventListener('click', () => togglePanel(true));
        mobileSettingsBtn?.addEventListener('click', () => togglePanel(true));

        // 关闭设置面板
        closeBtn?.addEventListener('click', () => togglePanel(false));
        overlay?.addEventListener('click', () => togglePanel(false));
    }
};

// ==================== 内容加载模块 ====================
const ContentModule = {
    linksContainer: null,
    originalHTML: '',
    itemsCache: [],

    init() {
        this.linksContainer = Utils.$('links-container');
        if (!this.linksContainer) return;

        this._loadData();
    },

    // 加载数据
    async _loadData() {
        try {
            const response = await fetch('./data.json');
            const data = await response.json();
            this._renderLinks(data);
            this.originalHTML = this.linksContainer.innerHTML;
            this._cacheItems();
            this._setupSiteSearch();
        } catch (error) {
            console.error('数据加载失败:', error);
        }
    },

    // 缓存所有链接卡片信息
    _cacheItems() {
        this.itemsCache = Array.from(this.linksContainer.querySelectorAll('.xe-widget')).map(el => ({
            html: el.outerHTML,
            name: el.querySelector('.xe-user-name strong')?.textContent.toLowerCase() || '',
            desc: el.querySelector('.xe-comment p')?.textContent.toLowerCase() || ''
        }));
    },

    // 渲染链接
    _renderLinks(data) {
        Object.entries(data.links).forEach(([category, items]) => {
            const section = document.createElement('div');
            section.innerHTML = `
                <h4 class="text-gray">
                    <i class="fa-solid fa-tags" style="margin-right: 7px; color: rgb(194, 195, 199);" id="${category.replace(' ', '')}"></i>
                    <span class="category-color">${category}</span>
                </h4>
                <div class="row" id="${category}-links"></div>
                <br/>`;
            this.linksContainer.appendChild(section);

            const row = Utils.$(`${category}-links`);
            items.forEach(item => {
                const col = document.createElement('div');
                col.className = 'col-sm-3';
                col.innerHTML = `
                    <div class="xe-widget xe-conversations box2 label-info"
                        data-url="${item.url}"
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
        });

        // 使用事件委托处理卡片点击
        this.linksContainer.addEventListener('click', this._handleCardClick.bind(this));

        Utils.initLazyLoad();
    },

    // 卡片点击处理
    _handleCardClick(e) {
        const card = e.target.closest('.xe-widget');
        if (card) {
            const url = card.getAttribute('data-url');
            if (url) window.open(url, '_blank');
        }
    },

    // 站内搜索
    _setupSiteSearch() {
        const searchInput = Utils.$('search-text');
        if (!searchInput) return;

        // 防抖搜索
        const debouncedSearch = Utils.debounce(() => {
            const keyword = searchInput.value.trim().toLowerCase();
            const type = document.querySelector('input[name="type"]:checked')?.value;

            if (type !== 'site-search') return;

            if (!keyword) {
                this.linksContainer.innerHTML = this.originalHTML;
            } else {
                this._filterContent(keyword);
            }
            Utils.initLazyLoad();
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);

        // 切换搜索类型时重置
        Utils.$$('input[name="type"]').forEach(input => {
            input.addEventListener('change', () => {
                if (document.querySelector('input[name="type"]:checked')?.value !== 'site-search') {
                    searchInput.value = '';
                    this.linksContainer.innerHTML = this.originalHTML;
                    Utils.initLazyLoad();
                }
            });
        });
    },

    // 过滤内容 - 使用缓存而不是DOMParser
    _filterContent(keyword) {
        const matched = this.itemsCache.filter(item =>
            item.name.includes(keyword) || item.desc.includes(keyword)
        );

        const fragment = document.createDocumentFragment();
        const row = document.createElement('div');
        row.className = 'row';

        matched.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col-sm-3';
            col.innerHTML = item.html;
            row.appendChild(col);
        });

        fragment.appendChild(row);
        this.linksContainer.innerHTML = '';
        this.linksContainer.appendChild(fragment);

        // 为新卡片添加点击事件委托
        this.linksContainer.addEventListener('click', this._handleCardClick.bind(this));
    }
};

// ==================== 返回顶部模块 ====================
const BackToTopModule = {
    init() {
        const btn = Utils.$('back-to-top');
        if (!btn) return;

        // 节流滚动事件
        const throttledScroll = Utils.throttle(() => {
            btn.style.display = window.scrollY > 300 ? 'flex' : 'none';
        }, 200);
        window.addEventListener('scroll', throttledScroll);

        // 点击返回顶部
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
};

// ==================== 应用初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 按依赖顺序初始化各模块
    ThemeModule.init();
    SettingsPanelModule.init();
    BackgroundModule.init();
    SearchModule.init();
    ContentModule.init();
    BackToTopModule.init();

    // 延迟加载非关键脚本（今日诗词）
    if (document.getElementById('jinrishici-sentence')) {
        setTimeout(() => {
            const script = document.createElement('script');
            script.src = 'https://sdk.jinrishici.com/v2/browser/jinrishici.js';
            script.async = true;
            document.head.appendChild(script);
        }, 2000);
    }
});
