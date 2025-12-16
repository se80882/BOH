# BOH自动化测试项目 - Python版本

这是一个使用Playwright Python进行BOH后台自动化测试的项目。

## 项目结构

```
BOH/
├── conftest.py              # Pytest配置文件，提供Playwright fixtures
├── pytest.ini              # Pytest配置
├── requirements.txt        # Python依赖包
├── tests/
│   ├── __init__.py
│   ├── test_login.py       # 主测试文件
│   ├── config/
│   │   ├── __init__.py
│   │   ├── login_config.py # 登录配置（生产/测试环境）
│   │   └── url_config.py   # URL配置（各模块路径）
│   └── modules/
│       ├── __init__.py
│       ├── login_module.py # 登录模块
│       └── order_module.py # 订单模块
└── README_PYTHON.md        # 本文档
```

## 安装

### 1. 安装Python依赖

```bash
pip install -r requirements.txt
```

### 2. 安装Playwright浏览器

```bash
playwright install chromium
```

## 配置

### 环境配置

项目支持两个环境：生产环境（production）和测试环境（test）

默认使用测试环境，可通过环境变量切换：

```bash
# 使用测试环境（默认）
python -m pytest

# 使用生产环境
ENV=production python -m pytest
```

### 登录配置

登录配置在 `tests/config/login_config.py` 中：

```python
LOGIN_CONFIG = {
    'production': {
        'authBaseUrl': 'https://auth.hexcloud.cn',
        'loginUrl': 'https://auth.hexcloud.cn/page/login',
        'bohBaseUrl': 'https://boh.hexcloud.cn',
        'credentials': {
            'account': 'admin',
            'password': 'admin@123',
            'brandAlias': 'hex'
        }
    },
    'test': {
        'authBaseUrl': 'https://saas-auth-qa.hexcloud.cn',
        'loginUrl': 'https://saas-auth-qa.hexcloud.cn/page/login',
        'bohBaseUrl': 'https://saas-boh-qa.hexcloud.cn',
        'credentials': {
            'account': 'admin',
            'password': 'admin@123',
            'brandAlias': 'hex'
        }
    }
}
```

### URL配置

各模块URL配置在 `tests/config/url_config.py` 中，包含：
- 组织管理URL
- 商品管理URL
- 门店运营URL
- 仓库运营URL
- 门店单据审核URL
- 门店运营管理URL
- 仓库运营管理URL
- 供应商平台URL
- 门店报表URL

## 运行测试

### 运行所有测试

```bash
python -m pytest
```

### 运行指定测试文件

```bash
python -m pytest tests/test_login.py
```

### 运行指定测试用例

```bash
python -m pytest tests/test_login.py::test_complete_flow
```

### 显示浏览器窗口（非无头模式）

在 `conftest.py` 中已经配置为 `headless=False`，测试时会显示浏览器窗口。

### 查看测试报告

项目使用 **Allure Reports** 生成美观的测试报告。

#### 安装Allure命令行工具

**macOS** (使用Homebrew):
```bash
brew install allure
```

**Windows** (使用Scoop):
```bash
scoop install allure
```

**Linux**:
```bash
# 下载并安装Allure
wget https://github.com/allure-framework/allure2/releases/download/2.24.0/allure-2.24.0.tgz
tar -zxvf allure-2.24.0.tgz
sudo mv allure-2.24.0 /opt/allure
sudo ln -s /opt/allure/bin/allure /usr/local/bin/allure
```

或者访问 [Allure官网](https://docs.qameta.io/allure/) 查看详细安装说明。

#### 运行测试并生成报告

```bash
# 1. 运行测试（会自动生成allure-results目录）
python -m pytest tests/test_login.py -v

# 2. 生成Allure报告
allure generate allure-results -o allure-report --clean

# 3. 打开报告（如果安装了Allure，测试完成后会自动打开）
allure open allure-report
```

#### 报告内容

Allure报告包含以下内容：
- ✅ **测试用例列表**：显示所有执行过的测试用例
- ✅ **统计信息**：显示成功、失败、跳过的测试数量和图表
- ✅ **操作视频**：每个测试用例的完整操作视频（自动附加）
- ✅ **失败截图**：测试失败时的截图（自动附加）
- ✅ **测试步骤**：详细的测试执行步骤
- ✅ **执行时间**：每个测试用例和步骤的执行时间
- ✅ **环境信息**：测试执行环境详情

#### 报告目录说明

- `allure-results/` - 测试结果原始数据（JSON格式）
- `allure-report/` - 生成的HTML报告（可独立查看）

#### 自动打开报告

如果安装了Allure命令行工具，测试完成后会自动：
1. 生成Allure报告
2. 在浏览器中打开报告

如果未安装Allure工具，可以手动生成：
```bash
allure generate allure-results -o allure-report --clean
allure open allure-report
```

## CI/CD持续集成

项目已配置GitHub Actions工作流，支持自动化测试。

### 工作流说明

#### 1. CI/CD自动化测试 (`ci.yml`)
- **触发时机**：
  - 代码推送到 `main` 或 `develop` 分支
  - 创建Pull Request到 `main` 或 `develop` 分支
  - 手动触发
- **执行内容**：
  - 在多个Python版本（3.9, 3.10, 3.11）上运行Python测试
  - 运行JavaScript/Node.js测试
  - 生成测试报告并上传为Artifact
  - 上传测试视频（保留7天）

#### 2. 定时测试 (`scheduled-tests.yml`)
- **触发时机**：
  - 每天UTC 2:00（北京时间10:00）自动运行
  - 手动触发
- **执行内容**：
  - 运行完整的Python测试套件
  - 生成测试报告

### 查看CI/CD结果

1. **GitHub Actions页面**：
   - 访问 `https://github.com/[用户名]/BOH/actions`
   - 查看工作流执行状态和历史记录

2. **测试报告Artifacts**：
   - 在每个工作流运行完成后，可以在Actions页面下载Allure报告
   - 报告包含完整的Allure HTML报告
   - 包含操作视频和失败截图
   - 下载后解压，使用浏览器打开 `allure-report/index.html` 查看报告

3. **Pull Request检查**：
   - 创建PR时，CI/CD会自动运行测试
   - PR页面会显示测试通过/失败状态
   - 测试失败会阻止合并（可配置）

### 本地CI测试

在本地模拟CI环境运行测试：

```bash
# 设置CI环境变量
export CI=true

# 运行测试（会使用headless模式）
python -m pytest tests/test_login.py -v
```

### CI/CD配置文件

- `.github/workflows/ci.yml` - 主CI/CD工作流
- `.github/workflows/scheduled-tests.yml` - 定时测试工作流

## 测试流程

当前的完整测试流程包括：

1. **步骤1**: 最大化浏览器并打开登录页面，使用admin账号登录
2. **步骤2**: 验证页面左上角的租户名为合阔x
3. **步骤3**: 依次打开目录：门店运营/订货，导航到订货页面
4. **步骤4**: 选择日期条件（12月1号到12月31号）并点击查询
5. **步骤5**: 查找并验证订货单342512080002的列表数据
6. **步骤6**: 点击订货单342512080002打开详情页
7. **步骤7**: 验证详情页顶部信息（订货单号、单据状态、来源、订货日期、订货门店、订货门店编号）
8. **步骤8**: 验证商品行展示一个商品行
9. **步骤9**: 检查商品编号为T20251128012，商品名称测试20251128012展示正确

## 模块说明

### login_module.py

登录相关功能：
- `login()`: 执行登录操作
- `verify_tenant_name()`: 验证租户名

### order_module.py

订单相关功能：
- `navigate_to_order_page()`: 导航到订货页面
- `select_date_range_and_query()`: 选择日期范围并查询
- `find_and_verify_order_in_list()`: 查找并验证订单列表数据
- `click_order_to_open_detail()`: 点击订单打开详情页
- `verify_order_detail()`: 验证订单详情页顶部信息
- `verify_product_rows()`: 验证商品行

## 注意事项

1. **浏览器最大化**: 使用CDP（Chrome DevTools Protocol）实现浏览器窗口最大化
2. **等待策略**: 使用智能等待策略，避免硬编码等待时间过长
3. **错误处理**: 包含完善的错误处理和重试机制
4. **环境变量**: 可通过环境变量 `ENV` 切换生产/测试环境
5. **BOH Base URL**: 可通过环境变量 `BOH_BASE_URL` 覆盖默认的BOH基础URL

## 与JavaScript版本的对比

- **语法差异**: Python使用缩进而非大括号，异步使用同步API
- **模块导入**: 使用 `from ... import` 而非 `require()`
- **断言**: 使用 `expect()` 的链式调用，语法略有不同
- **CDP调用**: Python版本使用字典传递参数，而非JavaScript对象

## 故障排查

### 浏览器未安装

如果遇到浏览器未安装的错误：

```bash
playwright install chromium
```

### 依赖包缺失

如果遇到导入错误，检查是否安装了所有依赖：

```bash
pip install -r requirements.txt
```

### 测试超时

如果测试超时，可以增加超时时间，在 `pytest.ini` 中修改 `--timeout=240`

## 更多信息

- [Playwright Python文档](https://playwright.dev/python/)
- [Pytest文档](https://docs.pytest.org/)
- [项目README](README.md) - JavaScript版本说明


