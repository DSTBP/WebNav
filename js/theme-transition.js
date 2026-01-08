/**
 * 现代化主题切换系统
 * 特性：
 * - 流畅的过渡动画
 * - 视觉反馈（波纹效果）
 * - 系统主题自动检测
 * - LocalStorage持久化
 * - 性能优化
 */

(function() {
    'use strict';

    // 主题管理器类
    class ThemeManager {
        constructor() {
            this.STORAGE_KEY = 'theme-preference';
            this.TRANSITION_DURATION = 600; // 毫秒
            this.currentTheme = null;
            this.isTransitioning = false;

            this.init();
        }

        /**
         * 初始化主题系统
         */
        init() {
            console.log('🎨 初始化主题系统...');

            // 1. 创建过渡遮罩元素
            this.createTransitionOverlay();

            // 2. 检测并应用初始主题（无动画）
            this.applyInitialTheme();

            // 3. 监听系统主题变化
            this.watchSystemTheme();

            // 4. 暴露全局切换函数
            window.switchNightMode = this.toggle.bind(this);

            console.log(`✓ 主题系统初始化完成 | 当前主题: ${this.currentTheme}`);
        }

        /**
         * 创建主题过渡遮罩
         */
        createTransitionOverlay() {
            const overlay = document.createElement('div');
            overlay.id = 'theme-transition-overlay';
            document.body.appendChild(overlay);
            this.overlay = overlay;
        }

        /**
         * 应用初始主题（页面加载时，无动画）
         */
        applyInitialTheme() {
            const savedTheme = this.getSavedTheme();
            const systemTheme = this.getSystemTheme();

            // 优先使用保存的主题，否则跟随系统
            this.currentTheme = savedTheme || systemTheme;

            // 立即应用主题（无动画）
            if (this.currentTheme === 'dark') {
                document.documentElement.classList.add('dark-theme');
                document.body.classList.add('dark-theme');
            } else {
                document.documentElement.classList.remove('dark-theme');
                document.body.classList.remove('dark-theme');
            }
        }

        /**
         * 获取保存的主题偏好
         */
        getSavedTheme() {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved === 'dark' || saved === 'light') {
                return saved;
            }
            // 兼容旧版本存储格式
            const oldDarkMode = localStorage.getItem('darkMode');
            if (oldDarkMode === 'true') return 'dark';
            if (oldDarkMode === 'false') return 'light';
            return null;
        }

        /**
         * 获取系统主题偏好
         */
        getSystemTheme() {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
            return 'light';
        }

        /**
         * 监听系统主题变化
         */
        watchSystemTheme() {
            if (!window.matchMedia) return;

            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

            darkModeQuery.addEventListener('change', (e) => {
                // 只有在用户没有手动设置主题时才自动切换
                const savedTheme = this.getSavedTheme();
                if (!savedTheme) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    console.log(`🌓 系统主题变化: ${newTheme}`);
                    this.applyTheme(newTheme, false); // 静默切换，无提示
                }
            });
        }

        /**
         * 切换主题（公共方法）
         * @param {Event} event - 点击事件（可选，用于获取点击位置）
         */
        toggle(event) {
            if (this.isTransitioning) {
                console.log('⚠️ 主题切换中，请稍候...');
                return;
            }

            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme, true, event);
        }

        /**
         * 应用主题
         * @param {string} theme - 'light' 或 'dark'
         * @param {boolean} withAnimation - 是否显示动画
         * @param {Event} event - 点击事件（可选）
         */
        applyTheme(theme, withAnimation = true, event = null) {
            if (this.currentTheme === theme) return;

            this.isTransitioning = true;
            this.currentTheme = theme;

            // 保存到 localStorage
            localStorage.setItem(this.STORAGE_KEY, theme);
            // 兼容旧版本
            localStorage.setItem('darkMode', theme === 'dark' ? 'true' : 'false');

            if (withAnimation && !this.shouldReduceMotion()) {
                this.transitionWithAnimation(theme, event);
            } else {
                this.transitionWithoutAnimation(theme);
            }

            // 显示提示消息
            if (withAnimation) {
                this.showToast(theme === 'dark' ? '已切换为夜间模式' : '已切换为日间模式');
            }
        }

        /**
         * 带动画的主题切换
         */
        transitionWithAnimation(theme, event) {
            const isDark = theme === 'dark';

            // 1. 获取点击位置（用于波纹效果）
            let clickX = '50%';
            let clickY = '50%';

            if (event && event.clientX && event.clientY) {
                clickX = `${event.clientX}px`;
                clickY = `${event.clientY}px`;
            }

            // 2. 设置遮罩颜色和位置
            this.overlay.style.setProperty('--click-x', clickX);
            this.overlay.style.setProperty('--click-y', clickY);
            this.overlay.style.setProperty(
                '--overlay-color',
                isDark ? 'rgba(26, 29, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)'
            );

            // 3. 显示遮罩
            this.overlay.classList.add('active');

            // 4. 延迟切换主题类（让遮罩先显示）
            setTimeout(() => {
                document.documentElement.classList.toggle('dark-theme', isDark);
                document.body.classList.toggle('dark-theme', isDark);

                // 5. 隐藏遮罩
                setTimeout(() => {
                    this.overlay.classList.remove('active');
                    this.isTransitioning = false;
                }, this.TRANSITION_DURATION / 2);

            }, this.TRANSITION_DURATION / 3);
        }

        /**
         * 无动画的主题切换（快速）
         */
        transitionWithoutAnimation(theme) {
            const isDark = theme === 'dark';
            document.documentElement.classList.toggle('dark-theme', isDark);
            document.body.classList.toggle('dark-theme', isDark);
            this.isTransitioning = false;
        }

        /**
         * 检查是否应该减弱动画
         */
        shouldReduceMotion() {
            return window.matchMedia &&
                   window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }

        /**
         * 显示主题切换提示
         */
        showToast(message) {
            // 使用 iziToast（如果可用）
            if (typeof iziToast !== 'undefined') {
                iziToast.success({
                    title: message,
                    position: 'topRight',
                    timeout: 1500,
                    transitionIn: 'fadeInDown',
                    transitionOut: 'fadeOutUp',
                    icon: this.currentTheme === 'dark' ? 'fa fa-moon' : 'fa fa-sun'
                });
                return;
            }

            // 降级：使用原生通知
            this.showNativeToast(message);
        }

        /**
         * 原生Toast实现（降级方案）
         */
        showNativeToast(message) {
            // 移除已存在的toast
            const existingToast = document.getElementById('theme-toast');
            if (existingToast) {
                existingToast.remove();
            }

            const toast = document.createElement('div');
            toast.id = 'theme-toast';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${this.currentTheme === 'dark' ? '#2d3748' : '#ffffff'};
                color: ${this.currentTheme === 'dark' ? '#e8eaed' : '#2c3e50'};
                padding: 12px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                font-size: 14px;
                font-weight: 500;
                z-index: 100000;
                animation: toast-slide-in 0.3s ease-out, toast-fade-out 0.3s ease-in 1.2s;
                pointer-events: none;
            `;

            // 添加样式动画
            if (!document.getElementById('toast-animations')) {
                const style = document.createElement('style');
                style.id = 'toast-animations';
                style.textContent = `
                    @keyframes toast-slide-in {
                        from {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    @keyframes toast-fade-out {
                        from {
                            opacity: 1;
                        }
                        to {
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, 1500);
        }

        /**
         * 获取当前主题
         */
        getTheme() {
            return this.currentTheme;
        }

        /**
         * 设置主题（不带动画）
         */
        setTheme(theme) {
            this.applyTheme(theme, false);
        }

        /**
         * 切换到日间模式
         */
        toLight(event) {
            if (this.currentTheme !== 'light') {
                this.applyTheme('light', true, event);
            }
        }

        /**
         * 切换到夜间模式
         */
        toDark(event) {
            if (this.currentTheme !== 'dark') {
                this.applyTheme('dark', true, event);
            }
        }
    }

    // 创建主题管理器实例
    const themeManager = new ThemeManager();

    // 暴露到全局
    window.ThemeManager = themeManager;

    // 兼容旧代码
    window.switchNightMode = (event) => themeManager.toggle(event);

    // 提供便捷方法
    window.setTheme = (theme) => themeManager.setTheme(theme);
    window.getTheme = () => themeManager.getTheme();

    // 调试方法
    window.debugTheme = () => {
        console.log('=== 主题系统状态 ===');
        console.log('当前主题:', themeManager.getTheme());
        console.log('保存的主题:', themeManager.getSavedTheme());
        console.log('系统主题:', themeManager.getSystemTheme());
        console.log('是否正在过渡:', themeManager.isTransitioning);
        console.log('减弱动画:', themeManager.shouldReduceMotion());
    };

    console.log('✨ 主题系统已加载');
})();
