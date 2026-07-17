"""全自动通关验证：招募/上阵/开战/领奖励循环打满五波，捕获结算页。"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'tools' / 'screenshot' / 'out'
CHROME = '/home/cjc/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'

SLOTS = [(118, 432), (196, 386), (274, 432)]
CARDS = [(58 + (i % 3) * 82, 736 + (i // 3) * 78) for i in range(6)]


def deploy_all(page) -> None:
    """把 bench 前几张卡依次拖进可用阵位。"""
    for card, slot in zip(CARDS, SLOTS):
        page.mouse.move(*card)
        page.mouse.down()
        page.mouse.move(slot[0], slot[1] + 60, steps=6)
        page.mouse.move(*slot, steps=6)
        page.mouse.up()
        page.wait_for_timeout(350)


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=CHROME)
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        page.on('pageerror', lambda e: print('[pageerror]', str(e)[:300]))
        page.goto('http://127.0.0.1:5173')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(1500)
        page.mouse.click(195, 690)
        page.wait_for_timeout(2000)

        for wave in range(1, 6):
            print(f'== wave {wave} ==')
            # 招募到金币不足为止（最多 4 次）
            for _ in range(4):
                page.mouse.click(304, 722)
                page.wait_for_timeout(400)
            deploy_all(page)
            page.screenshot(path=str(OUT / f'run-w{wave}-ready.png'))

            page.mouse.click(304, 790)  # 开战
            page.wait_for_timeout(22000)  # 等战斗结算完毕
            page.screenshot(path=str(OUT / f'run-w{wave}-result.png'))

            if wave < 5:
                # 领奖励：优先右卡（多为扩充人口），其次左卡
                page.mouse.click(303, 400)
                page.wait_for_timeout(800)
                page.screenshot(path=str(OUT / f'run-w{wave}-reward.png'))

        page.wait_for_timeout(1500)
        page.screenshot(path=str(OUT / 'run-final.png'))
        browser.close()
    print('done')


if __name__ == '__main__':
    sys.exit(main())
