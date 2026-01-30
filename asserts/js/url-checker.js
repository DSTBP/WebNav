class URLChecker {
    constructor(timeout = 5000) {
        this.timeout = timeout;
    }

    async check(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        const startTime = performance.now();

        try {
            // 使用 no-cors 模式来避免跨域报错，但这只能检测服务器是否响应，无法知道具体状态码
            // 如果目标站点支持 CORS，可以去掉 mode: 'no-cors' 以获取更精确的结果
            const response = await fetch(url, {
                method: 'HEAD', // 尝试只请求头信息
                mode: 'no-cors', 
                signal: controller.signal,
                cache: 'no-cache'
            });

            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            clearTimeout(timeoutId);

            // 在 no-cors 模式下，response.ok 总是 false，status 总是 0，type 是 'opaque'
            // 只要没有抛出网络错误，我们就认为它是“存活”的。
            // 这是一个妥协方案，因为纯前端无法完美检测跨域链接。
            return {
                status: 'success',
                duration: duration,
                statusText: response.type === 'opaque' ? 'Opaque Response (Live)' : response.statusText,
                code: response.status
            };

        } catch (error) {
            clearTimeout(timeoutId);
            let errorMsg = error.message;
            if (error.name === 'AbortError') {
                errorMsg = `超时 (${this.timeout}ms)`;
            }
            return {
                status: 'failed',
                duration: this.timeout,
                error: errorMsg
            };
        }
    }
}

// === 以下是需要修改的 UI 渲染函数 ===

function createResultRow(link) {
    const tr = document.createElement('tr');
    // 初始化时显示等待状态
    tr.innerHTML = `
        <td><span class="status-badge" style="background: #eee; color: #888;"><i class="fa-solid fa-clock"></i> 等待中</span></td>
        <td><span class="category-tag">${link.category}</span></td>
        <td style="font-weight: 500;">${link.title}</td>
        <td class="url-cell" title="${link.url}"><a href="${link.url}" target="_blank">${link.url}</a></td>
        <td>-</td>
        <td style="color: #888; font-size: 12px;">Waiting...</td>
    `;
    return tr;
}

function updateResult(link, result) {
    const row = link.rowElement;
    if (!row) return;

    const statusCell = row.cells[0];
    const durationCell = row.cells[4];
    const detailsCell = row.cells[5];

    // 根据状态生成不同的徽章 HTML
    if (result.status === 'checking') {
        statusCell.innerHTML = `<span class="status-badge status-checking"><i class="fa-solid fa-spinner fa-spin"></i> 检测中...</span>`;
        detailsCell.textContent = '正在连接...';
    } else if (result.status === 'success') {
        statusCell.innerHTML = `<span class="status-badge status-success"><i class="fa-solid fa-check-circle"></i> 正常</span>`;
        durationCell.textContent = result.duration + 'ms';
        // 如果是 opaque 响应，提示用户可能不准确
        const detailText = result.code === 0 ? '连接成功 (跨域受限,仅确认存活)' : `HTTP ${result.code} ${result.statusText}`;
        detailsCell.innerHTML = `<span title="${detailText}">${detailText}</span>`;
        // 可以选择移除整行，只看错误的
        // row.remove(); 
    } else {
        statusCell.innerHTML = `<span class="status-badge status-failed"><i class="fa-solid fa-circle-xmark"></i> 失败</span>`;
        durationCell.textContent = result.duration + 'ms';
        detailsCell.innerHTML = `<span style="color: var(--danger-color);" title="${result.error}">${result.error}</span>`;
        // 将失败的行移动到表格顶部，方便查看
        row.parentElement.prepend(row);
    }
}