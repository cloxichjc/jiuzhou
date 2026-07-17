"""游戏截图自查工具：标题 -> 招募 -> 拖拽上阵 -> 战斗 -> 奖励/结算。

用法（dev server 已在 5173 端口跑着时）：
    .venv-pw/bin/python tools/screenshot/shoot.py

截图输出到 tools/screenshot/out/。chromium 使用本机 playwright 缓存，
如路径不同可用 PW_CHROME 环境变量覆盖。
"""
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / 'tools' / 'screenshot' / 'out'
BASE_URL = os.environ.get('SHOOT_URL', 'http://127.0.0.1:5173')
CHROME = os.environ.get(
    'PW_CHROME',
    '/home/cjc/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=CHROME)
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        page.on(
            'console',
            lambda msg: print('[console.error]', msg.text[:200]) if msg.type == 'error' else None,
        )
        page.goto(BASE_URL)
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1800)
        page.screenshot(path=str(OUT_DIR / '01-title.png'))

        # 开始试炼（标题页主按钮，位于 y=690）
        page.mouse.click(195, 690)
        page.wait_for_timeout(2200)
        page.screenshot(path=str(OUT_DIR / '02-battle-ready.png'))

        # 招募两次
        page.mouse.click(304, 722)
        page.wait_for_timeout(600)
        page.mouse.click(304, 722)
        page.wait_for_timeout(600)
        page.screenshot(path=str(OUT_DIR / '03-recruited.png'))

        # 轻点第一张卡看详情
        page.mouse.click(58, 736)
        page.wait_for_timeout(800)
        page.screenshot(path=str(OUT_DIR / '03b-card-modal.png'))
        # 关闭详情（关闭按钮在面板底部 y=574）
        page.mouse.click(195, 574)
        page.wait_for_timeout(500)

        # 拖拽第一张 bench 卡到第 1 个上阵位（人口 1 时只有它解锁）
        page.mouse.move(58, 736)
        page.mouse.down()
        page.mouse.move(118, 500, steps=10)
        page.mouse.move(118, 432, steps=10)
        page.mouse.up()
        page.wait_for_timeout(800)
        page.screenshot(path=str(OUT_DIR / '04-deployed.png'))

        # 开始战斗，连拍
        page.mouse.click(304, 790)
        page.wait_for_timeout(2500)
        page.screenshot(path=str(OUT_DIR / '05-combat-a.png'))
        page.wait_for_timeout(3000)
        page.screenshot(path=str(OUT_DIR / '06-combat-b.png'))
        page.wait_for_timeout(5000)
        page.screenshot(path=str(OUT_DIR / '07-aftermath.png'))

        # 领取第一项奖励（三选一左卡 x=87,y=400）
        page.mouse.click(87, 400)
        page.wait_for_timeout(1500)
        page.screenshot(path=str(OUT_DIR / '08-after-reward.png'))

        browser.close()
    print(f'done: screenshots in {OUT_DIR}')


if __name__ == '__main__':
    sys.exit(main())
