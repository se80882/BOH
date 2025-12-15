// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright配置文件
 * 配置Chrome浏览器和HTML测试报告
 */
module.exports = defineConfig({
  testDir: './tests',
  /* 测试超时时间 */
  timeout: 240 * 1000, // 增加到240秒以适应复杂的测试流程
  expect: {
    /* 断言超时时间 */
    timeout: 5000
  },
  /* 并行运行测试 */
  fullyParallel: true,
  /* 失败时不继续运行 */
  forbidOnly: !!process.env.CI,
  /* 在CI环境中重试 */
  retries: process.env.CI ? 2 : 0,
  /* 并行工作进程数 */
  workers: process.env.CI ? 1 : undefined,
  /* 报告器配置 */
  reporter: [
    ['html', { 
      outputFolder: 'playwright-report',
      open: 'never'
    }],
    ['list']
  ],
  /* 共享设置 */
  use: {
    /* 基础URL */
    baseURL: 'https://saas-auth-qa.hexcloud.cn',
    /* 浏览器上下文选项 */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  /* 环境变量配置 */
  // BOH测试环境域名，可通过环境变量 BOH_BASE_URL 覆盖
  // 默认值: https://saas-boh-qa.hexcloud.cn
  // 使用方式: BOH_BASE_URL=https://saas-boh-qa.hexcloud.cn npm test

  /* 配置项目 */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        /* Chrome特定选项 */
        headless: false, // 显示浏览器窗口
      },
    },
  ],

  /* 运行本地开发服务器 */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

