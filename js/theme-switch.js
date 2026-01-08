/**
 * 优化的夜间模式切换
 * 使用CSS变量 + 平滑过渡 + RAF优化
 */

(function() {
    'use strict';

    // 切换夜间模式（优化版）
    window.switchNightMode = function() {
        const body = document.body;
        const isDark = body.classList.contains('dark-theme');

        // 使用RAF确保在下一帧执行，避免阻塞
        requestAnimationFrame(() => {
            if (isDark) {
                body.classList.remove('dark-theme');
                localStorage.setItem('darkMode', 'false');
                showModeToast('已切换为日间模式');
            } else {
                body.classList.add('dark-theme');
                localStorage.setItem('darkMode', 'true');
                showModeToast('已切换为夜间模式');
            }
        });
    };

    // 显示提示（防止重复创建）
    let toastInstance = null;
    window.showModeToast = function(msg) {
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
    };

    // 页面加载时初始化（提前执行，避免闪烁）
    (function initTheme() {
        // 在DOM加载前就设置，避免白屏闪烁
        if (localStorage.getItem('darkMode') === 'true') {
            document.documentElement.classList.add('dark-theme');
            if (document.body) {
                document.body.classList.add('dark-theme');
            }
        }
    })();
})();
