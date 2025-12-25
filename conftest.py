"""
Pytest配置文件
为测试提供Playwright浏览器和页面fixtures
"""

import pytest
import os
import subprocess
import sys
from pathlib import Path
from playwright.sync_api import Playwright, Browser, BrowserContext, Page


# pytest hook将在下面统一处理


@pytest.fixture(scope="session")
def playwright():
    """创建Playwright实例"""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        yield p


@pytest.fixture(scope="session")
def browser(playwright: Playwright):
    """创建浏览器实例（Chrome）"""
    import os
    # CI环境使用headless模式，本地开发使用headed模式
    is_ci = os.getenv('CI', 'false').lower() == 'true'
    browser = playwright.chromium.launch(
        headless=is_ci,  # CI环境使用headless，本地显示浏览器窗口
        channel="chrome" if not is_ci else None  # CI环境不使用系统Chrome，使用Playwright自带的
    )
    yield browser
    browser.close()


@pytest.fixture(scope="function")
def context(browser: Browser, request):
    """创建浏览器上下文，配置视频录制和截图"""
    from pathlib import Path
    
    # 创建测试结果目录
    test_results_dir = Path('test-results')
    test_results_dir.mkdir(exist_ok=True)
    
    # 为每个测试创建独立的目录
    test_name = request.node.name.replace('/', '_').replace('\\', '_')
    test_dir = test_results_dir / test_name
    test_dir.mkdir(exist_ok=True)
    
    # CI环境使用固定viewport，本地环境由测试代码控制
    is_ci = os.getenv('CI', 'false').lower() == 'true'
    viewport_config = {'width': 1920, 'height': 1080} if is_ci else None
    
    # 配置视频录制（始终录制）
    context = browser.new_context(
        viewport=viewport_config,  # CI环境使用固定viewport，本地环境由测试代码控制
        record_video_dir=str(test_dir),  # 视频保存目录
        record_video_size={'width': 1920, 'height': 1080}  # 视频尺寸
    )
    
    # 保存测试目录路径到request中，以便后续使用
    request.node.test_dir = test_dir
    
    yield context
    
    # 关闭context时，视频会自动保存
    context.close()
    
    # 查找保存的视频文件（Playwright会自动生成文件名）
    video_files = list(test_dir.glob('*.webm'))
    if video_files:
        # 使用最新的视频文件
        video_file = max(video_files, key=lambda p: p.stat().st_mtime)
        # 使用绝对路径或相对于报告目录的路径
        request.node.video_path = str(video_file)
    else:
        # 如果没有找到，尝试使用默认名称
        default_video = test_dir / 'video.webm'
        if default_video.exists():
            request.node.video_path = str(default_video)


@pytest.fixture(scope="function")
def page(context: BrowserContext, request):
    """创建页面对象，支持截图"""
    page = context.new_page()
    yield page
    
    # 测试结束后，如果失败则截图
    if hasattr(request.node, 'rep_call') and request.node.rep_call.failed:
        try:
            test_dir = getattr(request.node, 'test_dir', None)
            if test_dir:
                screenshot_path = test_dir / 'screenshot.png'
            else:
                test_results_dir = Path('test-results')
                test_name = request.node.name.replace('/', '_').replace('\\', '_')
                screenshot_path = test_results_dir / test_name / 'screenshot.png'
                screenshot_path.parent.mkdir(parents=True, exist_ok=True)
            
            page.screenshot(path=str(screenshot_path), full_page=True)
            # 保存截图路径到request中（使用绝对路径）
            request.node.screenshot_path = str(screenshot_path)
            print(f'📸 失败截图已保存: {screenshot_path}')
        except Exception as e:
            print(f'⚠️  截图保存失败: {e}')
    
    page.close()


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """在测试报告中添加视频和截图（Allure）"""
    outcome = yield
    report = outcome.get_result()
    
    # 存储测试结果
    setattr(item, f"rep_{report.when}", report)
    
    # 如果是测试调用阶段（call），添加Allure附件
    if report.when == 'call':
        # 添加视频到Allure报告
        if hasattr(item, 'video_path'):
            try:
                import allure
                video_path = item.video_path
                video_path_obj = Path(video_path)
                if video_path_obj.exists():
                    # 将视频复制到allure-results目录
                    allure_results_dir = Path('allure-results')
                    allure_results_dir.mkdir(exist_ok=True)
                    video_name = video_path_obj.name
                    allure_video_path = allure_results_dir / video_name
                    import shutil
                    shutil.copy2(video_path_obj, allure_video_path)
                    # 添加到Allure附件
                    allure.attach.file(
                        str(allure_video_path),
                        name="操作视频",
                        attachment_type=allure.attachment_type.WEBM
                    )
            except Exception as e:
                print(f'⚠️  添加视频到Allure报告失败: {e}')
        
        # 添加失败截图到Allure报告
        if report.failed and hasattr(item, 'screenshot_path'):
            try:
                import allure
                screenshot_path = item.screenshot_path
                screenshot_path_obj = Path(screenshot_path)
                if screenshot_path_obj.exists():
                    # 读取截图文件并附加到Allure
                    with open(screenshot_path_obj, 'rb') as f:
                        allure.attach(
                            f.read(),
                            name="失败截图",
                            attachment_type=allure.attachment_type.PNG
                        )
            except Exception as e:
                print(f'⚠️  添加截图到Allure报告失败: {e}')


@pytest.hookimpl(trylast=True)
def pytest_sessionfinish(session, exitstatus):
    """
    测试会话结束后，生成Allure报告
    """
    allure_results_dir = Path('allure-results')
    allure_report_dir = Path('allure-report')
    
    if allure_results_dir.exists() and list(allure_results_dir.glob('*.json')):
        print('\n' + '='*80)
        print('📊 Allure测试结果已生成！')
        print(f'📁 结果目录: {allure_results_dir.absolute()}')
        print('='*80 + '\n')
        
        # 尝试生成Allure报告（如果安装了allure命令行工具）
        try:
            result = subprocess.run(
                ['allure', 'generate', str(allure_results_dir), '-o', str(allure_report_dir), '--clean'],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0 and allure_report_dir.exists():
                report_index = allure_report_dir / 'index.html'
                if report_index.exists():
                    print('✅ Allure报告已生成！')
                    print(f'📁 报告目录: {allure_report_dir.absolute()}')
                    
                    # 使用allure open命令打开报告（会启动本地HTTP服务器）
                    try:
                        print('🚀 正在启动Allure服务器...')
                        # allure open会在后台启动服务器并打开浏览器
                        subprocess.Popen(
                            ['allure', 'open', str(allure_report_dir)],
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL
                        )
                        print('✅ 已在浏览器中打开Allure报告（通过本地服务器）\n')
                        print('💡 提示: 如果浏览器未自动打开，请使用以下命令:')
                        print(f'   allure open {allure_report_dir}\n')
                    except Exception as e:
                        print(f'⚠️  自动打开报告失败: {e}')
                        print(f'   请使用以下命令手动打开:')
                        print(f'   allure open {allure_report_dir}\n')
                        print(f'   或者直接打开文件（可能显示loading）:')
                        print(f'   {report_index.absolute()}\n')
                else:
                    print('⚠️  Allure报告生成失败，但结果文件已保存\n')
                    print('💡 提示: 使用以下命令生成并打开报告:')
                    print(f'   allure generate {allure_results_dir} -o {allure_report_dir} --clean')
                    print(f'   allure open {allure_report_dir}\n')
            else:
                print('⚠️  Allure命令行工具未安装，无法自动生成报告\n')
                print('💡 提示: 使用以下命令生成并打开报告:')
                print(f'   allure generate {allure_results_dir} -o {allure_report_dir} --clean')
                print(f'   allure open {allure_report_dir}\n')
        except FileNotFoundError:
            print('⚠️  Allure命令行工具未安装\n')
            print('💡 提示: 安装Allure后使用以下命令生成并打开报告:')
            print(f'   allure generate {allure_results_dir} -o {allure_report_dir} --clean')
            print(f'   allure open {allure_report_dir}\n')
        except subprocess.TimeoutExpired:
            print('⚠️  生成Allure报告超时\n')
    else:
        print('\n⚠️  未找到Allure测试结果文件\n')
