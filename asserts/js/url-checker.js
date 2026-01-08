// URL检测工具
class URLChecker {
    constructor() {
        this.results = [];
        this.totalChecked = 0;
        this.successCount = 0;
        this.failedCount = 0;
        this.redirectCount = 0;
        this.suspiciousCount = 0;
        this.lastCheckTime = null;
        this.checkInterval = null;
        
        // 恶意域名列表
        this.maliciousDomains = [
            'phishing.com', 'malware.com', 'scam.com', 'virus.com',
            'hack.com', 'spam.com', 'fraud.com', 'fake.com',
            'dangerous.com', 'infected.com', 'attack.com',
            'malicious.com', 'harmful.com', 'danger.com',
            'threat.com', 'risk.com', 'unsafe.com'
        ];
        
        // 可疑关键词
        this.suspiciousKeywords = [
            'hack', 'crack', 'virus', 'malware',
            'spyware', 'trojan', 'worm', 'exploit',
            'vulnerability', 'attack', 'bypass',
            'inject', 'payload', 'shell', 'backdoor'
        ];
        
        // 已知的恶意IP范围
        this.maliciousIPRanges = [
            { start: '1.1.1.1', end: '1.1.1.255' }, // 示例范围
            { start: '2.2.2.1', end: '2.2.2.255' }  // 示例范围
        ];
    }

    // 检查单个URL
    async checkURL(url, name, category) {
        try {
            const startTime = Date.now();
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                redirect: 'follow',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // 检查重定向
            const finalUrl = response.url || url;
            const isRedirected = finalUrl !== url;

            // 检查响应状态
            const status = response.status;
            const isSuccess = status >= 200 && status < 300;
            const isRedirect = status >= 300 && status < 400;
            const isError = status >= 400;

            // 执行安全检查
            const securityChecks = await this.performSecurityChecks(url, finalUrl, response);
            const isSuspicious = securityChecks.isSuspicious;
            const securityDetails = securityChecks.details;

            // 更新统计信息
            this.totalChecked++;
            if (isSuccess) this.successCount++;
            if (isError) this.failedCount++;
            if (isRedirect) this.redirectCount++;
            if (isSuspicious) this.suspiciousCount++;

            // 记录结果
            const result = {
                name,
                category,
                originalUrl: url,
                finalUrl,
                status,
                responseTime,
                isRedirected,
                isSuccess,
                isError,
                isSuspicious,
                securityDetails,
                timestamp: new Date().toISOString()
            };

            this.results.push(result);
            return result;

        } catch (error) {
            console.error(`检查URL失败: ${url}`, error);
            this.totalChecked++;
            this.failedCount++;

            const errorResult = {
                name,
                category,
                originalUrl: url,
                finalUrl: url,
                status: 0,
                responseTime: 0,
                isRedirected: false,
                isSuccess: false,
                isError: true,
                isSuspicious: false,
                error: this.getDetailedError(error),
                timestamp: new Date().toISOString()
            };

            this.results.push(errorResult);
            return errorResult;
        }
    }

    // 执行安全检查
    async performSecurityChecks(originalUrl, finalUrl, response) {
        const details = [];
        let isSuspicious = false;

        // 1. 检查域名
        const originalDomain = new URL(originalUrl).hostname;
        const finalDomain = new URL(finalUrl).hostname;
        
        if (originalDomain !== finalDomain) {
            details.push(`域名被重定向: ${originalDomain} -> ${finalDomain}`);
            isSuspicious = true;
        }

        // 2. 检查恶意域名
        if (this.maliciousDomains.some(domain => 
            finalDomain.includes(domain) || 
            finalDomain.includes(domain.replace('.com', ''))
        )) {
            details.push('检测到恶意域名');
            isSuspicious = true;
        }

        // 3. 检查可疑关键词
        if (this.suspiciousKeywords.some(keyword => 
            finalUrl.toLowerCase().includes(keyword)
        )) {
            details.push('URL包含可疑关键词');
            isSuspicious = true;
        }

        // 4. 检查SSL证书
        if (finalUrl.startsWith('https://')) {
            try {
                const certInfo = await this.checkSSL(finalUrl);
                if (!certInfo.isValid) {
                    details.push(`SSL证书问题: ${certInfo.details}`);
                    isSuspicious = true;
                }
            } catch (error) {
                details.push('SSL证书检查失败');
                isSuspicious = true;
            }
        }

        // 5. 检查响应头
        // const headers = response.headers;
        // if (!headers.get('X-Frame-Options')) {
        //     details.push('缺少X-Frame-Options头，可能存在点击劫持风险');
        //     isSuspicious = true;
        // }

        // if (!headers.get('X-Content-Type-Options')) {
        //     details.push('缺少X-Content-Type-Options头，可能存在MIME类型嗅探风险');
        //     isSuspicious = true;
        // }

        // if (!headers.get('Content-Security-Policy')) {
        //     details.push('缺少Content-Security-Policy头，可能存在XSS风险');
        //     isSuspicious = true;
        // }

        return {
            isSuspicious,
            details
        };
    }

    // 检查SSL证书
    async checkSSL(url) {
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors'
            });
            
            return {
                isValid: true,
                details: '证书有效'
            };
        } catch (error) {
            return {
                isValid: false,
                details: error.message
            };
        }
    }

    // 获取详细的错误信息
    getDetailedError(error) {
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            return '网络连接失败，可能是域名不存在或服务器无响应';
        }
        if (error.name === 'SecurityError') {
            return '安全错误：可能是跨域请求被阻止';
        }
        if (error.name === 'AbortError') {
            return '请求超时';
        }
        return error.message || '未知错误';
    }

    // 生成检测报告
    generateReport() {
        return {
            summary: {
                totalChecked: this.totalChecked,
                successCount: this.successCount,
                failedCount: this.failedCount,
                redirectCount: this.redirectCount,
                suspiciousCount: this.suspiciousCount,
                successRate: (this.successCount / this.totalChecked * 100).toFixed(2) + '%',
                lastCheckTime: this.lastCheckTime,
                timestamp: new Date().toISOString()
            },
            details: this.results
        };
    }

    // 开始定时检测
    startPeriodicCheck(interval = 3600000) { // 默认1小时
        this.checkInterval = setInterval(async () => {
            await this.checkAllURLs();
            this.lastCheckTime = new Date().toISOString();
        }, interval);
    }

    // 停止定时检测
    stopPeriodicCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    // 批量检查URL
    async checkAllURLs(data) {
        const results = [];
        for (const category of Object.keys(data.links)) {
            for (const item of data.links[category]) {
                if (item.url) {
                    const result = await this.checkURL(item.url, item.name, category);
                    results.push(result);
                }
            }
        }
        return results;
    }
}

// 导出URLChecker类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = URLChecker;
} 