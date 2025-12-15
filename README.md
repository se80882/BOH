# Firefox登录自动化测试

这是一个基于Playwright的自动化测试项目，用于测试登录功能并验证租户名显示。

## 功能

- 使用Firefox浏览器打开登录页面
- 使用指定凭据登录（账号：admin，密码：admin@123，品牌别名：hex）
- 验证页面左上角的租户名为"合阔x"
- 生成HTML可视化测试报告

## 安装

1. 安装Node.js依赖：
```bash
npm install
```

2. 安装Playwright浏览器（包括Firefox）：
```bash
npx playwright install firefox
```

## 运行测试

### 运行测试（无头模式）
```bash
npm test
```

### 运行测试（显示浏览器窗口）
```bash
npm run test:headed
```

### 查看测试报告
```bash
npm run test:report
```

测试报告将自动生成在 `playwright-report` 目录中，包含：
- 测试步骤详情
- 截图（失败时）
- 视频录制（失败时）
- 执行时间统计

## 测试配置

测试配置位于 `playwright.config.js` 文件中，可以修改：
- 浏览器类型和选项
- 超时时间
- 报告格式
- 截图和视频设置

## 测试文件

测试脚本位于 `tests/login.spec.js`，包含以下测试步骤：
1. 打开登录页面
2. 填写登录信息
3. 提交登录表单
4. 验证租户名显示

## 注意事项

- 确保网络连接正常，可以访问测试环境
- Firefox浏览器需要正确安装
- 如果页面元素选择器发生变化，可能需要更新测试脚本中的选择器





