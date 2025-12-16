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
    
    # 配置视频录制（始终录制）
    context = browser.new_context(
        viewport=None,  # 不使用固定viewport，由测试代码控制
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
    """在测试报告中添加视频和截图"""
    outcome = yield
    report = outcome.get_result()
    
    # 存储测试结果
    setattr(item, f"rep_{report.when}", report)
    
    # 如果是测试调用阶段（call），添加额外内容到报告
    if report.when == 'call':
        extras = getattr(report, 'extras', [])
        
        # 添加视频（如果存在）
        if hasattr(item, 'video_path'):
            try:
                from py.xml import html
                video_path = item.video_path
                video_path_obj = Path(video_path)
                if video_path_obj.exists():
                    # 将视频复制到报告目录中
                    report_dir = Path('playwright-report')
                    report_dir.mkdir(exist_ok=True)
                    video_name = video_path_obj.name
                    video_in_report = report_dir / video_name
                    import shutil
                    shutil.copy2(video_path_obj, video_in_report)
                    # 使用相对路径在HTML中引用
                    extras.append(html.p("操作视频:", style="font-weight: bold; margin-top: 10px;"))
                    extras.append(html.video(src=video_name, width="800", controls=True, style="margin: 10px 0; border: 1px solid #ccc;"))
            except Exception as e:
                print(f'⚠️  添加视频到报告失败: {e}')
        
        # 添加失败截图（如果存在）
        if report.failed and hasattr(item, 'screenshot_path'):
            try:
                from py.xml import html
                screenshot_path = item.screenshot_path
                screenshot_path_obj = Path(screenshot_path)
                if screenshot_path_obj.exists():
                    # 将截图复制到报告目录中
                    report_dir = Path('playwright-report')
                    report_dir.mkdir(exist_ok=True)
                    screenshot_name = f"{item.nodeid.replace('::', '_').replace('/', '_')}_screenshot.png"
                    screenshot_in_report = report_dir / screenshot_name
                    import shutil
                    shutil.copy2(screenshot_path_obj, screenshot_in_report)
                    # 使用相对路径在HTML中引用
                    extras.append(html.p("失败截图:", style="font-weight: bold; margin-top: 10px;"))
                    extras.append(html.img(src=screenshot_name, style="max-width: 800px; border: 1px solid #ccc; margin: 10px 0;"))
            except Exception as e:
                print(f'⚠️  添加截图到报告失败: {e}')
        
        report.extras = extras


def pytest_html_report_title(report):
    """自定义HTML报告标题"""
    report.title = "BOH自动化测试报告 - 完整测试用例列表"


def pytest_html_results_summary(prefix, summary, postfix):
    """自定义HTML报告摘要，确保显示成功/失败统计"""
    # pytest-html会自动生成统计信息，这个hook可以用来添加额外内容
    # 但默认情况下统计信息应该已经显示了
    pass


def pytest_html_results_table_header(cells):
    """自定义测试结果表格头部（pytest-html默认已包含，这里不修改）"""
    # pytest-html默认已经包含所有必要的列，不需要额外添加
    pass


def pytest_html_results_table_row(report, cells):
    """自定义测试结果表格行（pytest-html默认已包含，这里不修改）"""
    # pytest-html默认已经包含所有必要的信息，不需要额外添加
    pass


@pytest.hookimpl(trylast=True)
def pytest_sessionfinish(session, exitstatus):
    """
    测试会话结束后，自动打开HTML报告
    """
    report_path = Path('playwright-report/index.html')
    
    if report_path.exists():
        report_abs_path = report_path.absolute()
        print('\n' + '='*80)
        print('📊 测试报告已生成！')
        print(f'📁 报告路径: {report_abs_path}')
        print('='*80 + '\n')
        
        # 根据操作系统自动打开报告
        try:
            if sys.platform == 'darwin':  # macOS
                subprocess.run(['open', str(report_abs_path)], check=False)
                print('✅ 已在浏览器中打开测试报告\n')
            elif sys.platform == 'win32':  # Windows
                os.startfile(str(report_abs_path))
                print('✅ 已在浏览器中打开测试报告\n')
            elif sys.platform.startswith('linux'):  # Linux
                subprocess.run(['xdg-open', str(report_abs_path)], check=False)
                print('✅ 已在浏览器中打开测试报告\n')
            else:
                print(f'⚠️  请手动打开报告: {report_abs_path}\n')
        except Exception as e:
            print(f'⚠️  自动打开报告失败: {e}')
            print(f'   请手动打开报告: {report_abs_path}\n')
    else:
        print('\n⚠️  未找到测试报告文件\n')
