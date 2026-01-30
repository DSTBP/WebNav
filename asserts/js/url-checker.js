/**
 * URL 检测工具核心逻辑
 * 适配 data.js 数据源与主页主题风格
 */

// ==================== 主题模块 (复刻主页逻辑) ====================
const ThemeModule = {
    STORAGE_KEY: 'theme-preference',

    init() {
        // 读取存储的主题偏好
        const stored = localStorage.getItem(this.STORAGE_KEY);
        // 如果没有存储，跟随系统，或者默认为 light (根据主页逻辑)
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const initialTheme = stored ?? (mediaQuery.matches ? 'dark' : 'light');
        
        this.applyTheme(initialTheme);

        // 绑定切换按钮
        const btn = document.getElementById('theme-toggle-btn');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
        }
    },

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);
        
        // 可选：触发 toast 提示
        if (typeof iziToast !== 'undefined') {
            // 这里不弹窗，避免加载时打扰
        }
    },

    toggle() {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);
        
        if (typeof iziToast !== 'undefined') {
            iziToast.show({
                title: next === 'dark' ? '已切换为夜间模式' : '已切换为日间模式',
                position: 'topRight',
                timeout: 1000,
                color: next === 'dark' ? 'dark' : 'green'
            });
        }
    }
};

// ==================== 核心检测类 ====================
class URLChecker {
    constructor() {
        this.results = [];
        this.totalChecked = 0;
        this.successCount = 0;
        this.failedCount = 0;
        this.redirectCount = 0;
        this.suspiciousCount = 0;
        
        // 恶意域名黑名单 (示例)
        this.maliciousDomains = [
            'phishing.com', 'malware.com', 'scam.com'
        ];
    }

    async checkURL(url, name, category) {
        try {
            const startTime = Date.now();
            
            // 注意：由于浏览器的 CORS 限制，前端直接 fetch 外部链接通常会失败或被拦截。
            // 这里使用 no-cors 模式，只能判断是否网络通畅，无法精确获取状态码。
            // 真实场景通常需要后端代理，这里尽可能模拟前端检测。
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors', 
                cache: 'no-cache'
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // 在 no-cors 模式下，status 也是不可见的 (type: opaque)，通常返回 0
            // 我们假设没有抛出错误即为网络可达
            const status = response.status || 200; 
            
            // 简单的逻辑判断
            const isSuccess = true; 
            const isError = false;
            const isRedirect = false; // 前端无法轻易检测重定向
            
            // 安全检查
            const securityChecks = this.performSecurityChecks(url);
            
            this.updateStats({
                isSuccess, isError, isRedirect, isSuspicious: securityChecks.isSuspicious
            });

            return {
                name, category, url, status, responseTime,
                isSuccess, isError, isRedirect,
                security: securityChecks,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.updateStats({ isError: true });
            return {
                name, category, url, 
                status: 0, 
                responseTime: 0,
                isSuccess: false, isError: true, isRedirect: false,
                error: error.message,
                security: { isSuspicious: false, details: [] }
            };
        }
    }

    performSecurityChecks(url) {
        let isSuspicious = false;
        const details = [];
        
        try {
            const hostname = new URL(url).hostname;
            if (this.maliciousDomains.some(d => hostname.includes(d))) {
                isSuspicious = true;
                details.push('黑名单域名');
            }
            if (url.startsWith('http://')) {
                details.push('非 HTTPS 连接');
            }
        } catch (e) {
            isSuspicious = true;
            details.push('URL 格式非法');
        }

        if (isSuspicious) this.suspiciousCount++;
        return { isSuspicious, details };
    }

    updateStats({ isSuccess, isError, isRedirect, isSuspicious }) {
        this.totalChecked++;
        if (isSuccess && !isSuspicious) this.successCount++;
        if (isError) this.failedCount++;
        if (isRedirect) this.redirectCount++;
    }
}

// ==================== 页面交互逻辑 ====================
let checkerInstance = null;
let isChecking = false;
let shouldStop = false;
let allResults = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    ThemeModule.init(); // 初始化主题

    const startBtn = document.getElementById('startCheck');
    const stopBtn = document.getElementById('stopCheck');
    const filterBtns = document.querySelectorAll('.filter-group .btn');

    startBtn.addEventListener('click', startCheck);
    stopBtn.addEventListener('click', () => {
        shouldStop = true;
        updateUIState(false);
    });

    // 筛选按钮事件
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderResults(); // 重新渲染
        });
    });
});

async function startCheck() {
    if (isChecking) return;
    
    // 初始化状态
    resetStats();
    updateUIState(true);
    
    checkerInstance = new URLChecker();
    allResults = [];
    document.getElementById('resultsBody').innerHTML = '';
    
    // 关键修改：直接从 window.NAV_DATA 读取
    const data = window.NAV_DATA;
    
    if (!data || !data.links) {
        alert('错误：未找到导航数据 (window.NAV_DATA)。请确保 data.js 已正确加载。');
        updateUIState(false);
        return;
    }

    // 扁平化所有链接
    let tasks = [];
    Object.entries(data.links).forEach(([category, items]) => {
        items.forEach(item => {
            if (item.url) tasks.push({ ...item, category });
        });
    });

    const total = tasks.length;
    document.getElementById('totalChecked').textContent = total; // 预显示总数

    // 执行检测循环
    for (let i = 0; i < total; i++) {
        if (shouldStop) break;

        const task = tasks[i];
        const result = await checkerInstance.checkURL(task.url, task.name, task.category);
        
        allResults.push(result);
        updateStatsDisplay(checkerInstance, i + 1, total);
        
        // 实时渲染当前这条结果（如果符合筛选）
        if (shouldShow(result, currentFilter)) {
            addResultRow(result);
        }
    }

    updateUIState(false);
    if (!shouldStop && typeof iziToast !== 'undefined') {
        iziToast.success({ title: '完成', message: '所有链接检测完毕' });
    }
}

function updateUIState(checking) {
    isChecking = checking;
    shouldStop = false;
    document.getElementById('startCheck').disabled = checking;
    document.getElementById('stopCheck').disabled = !checking;
    document.getElementById('loading-text').style.display = checking ? 'block' : 'none';
    document.getElementById('empty-text').style.display = 'none';
}

function resetStats() {
    ['totalChecked', 'successCount', 'failedCount', 'redirectCount', 'suspiciousCount'].forEach(id => {
        document.getElementById(id).textContent = '0';
    });
    document.getElementById('successRate').textContent = '0%';
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('progress-bar').textContent = '0%';
}

function updateStatsDisplay(checker, processed, total) {
    // 这里的 totalChecked 是实时处理的数量
    // document.getElementById('totalChecked').textContent = total; 
    document.getElementById('successCount').textContent = checker.successCount;
    document.getElementById('failedCount').textContent = checker.failedCount;
    document.getElementById('redirectCount').textContent = checker.redirectCount;
    document.getElementById('suspiciousCount').textContent = checker.suspiciousCount;

    const rate = processed > 0 ? ((checker.successCount / processed) * 100).toFixed(1) : 0;
    document.getElementById('successRate').textContent = rate + '%';

    const percent = Math.floor((processed / total) * 100);
    const bar = document.getElementById('progress-bar');
    bar.style.width = percent + '%';
    bar.textContent = percent + '%';
}

function shouldShow(result, filter) {
    if (filter === 'all') return true;
    if (filter === 'success') return result.isSuccess && !result.isError;
    if (filter === 'error') return result.isError;
    if (filter === 'redirect') return result.isRedirect; // 注意：前端可能很难检测到重定向
    return true;
}

function renderResults() {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';
    allResults.forEach(result => {
        if (shouldShow(result, currentFilter)) {
            addResultRow(result);
        }
    });
}

function addResultRow(result) {
    const tr = document.createElement('tr');
    
    let statusBadge = '';
    let statusText = '';
    
    if (result.isError) {
        statusBadge = 'status-error';
        statusText = '异常';
    } else if (result.security.isSuspicious) {
        statusBadge = 'status-suspicious';
        statusText = '可疑';
    } else {
        statusBadge = 'status-success';
        statusText = '正常';
    }

    tr.innerHTML = `
        <td><strong>${result.name}</strong></td>
        <td><span class="label label-default">${result.category}</span></td>
        <td class="url-cell" title="${result.url}"><a href="${result.url}" target="_blank" class="text-primary">${result.url}</a></td>
        <td>${result.status || '-'}</td>
        <td>${result.responseTime}ms</td>
        <td><span class="status-badge ${statusBadge}">${statusText}</span></td>
        <td><small class="text-muted">${result.error || result.security.details.join(', ') || 'OK'}</small></td>
    `;
    
    // 倒序插入，最新的在最上面
    const tbody = document.getElementById('resultsBody');
    tbody.insertBefore(tr, tbody.firstChild);
}