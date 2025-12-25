"""
BOH后台登录配置
包含生产环境和测试环境的域名及登录凭据
"""

import os

LOGIN_CONFIG = {
    # 生产环境配置
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

    # 测试环境配置
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

# 默认使用测试环境（可通过环境变量切换）
ENV = os.getenv('ENV', 'test')  # 'production' 或 'test'
CURRENT_CONFIG = LOGIN_CONFIG.get(ENV, LOGIN_CONFIG['test'])

# 导出当前环境的配置（方便直接使用）
AUTH_BASE_URL = CURRENT_CONFIG['authBaseUrl']
LOGIN_URL = CURRENT_CONFIG['loginUrl']
BOH_BASE_URL = CURRENT_CONFIG['bohBaseUrl']
CREDENTIALS = CURRENT_CONFIG['credentials']










