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

### 登录配置

登录相关的配置位于 `tests/config/login.config.js` 文件中，包含：

- **生产环境配置**
  - 认证域名：`https://auth.hexcloud.cn`
  - 登录URL：`https://auth.hexcloud.cn/page/login`
  - BOH域名：`https://boh.hexcloud.cn`
  - 账号：`admin`
  - 密码：`admin@123`
  - 品牌别名：`hex`

- **测试环境配置**（默认）
  - 认证域名：`https://saas-auth-qa.hexcloud.cn`
  - 登录URL：`https://saas-auth-qa.hexcloud.cn/page/login`
  - BOH域名：`https://saas-boh-qa.hexcloud.cn`
  - 账号：`admin`
  - 密码：`admin@123`
  - 品牌别名：`hex`

#### 切换环境

默认使用测试环境。要切换到生产环境，可以通过环境变量设置：

```bash
# 使用生产环境
ENV=production npm test

# 使用测试环境（默认）
ENV=test npm test
# 或者
npm test
```

### URL配置

所有模块的URL路径配置位于 `tests/config/url.config.js` 文件中，包含以下模块：

- **组织管理**：公司、门店、仓库、供应商
- **商品管理**：商品、属性管理
- **门店运营**：订货、生产单、要货、自采、收货、退货、盘点、调拨、库存等
- **仓库运营**：生产单、采购、收货、退货、发货、盘点、调拨、库存等
- **门店单据审核**：收货差异单、门店退货
- **门店运营管理**：订货计划、盘点计划、报废计划、订货规则、总部分配等
- **仓库运营管理**：盘点计划、报废计划
- **供应商平台**：要货单、发货单、退货单
- **门店报表**：要货单报表等

#### 使用URL配置

```javascript
const { urlConfig, getCurrentBohUrl } = require('./config/url.config');

// 获取完整的URL（自动使用当前环境的baseUrl）
const orderUrl = getCurrentBohUrl(urlConfig.storeOperations.order);
// 结果：https://saas-boh-qa.hexcloud.cn/store-supply/demand-daily

// 直接使用相对路径
const productPath = urlConfig.product.item;
// 结果：/product/item
```

### Playwright 配置

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





