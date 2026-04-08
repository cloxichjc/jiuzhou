# WeChat Mini Game Build

## Prerequisites

- Cocos Creator 3.8
- WeChat DevTools
- Node.js and npm

## Build Steps

1. Open the project in Cocos Creator.
2. Choose `Project -> Build`.
3. Select `WeChat Mini Game`.
4. Set output directory to `build/wechatgame`.
5. Click `Build`.
6. Open the output directory in WeChat DevTools.
7. Run a smoke test that covers:
   - Main menu load
   - Hero selection
   - Stage 1 battle start
   - Stage clear and next-stage unlock

## Release Checklist

- Verify local save survives app restart.
- Verify all five stages are reachable in sequence.
- Verify the hero skill button only fires once per battle.
- Verify the chapter ending appears after stage 5.
- Verify the game remains playable without network access.
