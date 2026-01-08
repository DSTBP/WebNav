document.addEventListener('DOMContentLoaded', function () {
    // --- DOM 元素获取 ---
    const searchForm = document.getElementById('super-search-fm');
    const searchInput = document.getElementById('search-text');
    const searchTypeRadios = document.querySelectorAll('input[name="type"]');
    const newWindowCheckbox = document.getElementById('set-search-blank');
    const searchGroups = document.querySelectorAll('.search-group');

    // --- 辅助函数 ---

    /** 获取当前选中搜索引擎的 URL */
    const getActionUrl = () => document.querySelector('input[name="type"]:checked')?.value || '';

    /** 获取当前选中搜索引擎的占位提示文字 */
    const getPlaceholder = () => document.querySelector('input[name="type"]:checked')?.getAttribute('data-placeholder') || '输入关键字搜索';

    /** 从 localStorage 获取上一次使用的搜索引擎类型，若无则返回第一个 */
    const getDefaultSearchType = () => localStorage.getItem('search_type') || (searchTypeRadios.length > 0 ? searchTypeRadios[0].value : '');
    
    /** 检查是否应在新窗口打开搜索结果，默认为 true */
    const shouldOpenInNewWindow = () => (localStorage.getItem('search_new_window') || '1') === '1';

    /** 更新表单的 action 属性，站内搜索除外 */
    const updateAction = (url) => { if (url && url !== 'site-search') searchForm.action = url; };

    /** 更新搜索框的 placeholder */
    const updatePlaceholder = (text) => { searchInput.placeholder = text; };
    
    /** 更新表单的 target 属性，决定是否在新标签页打开 */
    const updateTarget = (openInNew) => openInNew ? searchForm.target = '_blank' : searchForm.removeAttribute('target');
    
    /** 将设置保存到 localStorage */
    const saveToLocalStorage = (key, value) => localStorage.setItem(`search_${key}`, value);

    /** 高亮当前选中的搜索引擎所在的分组 */
    function highlightActiveGroup(radioElement) {
        searchGroups.forEach(group => group.classList.remove('s-current'));
        if (radioElement) {
            let parent = radioElement.closest('.search-group');
            if(parent) parent.classList.add('s-current');
        }
    }
    
    // --- 事件处理函数 ---

    /** 当切换搜索引擎时触发 */
    function onSearchTypeChange(event) {
        const selectedRadio = event.target;
        updatePlaceholder(selectedRadio.getAttribute('data-placeholder'));
        updateAction(selectedRadio.value);
        saveToLocalStorage('type', selectedRadio.value);
        searchInput.focus();
        highlightActiveGroup(selectedRadio);
    }

    /** 当"在新窗口中打开"复选框状态改变时触发 */
    function onNewWindowToggle(event) {
        const isChecked = event.target.checked;
        saveToLocalStorage('new_window', isChecked ? '1' : '0');
        updateTarget(isChecked);
    }

    /** 当搜索表单提交时触发 */
    function onFormSubmit(event) {
        const keyword = searchInput.value.trim();
        const actionUrl = getActionUrl();

        // 对于外部搜索，阻止默认提交并手动处理
        if (actionUrl !== 'site-search') {
            event.preventDefault();
            if (keyword === '') {
                searchInput.focus();
                return;
            }
            const url = actionUrl + encodeURIComponent(keyword);
            shouldOpenInNewWindow() ? window.open(url, '_blank') : window.location.href = url;
        }
        // 对于站内搜索，不执行任何操作，其逻辑由 input 事件处理
    }

    // --- 初始化 ---
    function init() {
        // 1. 设置"在新窗口中打开"复选框的初始状态
        const openInNew = shouldOpenInNewWindow();
        newWindowCheckbox.checked = openInNew;
        updateTarget(openInNew);

        // 2. 设置默认的搜索引擎
        const defaultType = getDefaultSearchType();
        const defaultRadio = document.querySelector(`input[name="type"][value="${defaultType}"]`);
        if (defaultRadio) {
            defaultRadio.checked = true;
            highlightActiveGroup(defaultRadio);
        }

        // 3. 设置初始的 placeholder 和 action
        updatePlaceholder(getPlaceholder());
        updateAction(getActionUrl());

        // 4. 绑定事件监听器
        searchTypeRadios.forEach(radio => radio.addEventListener('change', onSearchTypeChange));
        newWindowCheckbox.addEventListener('change', onNewWindowToggle);
        searchForm.addEventListener('submit', onFormSubmit);
    }

    init();
}); 