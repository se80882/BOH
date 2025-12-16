"""
登录模块
包含登录、租户名验证功能
"""

from playwright.sync_api import Page
from ..config.login_config import LOGIN_URL, CREDENTIALS


def login(
    page: Page,
    login_url: str = LOGIN_URL,
    account: str = None,
    password: str = None,
    brand_alias: str = None
):
    """
    执行登录操作
    
    Args:
        page: Playwright页面对象
        login_url: 登录页面URL（可选，默认使用配置文件中的URL）
        account: 账号（可选，默认使用配置文件中的账号）
        password: 密码（可选，默认使用配置文件中的密码）
        brand_alias: 品牌别名（可选，默认使用配置文件中的品牌别名）
    """
    # 使用默认凭据
    if account is None:
        account = CREDENTIALS['account']
    if password is None:
        password = CREDENTIALS['password']
    if brand_alias is None:
        brand_alias = CREDENTIALS['brandAlias']
    
    # 步骤1: 打开登录页面
    page.goto(login_url)
    
    # 使用更宽松的等待策略
    try:
        page.wait_for_load_state('domcontentloaded', timeout=10000)
    except Exception as e:
        print(f'等待domcontentloaded超时，继续执行: {e}')
    page.wait_for_timeout(2000)

    # 步骤2: 填写登录表单
    page.wait_for_selector('input[type="text"], input[type="password"]', timeout=10000)
    
    # 填写账号
    account_selectors = [
        'input[name="account"]',
        'input[name="username"]',
        'input[id="account"]',
        'input[id="username"]',
        'input[placeholder*="账号"]',
        'input[placeholder*="用户名"]',
        'input[type="text"]'
    ]
    
    account_input = None
    for selector in account_selectors:
        try:
            account_input = page.locator(selector).first
            if account_input.is_visible(timeout=2000):
                break
        except Exception:
            continue
    
    if account_input:
        account_input.fill(account)
    else:
        raise Exception('无法找到账号输入框')

    # 填写密码
    password_selectors = [
        'input[name="password"]',
        'input[id="password"]',
        'input[type="password"]'
    ]
    
    password_input = None
    for selector in password_selectors:
        try:
            password_input = page.locator(selector).first
            if password_input.is_visible(timeout=2000):
                break
        except Exception:
            continue
    
    if password_input:
        password_input.fill(password)
    else:
        raise Exception('无法找到密码输入框')

    # 填写品牌别名
    brand_selectors = [
        'input[name*="brand"]',
        'input[name*="alias"]',
        'input[id*="brand"]',
        'input[id*="alias"]',
        'input[placeholder*="品牌"]',
        'input[placeholder*="别名"]'
    ]
    
    brand_input = None
    for selector in brand_selectors:
        try:
            brand_input = page.locator(selector).first
            if brand_input.is_visible(timeout=2000):
                break
        except Exception:
            continue
    
    if brand_input:
        brand_input.fill(brand_alias)
        print(f'已填写品牌别名: {brand_alias}')
    else:
        print('未找到品牌别名输入框，继续执行')

    # 检查并勾选协议复选框（如果需要）
    try:
        agreement_selectors = [
            'input[type="checkbox"]',
            '[class*="agreement"] input',
            '[class*="protocol"] input',
            'input[name*="agreement"]',
            'input[name*="protocol"]'
        ]
        for selector in agreement_selectors:
            try:
                checkbox = page.locator(selector).first
                if checkbox.is_visible(timeout=1000) and not checkbox.is_checked():
                    checkbox.check()
                    print('已勾选协议复选框')
                    break
            except Exception:
                continue
    except Exception:
        pass

    # 验证表单是否已正确填写
    page.wait_for_timeout(500)
    try:
        account_value = account_input.input_value() if account_input else ''
        password_value = password_input.input_value() if password_input else ''
        brand_value = brand_input.input_value() if brand_input else ''
        print(f'表单验证 - 账号: {account_value[:3]}***, 密码: {"***" if password_value else "空"}, 品牌: {brand_value}')
    except Exception as e:
        print(f'表单验证失败: {e}')

    # 步骤3: 点击登录按钮
    login_button_selectors = [
        'button:has-text("登录")',
        'button:has-text("登陆")',
        'button[type="submit"]',
        'input[type="submit"]',
        'button.login',
        '.login-button',
        '[class*="login"] button',
        'button:has-text("Login")',
        'button:has-text("Sign in")',
        '[class*="login-btn"]',
        '[class*="submit"]'
    ]
    
    login_button = None
    for selector in login_button_selectors:
        try:
            login_button = page.locator(selector).first
            if login_button.is_visible(timeout=2000):
                print(f'找到登录按钮，准备点击')
                break
        except Exception:
            continue
    
    if login_button:
        # 等待按钮可点击
        login_button.wait_for(state='visible', timeout=5000)
        page.wait_for_timeout(500)
        
        # 点击登录按钮并等待导航（类似JavaScript版本的Promise.all）
        print('准备点击登录按钮并等待导航...')
        try:
            # 使用expect_navigation等待导航，使用更宽松的等待策略
            with page.expect_navigation(timeout=15000, wait_until='domcontentloaded'):
                login_button.click()
            print(f'登录按钮已点击，页面已跳转到: {page.url}')
        except Exception as e:
            print(f'等待导航超时: {e}，继续检查URL...')
            # 即使超时，也继续执行后续检查逻辑
            pass
    else:
        print('未找到登录按钮，尝试按Enter键')
        try:
            with page.expect_navigation(timeout=20000, wait_until='networkidle'):
                page.keyboard.press('Enter')
        except Exception:
            pass
    
    # 等待页面跳转，检查是否登录成功
    login_success = False
    max_wait_time = 30000  # 最多等待30秒
    import time
    start_time = time.time() * 1000
    
    # 先等待网络请求完成
    try:
        print('等待网络请求完成...')
        page.wait_for_load_state('networkidle', timeout=15000)
        print('网络请求已完成')
    except Exception as e:
        print(f'等待网络空闲超时: {e}')
    
    # 检查是否有错误提示或验证消息
    try:
        error_selectors = [
            '[class*="error"]',
            '[class*="alert"]',
            '[class*="message"]',
            '.ant-message',
            '.ant-notification',
            '[role="alert"]'
        ]
        for selector in error_selectors:
            try:
                error_element = page.locator(selector).first
                if error_element.is_visible(timeout=1000):
                    error_text = error_element.text_content()
                    if error_text:
                        print(f'检测到错误/提示信息: {error_text[:200]}')
            except Exception:
                continue
    except Exception:
        pass
    
    while (time.time() * 1000) - start_time < max_wait_time:
        current_url = page.url
        print(f'检查登录状态，当前URL: {current_url}')
        
        if '/page/login' not in current_url:
            login_success = True
            print(f'登录成功，页面已跳转到: {current_url}')
            break
        
        # 检查是否有错误提示
        try:
            page_text = page.text_content('body') or ''
            # 检查更具体的错误关键词
            error_keywords = ['错误', '失败', 'error', 'Error', '用户名或密码', '账号', '验证码', 'captcha']
            if page_text:
                for keyword in error_keywords:
                    if keyword.lower() in page_text.lower():
                        # 提取包含错误关键词的上下文
                        idx = page_text.lower().find(keyword.lower())
                        context = page_text[max(0, idx-50):idx+100]
                        print(f'检测到可能的相关信息: {context}')
        except Exception as e:
            print(f'检查页面内容时出错: {e}')
        
        # 等待1秒后再次检查
        page.wait_for_timeout(1000)
    
    if not login_success:
        final_url = page.url
        page_text = page.text_content('body') or ''
        print(f'登录超时，当前URL: {final_url}')
        print(f'页面内容预览: {page_text[:500] if page_text else "空内容"}')
        raise Exception('登录失败，页面仍在登录页面或登录超时')
    
    # 使用更宽松的等待策略
    try:
        page.wait_for_load_state('domcontentloaded', timeout=10000)
    except Exception as e:
        print(f'等待domcontentloaded超时，继续执行: {e}')
    
    page.wait_for_timeout(3000)
    print(f'登录后页面URL: {page.url}')


def verify_tenant_name(page: Page, expected_tenant_name: str = '合阔x'):
    """
    验证租户名
    
    Args:
        page: Playwright页面对象
        expected_tenant_name: 期望的租户名，默认为"合阔x"
    """
    page.wait_for_load_state('domcontentloaded')
    page.wait_for_timeout(2000)
    
    try:
        page_url = page.url
        print(f'当前页面URL: {page_url}')
        
        page.wait_for_load_state('domcontentloaded')
        page_title = page.title()
        print(f'当前页面标题: {page_title}')
    except Exception as e:
        print(f'获取页面信息失败: {e}')
    
    tenant_element = None
    found = False
    
    try:
        tenant_element = page.get_by_text(expected_tenant_name, exact=False).first
        tenant_element.wait_for(state='visible', timeout=5000)
        found = True
    except Exception:
        # 继续尝试其他方法
        pass
    
    if not found:
        try:
            header_selectors = ['header', 'nav', '[class*="header"]', '[class*="navbar"]']
            for header_selector in header_selectors:
                try:
                    header = page.locator(header_selector).first
                    if header.is_visible(timeout=2000):
                        tenant_element = header.get_by_text(expected_tenant_name, exact=False).first
                        if tenant_element.is_visible(timeout=2000):
                            found = True
                            break
                except Exception:
                    continue
        except Exception:
            print('在header中查找失败')
    
    if not found:
        page_text = page.text_content('body') or ''
        if expected_tenant_name in page_text:
            found = True
            print('租户名存在于页面文本中')
    
    # 使用标准断言验证租户名
    assert found is True, f'租户名 "{expected_tenant_name}" 未找到'
    
    # 验证页面文本中包含租户名（双重验证）
    page_text = page.text_content('body') or ''
    assert expected_tenant_name in page_text, f'页面文本中未包含租户名 "{expected_tenant_name}"'
    
    print(f'✓ 租户名验证通过: {expected_tenant_name}')

