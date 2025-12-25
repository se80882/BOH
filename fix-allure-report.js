#!/usr/bin/env node
/**
 * 修复Allure报告，使其可以通过file://协议直接打开
 * 将所有JSON数据内联到HTML中，避免CORS限制
 */

const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, 'allure-report');
const INDEX_HTML = path.join(REPORT_DIR, 'index.html');
const DATA_DIR = path.join(REPORT_DIR, 'data');

// 检查报告目录是否存在
if (!fs.existsSync(REPORT_DIR)) {
  console.error(`❌ 错误: 报告目录不存在: ${REPORT_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(INDEX_HTML)) {
  console.error(`❌ 错误: index.html不存在: ${INDEX_HTML}`);
  process.exit(1);
}

console.log('🔧 开始修复Allure报告...');

// 读取原始HTML
let htmlContent = fs.readFileSync(INDEX_HTML, 'utf-8');

// 读取所有JSON数据文件（分别存储data和widgets目录下的同名文件）
const dataFiles = {
  // data目录下的文件（用于Categories、Suites等页面）
  'data/categories.json': path.join(DATA_DIR, 'categories.json'),
  'data/suites.json': path.join(DATA_DIR, 'suites.json'),
  'data/behaviors.json': path.join(DATA_DIR, 'behaviors.json'),
  'data/packages.json': path.join(DATA_DIR, 'packages.json'),
  'data/timeline.json': path.join(DATA_DIR, 'timeline.json'),
  // widgets目录下的文件（用于首页widgets）
  'widgets/summary.json': path.join(REPORT_DIR, 'widgets', 'summary.json'),
  'widgets/categories.json': path.join(REPORT_DIR, 'widgets', 'categories.json'),
  'widgets/suites.json': path.join(REPORT_DIR, 'widgets', 'suites.json'),
  'widgets/behaviors.json': path.join(REPORT_DIR, 'widgets', 'behaviors.json'),
  'widgets/categories-trend.json': path.join(REPORT_DIR, 'widgets', 'categories-trend.json'),
  'widgets/duration-trend.json': path.join(REPORT_DIR, 'widgets', 'duration-trend.json'),
  'widgets/history-trend.json': path.join(REPORT_DIR, 'widgets', 'history-trend.json'),
  'widgets/retry-trend.json': path.join(REPORT_DIR, 'widgets', 'retry-trend.json'),
  'widgets/status-chart.json': path.join(REPORT_DIR, 'widgets', 'status-chart.json'),
  'widgets/duration.json': path.join(REPORT_DIR, 'widgets', 'duration.json'),
  'widgets/severity.json': path.join(REPORT_DIR, 'widgets', 'severity.json'),
  'widgets/executors.json': path.join(REPORT_DIR, 'widgets', 'executors.json'),
  'widgets/launch.json': path.join(REPORT_DIR, 'widgets', 'launch.json'),
  'widgets/environment.json': path.join(REPORT_DIR, 'widgets', 'environment.json')
};

// 读取所有JSON文件并内联到HTML
const inlineData = {};
let loadedCount = 0;

for (const [key, filePath] of Object.entries(dataFiles)) {
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      inlineData[key] = JSON.parse(content);
      loadedCount++;
    } catch (e) {
      console.warn(`⚠️  无法读取文件 ${filePath}: ${e.message}`);
    }
  }
}

// 读取test-cases目录下的所有JSON文件
const testCasesDir = path.join(DATA_DIR, 'test-cases');
if (fs.existsSync(testCasesDir)) {
  const testCaseFiles = fs.readdirSync(testCasesDir).filter(f => f.endsWith('.json'));
  inlineData.testCases = {};
  testCaseFiles.forEach(file => {
    try {
      const filePath = path.join(testCasesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      inlineData.testCases[file] = JSON.parse(content);
      loadedCount++;
    } catch (e) {
      console.warn(`⚠️  无法读取测试用例文件 ${file}: ${e.message}`);
    }
  });
}

console.log(`✅ 已加载 ${loadedCount} 个数据文件`);

// 在HTML中注入数据（必须在所有脚本之前）
const dataScript = `<script>
// 立即执行，确保在页面加载前设置拦截
(function() {
'use strict';

// 内联数据，用于file://协议访问
window.__ALLURE_INLINE_DATA__ = window.__ALLURE_INLINE_DATA__ || ${JSON.stringify(inlineData, null, 2)};

// 立即设置拦截，确保在所有其他代码之前执行
console.log('[Allure修复] 开始设置拦截...');

// 辅助函数：从内联数据中获取数据（暴露到全局作用域）
window.getInlineData = function(url) {
  if (!url || typeof url !== 'string') return null;
  
  // 标准化URL（移除file://协议和完整路径，只保留相对路径）
  let normalizedUrl = url;
  
  // 如果是file://协议，提取相对路径
  if (normalizedUrl.startsWith('file://')) {
    // 提取路径部分，移除file://前缀
    // 匹配格式：file:///Users/.../allure-report/widgets/summary.json
    // 使用字符串方法而不是正则表达式，避免转义问题
    const allureReportIndex = normalizedUrl.indexOf('/allure-report/');
    if (allureReportIndex !== -1) {
      normalizedUrl = normalizedUrl.substring(allureReportIndex + '/allure-report/'.length);
    } else {
      // 如果匹配失败，尝试提取文件名
      normalizedUrl = normalizedUrl.split('/').pop();
    }
  }
  
  // 移除开头的斜杠和相对路径标记
  // 使用字符串方法避免正则表达式转义问题
  if (normalizedUrl.startsWith('./')) {
    normalizedUrl = normalizedUrl.substring(2);
  }
  if (normalizedUrl.startsWith('/')) {
    normalizedUrl = normalizedUrl.substring(1);
  }
  
  // 调试：打印所有尝试的URL
  console.log('[getInlineData] 查找URL:', url, '标准化后:', normalizedUrl);
  
  // 处理test-cases目录下的文件
  if (normalizedUrl.includes('data/test-cases/')) {
    const fileName = normalizedUrl.split('/').pop();
    if (window.__ALLURE_INLINE_DATA__.testCases && window.__ALLURE_INLINE_DATA__.testCases[fileName]) {
      console.log('[getInlineData] ✅ 找到test-case数据:', fileName);
      return window.__ALLURE_INLINE_DATA__.testCases[fileName];
    }
  }
  
  // 直接匹配完整路径（data/xxx.json 或 widgets/xxx.json）
  if (window.__ALLURE_INLINE_DATA__[normalizedUrl]) {
    console.log('[getInlineData] ✅ 找到完整路径数据:', normalizedUrl);
    return window.__ALLURE_INLINE_DATA__[normalizedUrl];
  }
  
  // 如果URL包含data/，尝试匹配data/xxx.json
  if (normalizedUrl.includes('data/')) {
    const dataPath = normalizedUrl.split('data/').pop();
    const fullPath = 'data/' + dataPath;
    if (window.__ALLURE_INLINE_DATA__[fullPath]) {
      console.log('[getInlineData] ✅ 找到data路径数据:', fullPath);
      return window.__ALLURE_INLINE_DATA__[fullPath];
    }
    // 也尝试直接匹配dataPath（向后兼容）
    if (window.__ALLURE_INLINE_DATA__[dataPath]) {
      console.log('[getInlineData] ✅ 找到dataPath数据:', dataPath);
      return window.__ALLURE_INLINE_DATA__[dataPath];
    }
  }
  
  // 如果URL包含widgets/，尝试匹配widgets/xxx.json
  if (normalizedUrl.includes('widgets/')) {
    const widgetPath = normalizedUrl.split('widgets/').pop();
    const fullPath = 'widgets/' + widgetPath;
    if (window.__ALLURE_INLINE_DATA__[fullPath]) {
      console.log('[getInlineData] ✅ 找到widgets路径数据:', fullPath);
      return window.__ALLURE_INLINE_DATA__[fullPath];
    }
    // 也尝试直接匹配widgetPath（向后兼容）
    if (window.__ALLURE_INLINE_DATA__[widgetPath]) {
      console.log('[getInlineData] ✅ 找到widgetPath数据:', widgetPath);
      return window.__ALLURE_INLINE_DATA__[widgetPath];
    }
  }
  
  // 尝试只匹配文件名（向后兼容）
  const fileName = normalizedUrl.split('/').pop();
  if (window.__ALLURE_INLINE_DATA__[fileName]) {
    console.log('[getInlineData] ✅ 找到文件名数据:', fileName);
    return window.__ALLURE_INLINE_DATA__[fileName];
  }
  
  console.log('[getInlineData] ❌ 未找到数据，可用键:', Object.keys(window.__ALLURE_INLINE_DATA__).slice(0, 10));
  return null;
};

// 拦截fetch请求（必须在页面加载前设置，且不能被覆盖）
(function() {
  if (typeof window === 'undefined') return;
  
  // 保存原始的fetch（如果存在）
  const _originalFetch = window.fetch;
  
  // 定义新的fetch函数
  window.fetch = function(url, options) {
    // 拦截JSON文件请求（包括file://协议，但不包括http/https）
    if (typeof url === 'string' && url.endsWith('.json') && 
        (url.startsWith('file://') || (!url.startsWith('http://') && !url.startsWith('https://')))) {
      console.log('[fetch拦截] 拦截请求:', url);
      const data = window.getInlineData(url);
      if (data !== null) {
        console.log('[fetch拦截] ✅ 返回内联数据');
        // 创建一个符合Response接口的对象
        try {
          const response = {
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: typeof Headers !== 'undefined' ? new Headers({ 'Content-Type': 'application/json' }) : {},
            json: function() { return Promise.resolve(data); },
            text: function() { return Promise.resolve(JSON.stringify(data)); },
            clone: function() { return this; }
          };
          return Promise.resolve(response);
        } catch(e) {
          // 如果Headers不可用，使用简单对象
          return Promise.resolve({
            ok: true,
            status: 200,
            json: function() { return Promise.resolve(data); },
            text: function() { return Promise.resolve(JSON.stringify(data)); }
          });
        }
      } else {
        console.log('[fetch拦截] ❌ 未找到内联数据，使用原始fetch');
      }
    }
    
    // 对于其他请求，使用原始fetch
    if (_originalFetch) {
      return _originalFetch.apply(this, arguments);
    }
    // 如果fetch不存在，返回一个rejected promise
    return Promise.reject(new Error('fetch not available'));
  };
  
  // 注意：不要使用Object.defineProperty锁定fetch，因为可能在某些浏览器中导致问题
  // 拦截已经在函数内部完成，不需要额外锁定
})();

// 拦截XMLHttpRequest（必须在页面加载前设置）
(function() {
  if (typeof XMLHttpRequest === 'undefined') return;
  
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    this._url = url;
    this._method = method;
    return originalOpen.call(this, method, url, async !== false, user, password);
  };
  
  XMLHttpRequest.prototype.send = function(data) {
    const url = this._url;
    const self = this;
    
    // 拦截JSON文件请求（包括file://协议，但不包括http/https）
    if (url && typeof url === 'string' && url.endsWith('.json') && 
        (url.startsWith('file://') || (!url.startsWith('http://') && !url.startsWith('https://')))) {
      console.log('[XHR拦截] 拦截请求:', url);
      const inlineData = window.getInlineData(url);
      if (inlineData !== null) {
        console.log('[XHR拦截] ✅ 返回内联数据');
        // 立即设置readyState为LOADING
        try {
          Object.defineProperty(self, 'readyState', { value: 2, writable: true, configurable: true });
          if (self.onreadystatechange) {
            self.onreadystatechange();
          }
        } catch(e) {
          self.readyState = 2;
          if (self.onreadystatechange) {
            self.onreadystatechange();
          }
        }
        
        // 模拟成功的响应
        setTimeout(() => {
          try {
            // 设置响应属性
            Object.defineProperty(self, 'status', { value: 200, writable: true, configurable: true });
            Object.defineProperty(self, 'statusText', { value: 'OK', writable: true, configurable: true });
            Object.defineProperty(self, 'responseText', { value: JSON.stringify(inlineData), writable: true, configurable: true });
            Object.defineProperty(self, 'response', { value: JSON.stringify(inlineData), writable: true, configurable: true });
            Object.defineProperty(self, 'readyState', { value: 4, writable: true, configurable: true });
            
            // 触发readystatechange事件
            if (self.onreadystatechange) {
              self.onreadystatechange();
            }
            
            // 触发load事件
            if (self.onload) {
              self.onload();
            }
            
            // 使用addEventListener的情况
            if (self.addEventListener) {
              try {
                const readyStateEvent = new Event('readystatechange');
                self.dispatchEvent(readyStateEvent);
                
                const loadEvent = new Event('load');
                self.dispatchEvent(loadEvent);
              } catch(e) {}
            }
          } catch (e) {
            console.log('[XHR拦截] ❌ 设置属性失败:', e.message);
            // 如果设置属性失败，尝试直接赋值
            try {
              self.status = 200;
              self.statusText = 'OK';
              self.responseText = JSON.stringify(inlineData);
              self.response = JSON.stringify(inlineData);
              self.readyState = 4;
              if (self.onreadystatechange) self.onreadystatechange();
              if (self.onload) self.onload();
            } catch(e2) {
              console.log('[XHR拦截] ❌ 直接赋值也失败:', e2.message);
              return originalSend.call(self, data);
            }
          }
        }, 10);
        return;
      } else {
        console.log('[XHR拦截] ❌ 未找到内联数据，使用原始send');
      }
    }
    
    // 对于其他请求，使用原始send
    return originalSend.call(this, data);
  };
})();

})(); // 立即执行函数结束

// 等待jQuery加载后，也拦截jQuery的AJAX请求
(function() {
  function setupJQueryIntercept() {
    if (typeof window.jQuery !== 'undefined' && window.jQuery.ajax) {
      const originalAjax = window.jQuery.ajax;
      window.jQuery.ajax = function(options) {
        // 拦截JSON文件请求（包括file://协议，但不包括http/https）
        if (options && options.url && typeof options.url === 'string' && 
            options.url.endsWith('.json') && 
            (options.url.startsWith('file://') || (!options.url.startsWith('http://') && !options.url.startsWith('https://')))) {
          const data = window.getInlineData(options.url);
          if (data !== null) {
            console.log('[jQuery.ajax拦截] ✅ 返回内联数据:', options.url);
            // 模拟成功响应
            const deferred = window.jQuery.Deferred();
            setTimeout(() => {
              if (options.success) {
                options.success(data, 'success', { status: 200 });
              }
              deferred.resolve(data, 'success', { status: 200 });
            }, 0);
            return deferred.promise();
          }
        }
        return originalAjax.apply(this, arguments);
      };
      
      // 也拦截$.get和$.getJSON
      const originalGet = window.jQuery.get;
      window.jQuery.get = function(url, data, success, dataType) {
        if (typeof url === 'string' && url.endsWith('.json') && 
            (url.startsWith('file://') || (!url.startsWith('http://') && !url.startsWith('https://')))) {
          const inlineData = window.getInlineData(url);
          if (inlineData !== null) {
            console.log('[jQuery.get拦截] ✅ 返回内联数据:', url);
            if (typeof success === 'function') {
              setTimeout(() => success(inlineData, 'success', { status: 200 }), 0);
            }
            return window.jQuery.Deferred().resolve(inlineData, 'success', { status: 200 }).promise();
          }
        }
        return originalGet.apply(this, arguments);
      };
      
      const originalGetJSON = window.jQuery.getJSON;
      window.jQuery.getJSON = function(url, data, success) {
        if (typeof url === 'string' && url.endsWith('.json') && 
            (url.startsWith('file://') || (!url.startsWith('http://') && !url.startsWith('https://')))) {
          const inlineData = window.getInlineData(url);
          if (inlineData !== null) {
            console.log('[jQuery.getJSON拦截] ✅ 返回内联数据:', url);
            if (typeof success === 'function') {
              setTimeout(() => success(inlineData, 'success'), 0);
            }
            return window.jQuery.Deferred().resolve(inlineData, 'success', { status: 200 }).promise();
          }
        }
        return originalGetJSON.apply(this, arguments);
      };
    }
  }
  
  // 立即尝试设置
  setupJQueryIntercept();
  
  // 监听DOMContentLoaded，确保jQuery加载后也设置
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupJQueryIntercept);
  } else {
    setupJQueryIntercept();
  }
  
  // 也监听window.load事件
  window.addEventListener('load', setupJQueryIntercept);
})();
</script>
`;

// 检查是否已经插入过脚本（避免重复插入）
if (htmlContent.includes('__ALLURE_INLINE_DATA__')) {
  console.log('⚠️  检测到已存在内联数据脚本，将替换...');
  // 移除旧的脚本块（从<script>到</script>，包含__ALLURE_INLINE_DATA__）
  htmlContent = htmlContent.replace(/<script>[\s\S]*?window\.__ALLURE_INLINE_DATA__[\s\S]*?<\/script>/gi, '');
}

// 在</head>标签之前插入数据脚本（确保在所有其他脚本之前）
htmlContent = htmlContent.replace('</head>', dataScript + '\n</head>');

// 备份原始文件
const backupPath = INDEX_HTML + '.backup';
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(INDEX_HTML, backupPath);
  console.log(`📋 已备份原始文件到: ${backupPath}`);
}

// 写入修复后的HTML
fs.writeFileSync(INDEX_HTML, htmlContent, 'utf-8');

console.log('✅ Allure报告已修复！');
console.log(`📁 现在可以直接打开: ${INDEX_HTML}`);
console.log('');
console.log('💡 提示:');
console.log('   - 可以直接双击 index.html 文件打开');
console.log('   - 或者使用浏览器打开文件路径');
console.log('   - 原始文件已备份为 index.html.backup');

