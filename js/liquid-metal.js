/**
 * 液态金属按钮效果初始化
 * 应用到侧边栏切换按钮和回到顶部按钮
 */

(function() {
    'use strict';

    /**
     * 应用液态金属效果到按钮
     * @param {HTMLElement} button - 按钮元素
     * @param {boolean} enableSparkles - 是否启用火花效果
     */
    function applyLiquidMetalEffect(button, enableSparkles = true) {
        if (!button) return;

        // 添加液态金属样式类
        button.classList.add('liquid-metal-btn', 'liquid-metal');

        // 包装原有图标
        const icon = button.querySelector('i, svg, span:not(.sparkle)');
        if (icon && !icon.classList.contains('icon')) {
            icon.classList.add('icon');
        }

        // 添加火花效果（可选）
        if (enableSparkles) {
            addSparkles(button);
        }
    }

    /**
     * 添加火花装饰元素
     * @param {HTMLElement} button - 按钮元素
     */
    function addSparkles(button) {
        // 创建3个火花
        for (let i = 0; i < 3; i++) {
            const sparkle = document.createElement('span');
            sparkle.className = 'sparkle';

            // 随机位置
            const angle = (360 / 3) * i;
            const radius = 20;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            sparkle.style.left = `calc(50% + ${x}px)`;
            sparkle.style.top = `calc(50% + ${y}px)`;

            button.appendChild(sparkle);
        }
    }

    /**
     * 回到顶部按钮的显示/隐藏逻辑
     */
    function handleBackToTopVisibility() {
        const backToTopBtn = document.getElementById('back-to-top');
        if (!backToTopBtn) return;

        // 使用RAF节流优化滚动性能
        let ticking = false;

        function updateVisibility() {
            const scrollY = window.scrollY || window.pageYOffset;

            if (scrollY > 300) {
                backToTopBtn.classList.add('show');
                backToTopBtn.style.display = 'flex';
            } else {
                backToTopBtn.classList.remove('show');
                // 延迟隐藏，等待动画完成
                setTimeout(() => {
                    if (!backToTopBtn.classList.contains('show')) {
                        backToTopBtn.style.display = 'none';
                    }
                }, 400);
            }

            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateVisibility);
                ticking = true;
            }
        }, { passive: true });

        // 初始检查
        updateVisibility();
    }

    /**
     * 侧边栏切换按钮状态同步
     */
    function handleSidebarToggle() {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        const sidebar = document.getElementById('custom-sidebar');

        if (!toggleBtn || !sidebar) return;

        // 监听侧边栏状态变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isExpanded = sidebar.classList.contains('expanded');
                    toggleBtn.classList.toggle('expanded', isExpanded);
                }
            });
        });

        observer.observe(sidebar, { attributes: true });
    }

    /**
     * 添加涟漪点击效果
     * @param {HTMLElement} button - 按钮元素
     */
    function addRippleEffect(button) {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';

            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%);
                transform: scale(0);
                animation: ripple-expand 0.6s ease-out;
                pointer-events: none;
                z-index: 10;
            `;

            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });

        // 添加涟漪动画
        if (!document.getElementById('ripple-animation-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-animation-style';
            style.textContent = `
                @keyframes ripple-expand {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 性能优化：检测设备能力，低端设备禁用动画
     */
    function checkPerformance() {
        const isLowEnd =
            (navigator.hardwareConcurrency || 4) < 4 ||
            (navigator.deviceMemory || 4) < 2;

        if (isLowEnd) {
            document.body.classList.add('low-performance');

            // 添加样式禁用动画
            const style = document.createElement('style');
            style.textContent = `
                .low-performance .liquid-metal-btn::after {
                    animation: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 初始化所有液态金属效果
     */
    function init() {
        // 等待DOM完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        console.log('🎨 初始化液态金属按钮效果...');

        // 检测性能
        checkPerformance();

        // 等待按钮元素加载（可能由其他脚本动态创建）
        setTimeout(() => {
            // 1. 应用到侧边栏切换按钮（禁用火花效果）
            const sidebarToggle = document.getElementById('sidebar-toggle-btn');
            if (sidebarToggle) {
                applyLiquidMetalEffect(sidebarToggle, false); // 不添加火花
                handleSidebarToggle();
                addRippleEffect(sidebarToggle);
                console.log('✓ 侧边栏按钮液态金属效果已应用（无旋转边框/火花）');
            }

            // 2. 应用到回到顶部按钮（保留完整效果）
            const backToTop = document.getElementById('back-to-top');
            if (backToTop) {
                applyLiquidMetalEffect(backToTop, true); // 添加火花
                handleBackToTopVisibility();
                addRippleEffect(backToTop);
                console.log('✓ 回到顶部按钮液态金属效果已应用');
            }

            // 如果按钮还未加载，使用MutationObserver等待
            if (!sidebarToggle || !backToTop) {
                observeButtonCreation();
            }
        }, 100);
    }

    /**
     * 监听按钮动态创建
     */
    function observeButtonCreation() {
        const observer = new MutationObserver((mutations, obs) => {
            const sidebarToggle = document.getElementById('sidebar-toggle-btn');
            const backToTop = document.getElementById('back-to-top');

            if (sidebarToggle && !sidebarToggle.classList.contains('liquid-metal')) {
                applyLiquidMetalEffect(sidebarToggle, false); // 不添加火花
                handleSidebarToggle();
                addRippleEffect(sidebarToggle);
                console.log('✓ 侧边栏按钮液态金属效果已应用（延迟）');
            }

            if (backToTop && !backToTop.classList.contains('liquid-metal')) {
                applyLiquidMetalEffect(backToTop, true); // 添加火花
                handleBackToTopVisibility();
                addRippleEffect(backToTop);
                console.log('✓ 回到顶部按钮液态金属效果已应用（延迟）');
            }

            // 两个按钮都加载完成后停止观察
            if (
                sidebarToggle?.classList.contains('liquid-metal') &&
                backToTop?.classList.contains('liquid-metal')
            ) {
                obs.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 10秒后停止观察
        setTimeout(() => observer.disconnect(), 10000);
    }

    // 执行初始化
    init();

    // 暴露到全局（调试用）
    window.LiquidMetalButtons = {
        reInit: init,
        applyTo: applyLiquidMetalEffect
    };
})();
