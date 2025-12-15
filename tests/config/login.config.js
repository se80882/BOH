/**
 * BOH后台登录配置
 * 包含生产环境和测试环境的域名及登录凭据
 */

const loginConfig = {
  // 生产环境配置
  production: {
    authBaseUrl: 'https://auth.hexcloud.cn',
    loginUrl: 'https://auth.hexcloud.cn/page/login',
    bohBaseUrl: 'https://boh.hexcloud.cn',
    credentials: {
      account: 'admin',
      password: 'admin@123',
      brandAlias: 'hex'
    }
  },

  // 测试环境配置
  test: {
    authBaseUrl: 'https://saas-auth-qa.hexcloud.cn',
    loginUrl: 'https://saas-auth-qa.hexcloud.cn/page/login',
    bohBaseUrl: 'https://saas-boh-qa.hexcloud.cn',
    credentials: {
      account: 'admin',
      password: 'admin@123',
      brandAlias: 'hex'
    }
  }
};

// 默认使用测试环境（可通过环境变量切换）
const env = process.env.ENV || 'test'; // 'production' 或 'test'
const currentConfig = loginConfig[env] || loginConfig.test;

module.exports = {
  loginConfig,
  currentConfig,
  // 导出当前环境的配置（方便直接使用）
  authBaseUrl: currentConfig.authBaseUrl,
  loginUrl: currentConfig.loginUrl,
  bohBaseUrl: currentConfig.bohBaseUrl,
  credentials: currentConfig.credentials
};

