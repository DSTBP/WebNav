/**
 * URL 检测工具核心逻辑 - 并行极速版
 * 使用并发池技术加速检测过程
 */

// ==================== 主题模块 ====================
const ThemeModule = {
    STORAGE_KEY: 'theme-preference',

    init() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const initialTheme = stored ?? (mediaQuery.matches ? 'dark' : 'light');
        
        this.applyTheme(initialTheme);

        const btn = document.getElementById('theme-toggle-btn');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
        }
    },

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);
    },

    toggle() {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);
        
        if (typeof iziToast !== 'undefined') {
            iziToast.show({
                title: next === 'dark' ? '夜间模式' : '日间模式',
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
        this.reset();
        this.maliciousDomains = ['phishing.com', 'malware.com', 'scam.com'];
    }

    reset() {
        this.totalChecked = 0;
        this.successCount = 0;
        this.failedCount = 0;
        this.redirectCount = 0;
        this.suspiciousCount = 0;
    }

    async checkURL(url, name, category) {
        try {
            const startTime = Date.now();
            
            // 使用 no-cors 模式进行快速探测
            // 注意：这种模式下无法获取具体的 status code (除了0)，主要用于检测是否网络可达
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors', 
                cache: 'no-cache'
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // 只要没有抛出网络错误，我们暂且认为是通的 (status 0 in opaque response)
            const status = response.status || 200; 
            
            const isSuccess = true; 
            const isError = false;
            const isRedirect = false; 
            
            const securityChecks = this.performSecurityChecks(url);
            
            // 线程安全更新统计（JS是单线程EventLoop，这里是安全的）
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
                error: error.message || '连接失败',
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
            // 简单的 http 警告，可视情况移除
            if (url.startsWith('http://')) {
                // details.push('非 HTTPS'); // 很多内网或老站还是http，暂不算可疑
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

// ==================== 页面交互与并发逻辑 ====================
let checkerInstance = null;
let isChecking = false;
let shouldStop = false;
let allResults = [];
let currentFilter = 'all';

// 并发配置
const MAX_CONCURRENCY = 20; // 同时并行的请求数

document.addEventListener('DOMContentLoaded', () => {
    ThemeModule.init();

    const startBtn = document.getElementById('startCheck');
    const stopBtn = document.getElementById('stopCheck');
    const filterBtns = document.querySelectorAll('.filter-group .btn');

    startBtn.addEventListener('click', startCheck);
    stopBtn.addEventListener('click', () => {
        shouldStop = true;
        updateUIState(false);
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderResults();
        });
    });
});

async function startCheck() {
    if (isChecking) return;
    
    // UI 重置
    resetStats();
    updateUIState(true);
    document.body.classList.add('checking-active');
    
    checkerInstance = new URLChecker();
    allResults = [];
    document.getElementById('resultsBody').innerHTML = '';
    
    // 读取数据
    const data = window.NAV_DATA;
    if (!data || !data.links) {
        alert('错误：未找到导航数据 (window.NAV_DATA)。请确保 data.js 已正确加载。');
        updateUIState(false);
        return;
    }

    // 准备任务队列
    let tasks = [];
    Object.entries(data.links).forEach(([category, items]) => {
        items.forEach(item => {
            if (item.url) tasks.push({ ...item, category });
        });
    });

    const totalTasks = tasks.length;
    let completedTasks = 0;
    // 共享的任务指针
    let taskIndex = 0;

    // 定义 Worker 函数：不断从队列取任务直到取完
    const worker = async () => {
        while (taskIndex < totalTasks) {
            if (shouldStop) break;
            
            // 原子操作取任务
            const currentIndex = taskIndex++; 
            const task = tasks[currentIndex];
            if (!task) break;

            // 执行检测
            const result = await checkerInstance.checkURL(task.url, task.name, task.category);
            
            allResults.push(result);
            completedTasks++;

            // 实时更新 UI (注意：频繁操作DOM可能会轻微影响性能，但为了视觉效果保留)
            updateStatsDisplay(checkerInstance, completedTasks, totalTasks);
            
            if (shouldShow(result, currentFilter)) {
                addResultRow(result);
            }
        }
    };

    // 启动并发池
    const workers = [];
    // 创建 MAX_CONCURRENCY 个 Worker 或者是 任务总数（如果任务很少）
    const concurrency = Math.min(MAX_CONCURRENCY, totalTasks);
    
    for (let i = 0; i < concurrency; i++) {
        workers.push(worker());
    }

    // 等待所有 Worker 完成
    await Promise.all(workers);

    // 完成后续处理
    updateUIState(false);
    document.body.classList.remove('checking-active');
    
    if (!shouldStop && typeof iziToast !== 'undefined') {
        iziToast.success({ 
            title: '检测完成', 
            message: `共耗时: ${((Date.now() - checkerInstance.startTime) / 1000).toFixed(1)}s` 
        });
    }
}

function updateUIState(checking) {
    isChecking = checking;
    shouldStop = false;
    document.getElementById('startCheck').disabled = checking;
    document.getElementById('stopCheck').disabled = !checking;
    document.getElementById('loading-text').style.display = checking ? 'block' : 'none';
    document.getElementById('empty-text').style.display = 'none';
    
    if(checking) {
        if(checkerInstance) checkerInstance.startTime = Date.now();
    }
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
    document.getElementById('totalChecked').textContent = processed + '/' + total;
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
    if (filter === 'redirect') return result.isRedirect; 
    return true;
}

function renderResults() {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';
    // 按时间倒序或顺序渲染
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
        <td>${result.status === 0 ? '---' : result.status}</td>
        <td>${result.responseTime}ms</td>
        <td><span class="status-badge ${statusBadge}">${statusText}</span></td>
        <td><small class="text-muted">${result.error || result.security.details.join(', ') || 'OK'}</small></td>
    `;
    
    // 插入到最前面，方便看到最新进度
    const tbody = document.getElementById('resultsBody');
    tbody.insertBefore(tr, tbody.firstChild);
}