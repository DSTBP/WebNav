/**
 * URL 检测工具核心逻辑 - 并行极速版
 * 修复版：解决耗时显示 NaN 问题，包含重试机制与 Cloudflare 检测
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
        // 初始化 startTime 为当前时间，防止某些极端情况下未赋值导致的 NaN
        this.startTime = Date.now(); 
    }

    reset() {
        this.totalChecked = 0;
        this.successCount = 0;
        this.failedCount = 0;
        this.redirectCount = 0;
        this.suspiciousCount = 0;
    }

    /**
     * Cloudflare 探测逻辑
     */
    async checkCloudflare(originalUrl) {
        try {
            const u = new URL(originalUrl);
            const traceUrl = `${u.origin}/cdn-cgi/trace`;

            await fetch(traceUrl, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            return true;
        } catch (e) {
            return false;
        }
    }

    async checkURL(url, name, category) {
        const startTime = Date.now();
        
        // ================= 配置区域 =================
        const MAX_RETRIES = 2;    // 最大重试次数 (总共尝试 1+2=3 次)
        const RETRY_DELAY = 1000; // 重试间隔 (毫秒)
        // ===========================================

        // 1. 标准检测 (带重试逻辑)
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                // 尝试请求
                await fetch(url, {
                    method: 'HEAD',
                    mode: 'no-cors', 
                    cache: 'no-cache'
                });

                // 如果代码能执行到这里，说明成功了
                const endTime = Date.now();
                return this.finalizeResult(url, name, category, startTime, endTime, true, false, null);

            } catch (error) {
                // 如果报错了，检查是否还有重试机会
                if (attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                    continue; // 进入下一次循环
                }
            }
        }

        // 2. 异常处理：尝试 Cloudflare 复活检测
        let isCloudflare = false;
        try {
            isCloudflare = await this.checkCloudflare(url);

            if (isCloudflare) {
                const endTime = Date.now();
                // 生成基础结果 (注意：最后一个参数 true 表示检测到了 Cloudflare)
                return this.finalizeResult(url, name, category, startTime, endTime, true, false, null, true);
            }
        } catch (e) {
            // Cloudflare 检测也挂了，忽略
        }

        // 3. 确实挂了 (重试多次 + CF检测均失败)
        this.updateStats({ isError: true });
        return {
            name, category, url, 
            status: 0, 
            responseTime: 0,
            isSuccess: false, isError: true, isRedirect: false,
            error: `连接失败 (重试${MAX_RETRIES}次)`,
            security: { isSuspicious: false, details: [] }
        };
    }

    // 提取公共结果构建逻辑
    finalizeResult(url, name, category, startTime, endTime, isSuccess, isError, errorMsg, isCloudflareDetected = false) {
        const responseTime = endTime - startTime;
        const status = 200; 
        
        let securityChecks = this.performSecurityChecks(url);
        
        // 处理 Cloudflare 标记
        if (isCloudflareDetected) {
            if (!securityChecks.isSuspicious) {
                this.suspiciousCount++; 
                securityChecks.isSuspicious = true;
            }
            securityChecks.details.push('使用了 Cloudflare');
        }

        this.updateStats({
            isSuccess, 
            isError, 
            isRedirect: false, 
            isSuspicious: securityChecks.isSuspicious
        });

        return {
            name, category, url, status, responseTime,
            isSuccess, isError, isRedirect: false,
            security: securityChecks,
            timestamp: new Date().toISOString()
        };
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
const MAX_CONCURRENCY = 20; 

document.addEventListener('DOMContentLoaded', () => {
    ThemeModule.init();

    const startBtn = document.getElementById('startCheck');
    const stopBtn = document.getElementById('stopCheck');
    const filterBtns = document.querySelectorAll('.filter-buttons .btn');

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
    
    // 1. 创建新实例
    checkerInstance = new URLChecker();
    // 2. 【关键修复】明确设置开始时间，防止 NaN
    checkerInstance.startTime = Date.now(); 
    
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
    let taskIndex = 0;

    // Worker 函数
    const worker = async () => {
        while (taskIndex < totalTasks) {
            if (shouldStop) break;
            
            const currentIndex = taskIndex++; 
            const task = tasks[currentIndex];
            if (!task) break;

            // 执行检测
            const result = await checkerInstance.checkURL(task.url, task.name, task.category);
            
            allResults.push(result);
            completedTasks++;

            updateStatsDisplay(checkerInstance, completedTasks, totalTasks);
            
            if (shouldShow(result, currentFilter)) {
                addResultRow(result);
            }
        }
    };

    // 启动并发池
    const workers = [];
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
        // 计算耗时：确保 checkerInstance.startTime 存在且为数字
        const duration = ((Date.now() - checkerInstance.startTime) / 1000).toFixed(1);
        iziToast.success({ 
            title: '检测完成', 
            message: `共耗时: ${duration}s` 
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
}

function resetStats() {
    ['totalChecked', 'successCount', 'failedCount', 'redirectCount', 'suspiciousCount'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.textContent = '0';
    });
    const rateEl = document.getElementById('successRate');
    if(rateEl) rateEl.textContent = '0%';
    
    const bar = document.getElementById('progress-bar');
    if(bar) {
        bar.style.width = '0%';
        bar.textContent = '0%';
    }
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
    if (filter === 'success') return result.isSuccess && !result.isError && !result.security.isSuspicious;
    if (filter === 'error') return result.isError;
    if (filter === 'redirect') return result.isRedirect; 
    if (filter === 'suspicious') return result.security.isSuspicious;
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
        if (result.security.details.some(d => d.includes('Cloudflare'))) {
            statusText = 'CF防护'; 
        } else {
            statusText = '可疑';
        }
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
    
    const tbody = document.getElementById('resultsBody');
    tbody.insertBefore(tr, tbody.firstChild);
}