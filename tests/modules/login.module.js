/**
 * 登录模块
 * 包含登录、租户名验证、语言切换功能
 */

/**
 * 执行登录操作
 * @param {Page} page - Playwright页面对象
 * @param {Object} credentials - 登录凭据
 * @param {string} credentials.account - 账号
 * @param {string} credentials.password - 密码
 * @param {string} credentials.brandAlias - 品牌别名
 */
async function login(page, { account = 'admin', password = 'admin@123', brandAlias = 'hex' }) {
  // 步骤1: 打开登录页面
  await page.goto('https://saas-auth-qa.hexcloud.cn/page/login');
  
  // 使用更宽松的等待策略
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  } catch (e) {
    console.log('等待domcontentloaded超时，继续执行:', e.message);
  }
  await page.waitForTimeout(2000);

  // 步骤2: 填写登录表单
  await page.waitForSelector('input[type="text"], input[type="password"]', { timeout: 10000 });
  
  // 填写账号
  const accountSelectors = [
    'input[name="account"]',
    'input[name="username"]',
    'input[id="account"]',
    'input[id="username"]',
    'input[placeholder*="账号"]',
    'input[placeholder*="用户名"]',
    'input[type="text"]'
  ];
  
  let accountInput = null;
  for (const selector of accountSelectors) {
    try {
      accountInput = await page.locator(selector).first();
      if (await accountInput.isVisible({ timeout: 2000 })) {
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (accountInput) {
    await accountInput.fill(account);
  } else {
    throw new Error('无法找到账号输入框');
  }

  // 填写密码
  const passwordSelectors = [
    'input[name="password"]',
    'input[id="password"]',
    'input[type="password"]'
  ];
  
  let passwordInput = null;
  for (const selector of passwordSelectors) {
    try {
      passwordInput = await page.locator(selector).first();
      if (await passwordInput.isVisible({ timeout: 2000 })) {
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (passwordInput) {
    await passwordInput.fill(password);
  } else {
    throw new Error('无法找到密码输入框');
  }

  // 填写品牌别名
  const brandSelectors = [
    'input[name*="brand"]',
    'input[name*="alias"]',
    'input[id*="brand"]',
    'input[id*="alias"]',
    'input[placeholder*="品牌"]',
    'input[placeholder*="别名"]'
  ];
  
  let brandInput = null;
  for (const selector of brandSelectors) {
    try {
      brandInput = await page.locator(selector).first();
      if (await brandInput.isVisible({ timeout: 2000 })) {
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (brandInput) {
    await brandInput.fill(brandAlias);
  } else {
    console.warn('未找到品牌别名输入框，可能不需要填写');
  }

  // 步骤3: 勾选用户协议并提交登录表单
  const agreementSelectors = [
    'input[type="checkbox"]',
    'checkbox',
    '[role="checkbox"]'
  ];
  
  let agreementCheckbox = null;
  for (const selector of agreementSelectors) {
    try {
      agreementCheckbox = page.locator(selector).first();
      if (await agreementCheckbox.isVisible({ timeout: 2000 })) {
        const isChecked = await agreementCheckbox.isChecked();
        if (!isChecked) {
          await agreementCheckbox.check();
        }
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  await page.waitForTimeout(500);
  
  // 点击登录按钮
  const buttonSelectors = [
    'button:has-text("登录")',
    'button[type="submit"]',
    'button:has-text("Login")',
    'input[type="submit"]',
    'button.btn-primary',
    'button.login-btn'
  ];
  
  let loginButton = null;
  for (const selector of buttonSelectors) {
    try {
      loginButton = await page.locator(selector).first();
      if (await loginButton.isVisible({ timeout: 2000 })) {
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (loginButton) {
    console.log('找到登录按钮，准备点击');
    // 等待按钮可点击
    await loginButton.waitFor({ state: 'visible', timeout: 5000 });
    await page.waitForTimeout(500);
    
    // 点击登录按钮并等待导航
    await Promise.all([
      page.waitForURL((url) => !url.includes('/page/login'), { timeout: 20000 }).catch(() => {}),
      loginButton.click()
    ]);
  } else {
    console.log('未找到登录按钮，尝试按Enter键');
    await page.keyboard.press('Enter');
  }
  
  // 等待页面跳转，检查是否登录成功
  let loginSuccess = false;
  const maxWaitTime = 20000; // 最多等待20秒
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/page/login')) {
      loginSuccess = true;
      console.log('登录成功，页面已跳转到:', currentUrl);
      break;
    }
    
    // 检查是否有错误提示
    try {
      const pageText = await page.textContent('body').catch(() => '');
      if (pageText && (pageText.includes('错误') || pageText.includes('失败') || pageText.includes('error') || pageText.includes('Error'))) {
        console.log('检测到错误信息:', pageText.substring(0, 200));
        throw new Error('登录失败，页面显示错误信息');
      }
    } catch (e) {
      if (e.message.includes('登录失败')) {
        throw e;
      }
    }
  }
  
  if (!loginSuccess) {
    const finalUrl = page.url();
    const pageText = await page.textContent('body').catch(() => '');
    console.log('登录超时，当前URL:', finalUrl);
    console.log('页面内容预览:', pageText ? pageText.substring(0, 500) : '空内容');
    throw new Error('登录失败，页面仍在登录页面或登录超时');
  }
  
  // 使用更宽松的等待策略
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  } catch (e) {
    console.log('等待domcontentloaded超时，继续执行:', e.message);
  }
  
  await page.waitForTimeout(3000);
  console.log('登录后页面URL:', page.url());
}

/**
 * 验证租户名
 * @param {Page} page - Playwright页面对象
 * @param {string} expectedTenantName - 期望的租户名，默认为"合阔x"
 */
async function verifyTenantName(page, expectedTenantName = '合阔x') {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  
  try {
    const pageUrl = page.url();
    console.log('当前页面URL:', pageUrl);
    
    await page.waitForLoadState('domcontentloaded');
    const pageTitle = await page.title().catch(() => '无法获取标题');
    console.log('当前页面标题:', pageTitle);
  } catch (e) {
    console.log('获取页面信息失败:', e.message);
  }
  
  let tenantElement = null;
  let found = false;
  
  try {
    tenantElement = page.getByText(expectedTenantName, { exact: false }).first();
    await tenantElement.waitFor({ state: 'visible', timeout: 5000 });
    found = true;
  } catch (e) {
    // 继续尝试其他方法
  }
  
  if (!found) {
    try {
      const headerSelectors = ['header', 'nav', '[class*="header"]', '[class*="navbar"]'];
      for (const headerSelector of headerSelectors) {
        try {
          const header = page.locator(headerSelector).first();
          if (await header.isVisible({ timeout: 2000 })) {
            tenantElement = header.getByText(expectedTenantName, { exact: false }).first();
            if (await tenantElement.isVisible({ timeout: 2000 })) {
              found = true;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      console.log('在header中查找失败');
    }
  }
  
  if (!found) {
    const pageText = await page.textContent('body');
    if (pageText && pageText.includes(expectedTenantName)) {
      found = true;
      console.log('租户名存在于页面文本中');
    }
  }
  
  if (!found) {
    throw new Error(`未找到租户名: ${expectedTenantName}`);
  }
  
  console.log(`✓ 租户名验证通过: ${expectedTenantName}`);
}

/**
 * 检查并切换语言设置为简体中文
 * @param {Page} page - Playwright页面对象
 */
async function switchToSimplifiedChinese(page) {
  // 使用更宽松的等待策略，避免超时
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
  } catch (e) {
    console.log('等待domcontentloaded超时，继续执行:', e.message);
  }
  await page.waitForTimeout(2000);
  
  const pageText = await page.textContent('body');
  const pageInnerText = await page.evaluate(() => document.body.innerText);
  
  const englishKeywords = [
    'Store operations',
    'Warehouse operations', 
    'BOH Supply Chain Platform',
    'Organizational management',
    'Product management',
    'Formula management'
  ];
  
  const chineseKeywords = [
    '门店运营',
    'BOH供应链中台',
    '组织管理',
    '产品管理',
    '配方管理',
    '仓库运营'
  ];
  
  let hasEnglishMenu = false;
  let hasChineseMenu = false;
  
  for (const keyword of englishKeywords) {
    if (pageText && pageText.includes(keyword)) {
      hasEnglishMenu = true;
      break;
    }
  }
  
  for (const keyword of chineseKeywords) {
    if (pageText && pageText.includes(keyword)) {
      hasChineseMenu = true;
      break;
    }
  }
  
  console.log('检测到英文菜单:', hasEnglishMenu);
  console.log('检测到中文菜单:', hasChineseMenu);
  
  if (hasEnglishMenu && !hasChineseMenu) {
    console.log('需要切换到简体中文');
    
    let languageSwitched = false;
    
    // 方法1: 查找页面右上角的语言切换控件
    try {
      const topRightSelectors = [
        '[class*="header"] [class*="language"]',
        '[class*="header"] [class*="lang"]',
        '[class*="navbar"] [class*="language"]',
        '[class*="user"] [class*="language"]',
        'header [class*="language"]',
        'header [class*="lang"]'
      ];
      
      for (const selector of topRightSelectors) {
        try {
          const langElement = page.locator(selector).first();
          if (await langElement.isVisible({ timeout: 3000 })) {
            await langElement.click();
            await page.waitForTimeout(1000);
            
            const chineseOption = page.locator('text=/简体中文|中文|Chinese|zh-CN|zh_CN/i').first();
            if (await chineseOption.isVisible({ timeout: 2000 })) {
              await chineseOption.click();
              await page.waitForTimeout(2000);
              languageSwitched = true;
              console.log('通过右上角语言控件切换成功');
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      console.log('右上角语言控件查找失败');
    }
    
    // 方法2: 查找所有语言相关的选择器
    if (!languageSwitched) {
      const languageSelectors = [
        '[class*="language"]',
        '[class*="lang"]',
        '[id*="language"]',
        '[id*="lang"]',
        'select[name*="language"]',
        'select[name*="lang"]',
        '[aria-label*="语言"]',
        '[aria-label*="Language"]',
        '[title*="语言"]',
        '[title*="Language"]',
        '[data-testid*="language"]',
        '[data-testid*="lang"]'
      ];
      
      for (const selector of languageSelectors) {
        try {
          const langElements = await page.locator(selector).all();
          for (const langElement of langElements) {
            if (await langElement.isVisible({ timeout: 2000 })) {
              const tagName = await langElement.evaluate(el => el.tagName);
              
              if (tagName === 'SELECT') {
                await langElement.selectOption({ label: /简体中文|中文|Chinese|zh-CN|zh_CN/i });
                await page.waitForTimeout(2000);
                languageSwitched = true;
                console.log('通过下拉框切换语言成功');
                break;
              } else {
                await langElement.click();
                await page.waitForTimeout(1000);
                
                const chineseOption = page.locator('text=/简体中文|中文|Chinese|zh-CN|zh_CN/i').first();
                if (await chineseOption.isVisible({ timeout: 2000 })) {
                  await chineseOption.click();
                  await page.waitForTimeout(2000);
                  languageSwitched = true;
                  console.log('通过点击语言控件切换成功');
                  break;
                }
              }
            }
          }
          if (languageSwitched) break;
        } catch (e) {
          continue;
        }
      }
    }
    
    // 等待语言切换生效
    if (languageSwitched) {
      // 使用更宽松的等待策略
      try {
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      } catch (e) {
        console.log('等待domcontentloaded超时，继续执行:', e.message);
      }
      await page.waitForTimeout(3000);
      
      const newPageText = await page.textContent('body');
      let hasChineseNow = false;
      
      for (const keyword of chineseKeywords) {
        if (newPageText && newPageText.includes(keyword)) {
          hasChineseNow = true;
          break;
        }
      }
      
      if (hasChineseNow) {
        console.log('语言切换成功，菜单已显示为简体中文');
      } else {
        console.log('警告: 语言切换可能未生效，继续执行');
      }
    } else {
      console.log('警告: 未能找到语言切换控件，继续执行（菜单可能仍为英文）');
    }
  } else if (hasChineseMenu) {
    console.log('菜单已显示为简体中文，无需切换');
  } else {
    console.log('无法确定菜单语言，继续执行');
  }
}

module.exports = {
  login,
  verifyTenantName,
  switchToSimplifiedChinese
};

