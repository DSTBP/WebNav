/**
 * 性能优化工具函数
 * 提供防抖、节流、分批渲染等工具
 */

/**
 * 防抖函数 - 延迟执行，适用于搜索输入
 * @param {Function} func - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * 节流函数 - 限制执行频率，适用于滚动事件
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 时间间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 100) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * requestAnimationFrame节流（最优化的滚动处理）
 * @param {Function} func - 要执行的函数
 * @returns {Function} RAF节流后的函数
 */
export function rafThrottle(func) {
    let rafId = null;
    return function (...args) {
        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                func.apply(this, args);
                rafId = null;
            });
        }
    };
}

/**
 * 分批渲染 - 避免一次性DOM操作导致卡顿
 * @param {Array} items - 要渲染的项目数组
 * @param {Function} renderItem - 渲染单个项目的函数
 * @param {HTMLElement} container - 容器元素
 * @param {number} batchSize - 每批渲染数量
 * @param {Function} onComplete - 完成回调
 */
export function batchRender(items, renderItem, container, batchSize = 20, onComplete = null) {
    let index = 0;
    const fragment = document.createDocumentFragment();

    function renderBatch() {
        const end = Math.min(index + batchSize, items.length);

        // 渲染一批项目到文档片段
        for (let i = index; i < end; i++) {
            const element = renderItem(items[i], i);
            if (element) fragment.appendChild(element);
        }

        // 一次性插入到DOM
        container.appendChild(fragment);

        index = end;

        // 如果还有剩余，使用 requestIdleCallback 或 setTimeout 继续
        if (index < items.length) {
            if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(renderBatch, { timeout: 1000 });
            } else {
                setTimeout(renderBatch, 0);
            }
        } else if (onComplete) {
            onComplete();
        }
    }

    renderBatch();
}

/**
 * 使用IntersectionObserver实现更高效的懒加载
 * @param {string} selector - 要观察的元素选择器
 * @param {Function} callback - 元素可见时的回调
 * @param {Object} options - IntersectionObserver选项
 * @returns {IntersectionObserver} 观察器实例
 */
export function createLazyObserver(selector, callback, options = {}) {
    const defaultOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.01
    };

    const observerOptions = { ...defaultOptions, ...options };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                callback(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 观察所有匹配的元素
    document.querySelectorAll(selector).forEach(el => observer.observe(el));

    return observer;
}

/**
 * 预加载资源
 * @param {string} url - 资源URL
 * @param {string} type - 资源类型 (image, script, style)
 * @returns {Promise} 加载完成的Promise
 */
export function preloadResource(url, type = 'image') {
    return new Promise((resolve, reject) => {
        if (type === 'image') {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        } else if (type === 'script') {
            const script = document.createElement('script');
            script.onload = resolve;
            script.onerror = reject;
            script.src = url;
            document.head.appendChild(script);
        } else if (type === 'style') {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.onload = resolve;
            link.onerror = reject;
            link.href = url;
            document.head.appendChild(link);
        }
    });
}

/**
 * 检测设备性能等级
 * @returns {string} 性能等级 (high, medium, low)
 */
export function detectPerformance() {
    // 检测硬件并发数（CPU核心）
    const cores = navigator.hardwareConcurrency || 2;

    // 检测设备内存（如果支持）
    const memory = navigator.deviceMemory || 4;

    // 检测连接类型
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = connection?.effectiveType || '4g';

    // 综合评分
    let score = 0;
    if (cores >= 8) score += 3;
    else if (cores >= 4) score += 2;
    else score += 1;

    if (memory >= 8) score += 3;
    else if (memory >= 4) score += 2;
    else score += 1;

    if (effectiveType === '4g') score += 2;
    else if (effectiveType === '3g') score += 1;

    // 返回性能等级
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
}

/**
 * 创建虚拟滚动容器
 * @param {HTMLElement} container - 滚动容器
 * @param {Array} items - 数据数组
 * @param {Function} renderItem - 渲染函数
 * @param {number} itemHeight - 每项高度
 * @param {number} bufferSize - 缓冲区大小
 */
export class VirtualScroller {
    constructor(container, items, renderItem, itemHeight = 100, bufferSize = 5) {
        this.container = container;
        this.items = items;
        this.renderItem = renderItem;
        this.itemHeight = itemHeight;
        this.bufferSize = bufferSize;

        this.viewport = container;
        this.content = document.createElement('div');
        this.content.style.position = 'relative';
        this.content.style.height = `${items.length * itemHeight}px`;
        this.viewport.appendChild(this.content);

        this.lastScrollTop = 0;

        // 初始渲染
        this.update();

        // 绑定滚动事件（使用RAF节流）
        this.viewport.addEventListener('scroll', rafThrottle(() => this.update()));
    }

    update() {
        const scrollTop = this.viewport.scrollTop;
        const viewportHeight = this.viewport.clientHeight;

        // 计算可见范围
        const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.bufferSize);
        const endIndex = Math.min(
            this.items.length,
            Math.ceil((scrollTop + viewportHeight) / this.itemHeight) + this.bufferSize
        );

        // 清空并重新渲染可见项
        this.content.innerHTML = '';
        const fragment = document.createDocumentFragment();

        for (let i = startIndex; i < endIndex; i++) {
            const item = this.renderItem(this.items[i], i);
            item.style.position = 'absolute';
            item.style.top = `${i * this.itemHeight}px`;
            item.style.width = '100%';
            fragment.appendChild(item);
        }

        this.content.appendChild(fragment);
    }
}
