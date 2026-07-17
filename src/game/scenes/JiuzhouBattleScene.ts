import Phaser from 'phaser';
import { createBattleRuntime, stepBattleRuntime, summarizeBattleRuntime } from '../core/battle';
import {
  autoMergeRunState,
  applyRewardChoice,
  assignBoardSlot,
  clearBoardSlot,
  getDeployedUnits,
  advanceAfterVictory,
  initialRunState,
} from '../core/run-state';
import { createBenchUnit, getBenchUnitOrThrow, getUnitDefinitionOrThrow } from '../core/helpers';
import { waves } from '../data/waves';
import { buildBenchCardModel } from '../ui/bench';
import { buildUnitCardLines } from '../ui/card-modal';
import { createHud, updateHud, type HudRefs } from '../ui/hud';
import { buildRewardPanelModel } from '../ui/reward-panel';
import { preloadSharedAssets } from '../ui/assets';
import { playDefeat, playDeploy, playHit, playUiClick, playVictory } from '../ui/sfx';
import {
  drawInkDivider,
  drawPanel,
  inkText,
  makeChip,
  makeHpBar,
  makeInkButton,
  THEME,
  FONT_SIZE,
  type HpBarHandle,
} from '../ui/theme';
import type {
  BattleActor,
  BattleEvent,
  BattleRuntimeState,
  BattleSimulationResult,
  BenchUnit,
  RewardChoice,
  RunState,
} from '../types';

interface SlotAnchor {
  x: number;
  y: number;
}

/** 我方上阵位（与 battle.ts 的 ALLY_START_POSITIONS 一致）。 */
const BOARD_SLOT_POSITIONS: SlotAnchor[] = [
  { x: 118, y: 432 },
  { x: 196, y: 386 },
  { x: 274, y: 432 },
];

/** 敌方预览位（与 battle.ts 的 ENEMY_START_POSITIONS 一致）。 */
const ENEMY_PREVIEW_POSITIONS: SlotAnchor[] = [
  { x: 96, y: 258 },
  { x: 192, y: 238 },
  { x: 288, y: 258 },
];

const RECRUIT_COST = 15;

interface ActorToken {
  container: Phaser.GameObjects.Container;
  hp: HpBarHandle;
  slowChip: Phaser.GameObjects.Container;
  dissolving: boolean;
}

/** 战斗场景：布局重排 + 棋子化单位 + 水墨特效。 */
export class JiuzhouBattleScene extends Phaser.Scene {
  private state: RunState = structuredClone(initialRunState);
  private hud?: HudRefs;
  private slotLayer?: Phaser.GameObjects.Container;
  private benchLayer?: Phaser.GameObjects.Container;
  private effectsLayer?: Phaser.GameObjects.Container;
  private overlayLayer?: Phaser.GameObjects.Container;
  private battleInfo?: Phaser.GameObjects.Text;
  private enemyInfo?: Phaser.GameObjects.Text;
  private recruitButton?: Phaser.GameObjects.Container;
  private startButton?: Phaser.GameObjects.Container;
  private recruitCursor = 0;
  private resolvingBattle = false;
  private runtimeState?: BattleRuntimeState;
  private actorTokens = new Map<string, ActorToken>();

  constructor() {
    super('JiuzhouBattleScene');
  }

  preload(): void {
    preloadSharedAssets(this);
  }

  init(): void {
    this.state = structuredClone(initialRunState);
    this.runtimeState = undefined;
    this.overlayLayer = undefined;
    this.recruitCursor = 0;
    this.resolvingBattle = false;
    this.actorTokens = new Map();
  }

  create(): void {
    this.input.setTopOnly(false);
    this.cameras.main.fadeIn(200, 24, 22, 18);

    this.add.image(195, 422, 'bg-battle').setDisplaySize(390, 844);
    this.hud = createHud(this, this.state);

    this.slotLayer = this.add.container(0, 0);
    this.benchLayer = this.add.container(0, 0);
    this.effectsLayer = this.add.container(0, 0);

    this.createInfoText();
    this.createButtons();
    this.refreshScene('拖拽战团卡牌到战场圆阵上阵。');
    this.showWaveBanner(`第 ${this.state.waveNumber} 波 · ${waves[0]?.title ?? '乱世初会'}`);
  }

  update(_time: number, delta: number): void {
    if (!this.resolvingBattle || !this.runtimeState) {
      return;
    }

    const step = stepBattleRuntime(this.runtimeState, Math.min(delta, 120));
    this.runtimeState = step.state;
    for (const event of step.events) {
      this.spawnBattleEventFx(event);
    }
    this.syncActorTokens();
    this.refreshWaveInfo();

    if (this.runtimeState.status !== 'ongoing') {
      this.finishRealtimeBattle();
    }
  }

  // ---------------------------------------------------------------- 静态区域

  private createInfoText(): void {
    drawPanel(this, { x: 195, y: 590, width: 356, height: 56, fillAlpha: 0.86, borderWidth: 1.5 });
    this.enemyInfo = inkText(this, 24, 578, '', { size: FONT_SIZE.small, bold: true }).setOrigin(0, 0.5);
    this.battleInfo = inkText(this, 24, 602, '', {
      size: FONT_SIZE.tiny,
      color: THEME.inkLight,
      wordWrapWidth: 340,
      align: 'left',
    }).setOrigin(0, 0.5);
  }

  private createButtons(): void {
    this.recruitButton = makeInkButton(this, {
      x: 318,
      y: 722,
      width: 104,
      height: 44,
      label: `招募 ·${RECRUIT_COST}`,
      fontSize: FONT_SIZE.small,
      onTap: () => this.recruitUnit(),
    });
    this.startButton = makeInkButton(this, {
      x: 318,
      y: 790,
      width: 104,
      height: 52,
      label: '开战',
      fill: THEME.cinnabar,
      onTap: () => this.runBattle(),
    });
    this.recruitButton.setDepth(14);
    this.startButton.setDepth(14);
  }

  private refreshScene(message?: string): void {
    if (this.hud) {
      updateHud(this.hud, this.state);
    }
    this.refreshSlots();
    this.refreshBench();
    this.refreshWaveInfo(message);
    this.refreshButtonState();
  }

  private refreshWaveInfo(message?: string): void {
    const wave = waves.find((entry) => entry.id === `wave-${this.state.waveNumber}`);
    const runtimeSummary = this.runtimeState
      ? `  ·  敌余 ${this.runtimeState.actors.filter((a) => a.team === 'enemy' && a.currentHealth > 0).length} 我余 ${this.runtimeState.actors.filter((a) => a.team === 'ally' && a.currentHealth > 0).length}`
      : '';
    this.enemyInfo?.setText(`当前目标：${wave?.title ?? '南淮已靖'}${wave ? ` · 敌势 ${wave.powerScore}` : ''}${runtimeSummary}`);
    if (message !== undefined) {
      this.battleInfo?.setText(message);
    }
  }

  // ---------------------------------------------------------------- 棋子

  /** 水墨棋子：墨环框 + 立绘 + 名字。 */
  private makeUnitToken(options: {
    x: number;
    y: number;
    artKey: string;
    frameKey: 'frame-ally' | 'frame-enemy';
    name: string;
    star?: number;
    size?: number;
  }): Phaser.GameObjects.Container {
    const size = options.size ?? 64;
    const container = this.add.container(options.x, options.y);

    const frame = this.add.image(0, 0, options.frameKey).setDisplaySize(size, size).setAlpha(0.92);
    const portrait = this.add.image(0, 0, options.artKey).setDisplaySize(size * 0.78, size * 0.78);
    const name = inkText(this, 0, size / 2 + 8, options.name, {
      size: FONT_SIZE.tiny,
      bold: true,
      color: options.frameKey === 'frame-ally' ? THEME.indigo : THEME.damage,
    });
    container.add([frame, portrait, name]);

    if (options.star && options.star > 1) {
      const star = inkText(this, size / 2 - 6, -size / 2 + 6, `${options.star}★`, {
        size: FONT_SIZE.tiny,
        color: THEME.gold,
        bold: true,
      });
      container.add(star);
    }

    return container;
  }

  private refreshSlots(): void {
    this.slotLayer?.removeAll(true);
    if (!this.slotLayer || this.resolvingBattle) {
      return;
    }

    // 敌方预览
    const wave = waves.find((entry) => entry.id === `wave-${this.state.waveNumber}`);
    wave?.enemies.slice(0, 3).forEach((enemy, index) => {
      const pos = ENEMY_PREVIEW_POSITIONS[index];
      const token = this.makeUnitToken({
        x: pos.x,
        y: pos.y,
        artKey: enemy.artKey ?? 'enemy-melee',
        frameKey: 'frame-enemy',
        name: enemy.name,
        size: 58,
      });
      this.slotLayer?.add(token);
    });

    drawInkDivider(this, 195, 330, 240);

    // 我方上阵槽
    BOARD_SLOT_POSITIONS.forEach((slot, index) => {
      const unlocked = index < this.state.population;
      const occupantId = this.state.boardSlots[index];

      if (!occupantId) {
        const ring = this.add.graphics();
        ring.lineStyle(2, unlocked ? THEME.inkLight : THEME.hpBack, unlocked ? 0.8 : 0.6);
        ring.strokeCircle(slot.x, slot.y, 26);
        const hint = inkText(this, slot.x, slot.y, unlocked ? '上阵' : '封', {
          size: FONT_SIZE.tiny,
          color: unlocked ? THEME.inkLight : THEME.hpBack,
        });
        this.slotLayer?.add([ring, hint]);
        return;
      }

      const occupant = getBenchUnitOrThrow(this.state.bench, occupantId);
      const unitDef = getUnitDefinitionOrThrow(occupant.unitId);
      const token = this.makeUnitToken({
        x: slot.x,
        y: slot.y,
        artKey: `unit-${occupant.unitId}`,
        frameKey: 'frame-ally',
        name: unitDef.name,
        star: occupant.star,
      });
      this.slotLayer?.add(token);
      // 点已上阵单位下阵
      token.setSize(64, 64);
      token.setInteractive({ useHandCursor: true }).on('pointerup', () => {
        if (this.resolvingBattle || this.overlayLayer) return;
        this.state = clearBoardSlot(this.state, index);
        this.refreshScene(`${unitDef.name} 已下阵待命。`);
      });
    });
  }

  // ---------------------------------------------------------------- bench

  private refreshBench(): void {
    this.benchLayer?.removeAll(true);
    if (!this.benchLayer) {
      return;
    }

    this.benchLayer.add(
      inkText(this, 24, 662, '待上阵', { size: FONT_SIZE.body, bold: true }).setOrigin(0, 0.5)
    );
    this.benchLayer.add(
      inkText(this, 96, 663, '拖拽上阵 · 轻点看详情', { size: FONT_SIZE.tiny, color: THEME.inkLight }).setOrigin(0, 0.5)
    );

    this.state.bench.slice(0, 6).forEach((benchUnit, index) => {
      this.benchLayer?.add(this.createBenchCard(benchUnit, index));
    });
  }

  private createBenchCard(benchUnit: BenchUnit, index: number): Phaser.GameObjects.Container {
    const model = buildBenchCardModel(benchUnit);
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = 58 + column * 82;
    const y = 736 + row * 78;
    const deployed = this.state.boardSlots.includes(benchUnit.instanceId);

    const container = this.add.container(x, y);
    const panel = drawPanel(this, {
      x: 0,
      y: 0,
      width: 72,
      height: 68,
      fillAlpha: deployed ? 0.6 : 0.94,
      border: deployed ? THEME.hpBack : THEME.ink,
      borderWidth: 1.5,
      radius: 8,
    });
    const portrait = this.add.image(0, -12, model.artKey).setDisplaySize(36, 36);
    const title = inkText(this, 0, 14, model.title, { size: FONT_SIZE.tiny, bold: true });
    const star = inkText(this, -24, -24, `${model.star}★`, { size: FONT_SIZE.tiny, color: THEME.gold, bold: true });
    container.add([panel, portrait, title, star]);

    if (deployed) {
      container.add(inkText(this, 24, -24, '阵', { size: FONT_SIZE.tiny, color: THEME.indigo, bold: true }));
    }

    container.setSize(72, 68);
    container.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(container);

    // 注意：可拖拽对象上点击只会触发 dragstart/dragend（没有 pointerup），
    // 所以「轻点看详情」按 dragend 里位移 < 8px 判定。
    container.on('dragstart', () => {
      if (this.resolvingBattle || this.overlayLayer) return;
      container.setDepth(40).setScale(1.06);
    });
    container.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.resolvingBattle || this.overlayLayer) return;
      container.x = dragX;
      container.y = dragY;
    });
    container.on('dragend', (pointer: Phaser.Input.Pointer) => {
      container.setDepth(0).setScale(1);
      if (this.resolvingBattle || this.overlayLayer) {
        this.refreshScene();
        return;
      }

      const moved = Phaser.Math.Distance.Between(pointer.downX, pointer.downY, pointer.x, pointer.y);
      if (moved < 8) {
        this.showCard(benchUnit);
        this.refreshScene();
        return;
      }

      const drop = this.findHoveredSlot(pointer.x, pointer.y);
      if (drop.locked) {
        this.refreshScene('该阵位未开，先扩充人口。');
        return;
      }
      if (drop.slotIndex >= 0) {
        playDeploy(this);
        this.state = assignBoardSlot(this.state, benchUnit.instanceId, drop.slotIndex);
        this.refreshScene(`已将 ${model.title} 布置到第 ${drop.slotIndex + 1} 格。`);
      } else {
        this.refreshScene();
      }
    });

    return container;
  }

  /** 拖放落点：只接受已解锁槽位；压在锁定槽上单独回报。 */
  private findHoveredSlot(x: number, y: number): { slotIndex: number; locked: boolean } {
    for (let index = 0; index < BOARD_SLOT_POSITIONS.length; index += 1) {
      const slot = BOARD_SLOT_POSITIONS[index];
      if (Phaser.Math.Distance.Between(x, y, slot.x, slot.y) <= 40) {
        return index < this.state.population ? { slotIndex: index, locked: false } : { slotIndex: -1, locked: true };
      }
    }
    return { slotIndex: -1, locked: false };
  }

  private recruitUnit(): void {
    if (this.overlayLayer || this.resolvingBattle) {
      return;
    }
    if (this.state.gold < RECRUIT_COST) {
      this.refreshWaveInfo('金币不足，无法招募。');
      return;
    }

    const unitId = this.state.unlockedUnitIds[this.recruitCursor % this.state.unlockedUnitIds.length];
    this.recruitCursor += 1;
    const beforeCount = this.state.bench.length;
    this.state = autoMergeRunState({
      ...this.state,
      gold: this.state.gold - RECRUIT_COST,
      bench: [...this.state.bench, createBenchUnit(unitId)],
    });
    const merged = this.state.bench.length <= beforeCount;
    this.refreshScene(merged ? '三合一触发，战团已经升星。' : `招募了 ${getUnitDefinitionOrThrow(unitId).name}。`);
  }

  // ---------------------------------------------------------------- 实时战斗

  private runBattle(): void {
    if (this.overlayLayer || this.resolvingBattle) {
      return;
    }

    const wave = waves.find((entry) => entry.id === `wave-${this.state.waveNumber}`);
    if (!wave) {
      this.refreshWaveInfo('南淮已靖，后会有期。');
      return;
    }

    const deployed = getDeployedUnits(this.state);
    if (deployed.length === 0) {
      this.refreshWaveInfo('先拖拽至少一名战团到战场上阵。');
      return;
    }

    this.runtimeState = createBattleRuntime({
      alliedUnits: deployed,
      enemyWaveId: wave.id,
      ownedTotemIds: this.state.ownedTotemIds,
    });

    this.resolvingBattle = true;
    this.state = { ...this.state, usedPopulation: deployed.length };
    this.slotLayer?.removeAll(true);
    this.effectsLayer?.removeAll(true);
    this.spawnActorTokens();
    this.refreshWaveInfo('战团交锋中。');
    this.refreshButtonState();
  }

  /** 战斗开始：为每个 actor 建持久棋子，之后每帧只改位置/血量。 */
  private spawnActorTokens(): void {
    this.actorTokens.clear();
    if (!this.runtimeState) {
      return;
    }

    for (const actor of this.runtimeState.actors) {
      const isAlly = actor.team === 'ally';
      const artKey = isAlly && actor.unitId ? `unit-${actor.unitId}` : (actor.artKey ?? 'enemy-melee');
      const container = this.add.container(actor.x, actor.y);

      const token = this.makeUnitToken({
        x: 0,
        y: 0,
        artKey,
        frameKey: isAlly ? 'frame-ally' : 'frame-enemy',
        name: actor.name,
        size: 56,
      });
      const hp = makeHpBar(this, 0, -40, 40, isAlly ? THEME.indigo : THEME.damage, 5);
      const slowChip = makeChip(this, 24, -40, '缓', THEME.indigo, FONT_SIZE.tiny - 1);
      slowChip.setVisible(false);

      container.add([token, hp.container, slowChip]);
      this.effectsLayer?.add(container);
      this.actorTokens.set(actor.id, { container, hp, slowChip, dissolving: false });
    }
  }

  private syncActorTokens(): void {
    if (!this.runtimeState) {
      return;
    }

    for (const actor of this.runtimeState.actors) {
      const token = this.actorTokens.get(actor.id);
      if (!token) {
        continue;
      }

      token.container.setPosition(actor.x, actor.y);
      token.hp.setRatio(Math.max(0, actor.currentHealth) / actor.maxHealth);
      token.slowChip.setVisible((actor.slowUntilMs ?? 0) > this.runtimeState.elapsedMs && actor.currentHealth > 0);

      if (actor.currentHealth <= 0 && !token.dissolving) {
        token.dissolving = true;
        this.tweens.add({
          targets: token.container,
          scale: 0.4,
          alpha: 0,
          duration: 420,
          ease: 'Quad.easeIn',
          onComplete: () => token.container.destroy(),
        });
      }
    }
  }

  private spawnBattleEventFx(event: BattleEvent): void {
    if (!this.effectsLayer || !this.runtimeState) {
      return;
    }

    const attacker = this.runtimeState.actors.find((actor) => actor.id === event.actorId);
    const allyDealt = attacker?.team === 'ally';
    const numberColor = allyDealt ? THEME.cinnabar : THEME.inkDeep;

    // 墨痕特效
    if (event.kind === 'melee') {
      this.flashFxImage('ink-slash', event.toX, event.toY, 72, 36);
    } else if (event.kind === 'spell') {
      this.flashFxImage('ink-bloom', event.toX, event.toY, 72, 72);
    } else {
      const dot = this.add.circle(event.fromX, event.fromY, 4, THEME.indigo, 0.9);
      this.effectsLayer.add(dot);
      this.tweens.add({
        targets: dot,
        x: event.toX,
        y: event.toY,
        duration: 180,
        onComplete: () => {
          this.flashFxImage('ink-bloom', event.toX, event.toY, 48, 48);
          dot.destroy();
        },
      });
    }

    // 伤害数字（暴击放大变朱砂）
    const isCrit = event.effect === 'crit';
    const damage = inkText(this, event.toX, event.toY - 34, `${event.amount}`, {
      size: isCrit ? 26 : 18,
      bold: true,
      color: isCrit ? THEME.cinnabar : numberColor,
    });
    this.effectsLayer.add(damage);
    this.tweens.add({
      targets: damage,
      y: event.toY - 62,
      alpha: 0,
      duration: 560,
      onComplete: () => damage.destroy(),
    });

    if (event.effect) {
      const label = inkText(this, event.toX, event.toY + 30, this.effectLabel(event.effect), {
        size: FONT_SIZE.tiny,
        color: THEME.paper,
      });
      label.setBackgroundColor(Phaser.Display.Color.IntegerToColor(THEME.ink).rgba);
      label.setPadding(4, 2, 4, 2);
      this.effectsLayer.add(label);
      this.tweens.add({
        targets: label,
        alpha: 0,
        delay: 420,
        duration: 260,
        onComplete: () => label.destroy(),
      });
    }

    if (isCrit || event.effect === 'charge') {
      this.cameras.main.shake(80, 0.0022);
    }
    playHit(this, isCrit || event.effect === 'charge');
  }

  /** 墨痕图片闪现：淡入放大后淡出销毁。注意 tween 的 scale 会覆盖 setDisplaySize 换算出的缩放，必须按倍率相对缩放。 */
  private flashFxImage(key: string, x: number, y: number, width: number, height: number): void {
    const img = this.add.image(x, y, key).setDisplaySize(width, height).setAlpha(0);
    const baseScaleX = img.scaleX;
    const baseScaleY = img.scaleY;
    this.effectsLayer?.add(img);
    this.tweens.add({
      targets: img,
      alpha: 0.9,
      scaleX: baseScaleX * 1.12,
      scaleY: baseScaleY * 1.12,
      duration: 130,
      yoyo: true,
      hold: 80,
      onComplete: () => img.destroy(),
    });
  }

  private effectLabel(effect: NonNullable<BattleEvent['effect']>): string {
    if (effect === 'crit') return '虎牙破阵';
    if (effect === 'slow') return '苍狼祝祷';
    if (effect === 'charge') return '雷厉风行';
    return '风羽回旋';
  }

  private finishRealtimeBattle(): void {
    if (!this.runtimeState) {
      return;
    }

    const summary = summarizeBattleRuntime(this.runtimeState);
    this.resolvingBattle = false;
    this.runtimeState = undefined;

    for (const token of this.actorTokens.values()) {
      token.container.destroy();
    }
    this.actorTokens.clear();

    if (summary.outcome === 'victory') {
      this.state = advanceAfterVictory(this.state);
      playVictory(this);
      this.refreshScene();
      if (this.state.waveNumber > waves.length) {
        this.showResultOverlay('胜', '南淮已靖', '你已经击破全部五波来敌，乱世的第一页就此翻过。');
        return;
      }
      this.showWaveBanner(`第 ${this.state.waveNumber} 波 · ${waves.find((wave) => wave.id === `wave-${this.state.waveNumber}`)?.title ?? ''}`);
      this.showRewards(`${summary.waveLabel} 已击破。敌势 ${summary.enemyPower.toFixed(0)}，我方战势 ${summary.alliedPower.toFixed(0)}。`);
      return;
    }

    this.state = { ...this.state, health: summary.remainingHealth };
    playDefeat(this);
    this.refreshScene();
    this.showResultOverlay('败', '战团折戟', `${summary.waveLabel} 失利。整军再来，乱世还长。`);
  }

  // ---------------------------------------------------------------- 面板（奖励/详情/结算）

  private showRewards(message: string): void {
    this.clearOverlay();
    this.refreshWaveInfo(message);

    const model = buildRewardPanelModel({
      waveNumber: this.state.waveNumber - 1,
      unlockedUnitIds: this.state.unlockedUnitIds,
      ownedTotemIds: this.state.ownedTotemIds,
    });

    const overlay = this.add.container(0, 0).setDepth(60);
    overlay.add(drawPanel(this, { x: 195, y: 400, width: 344, height: 400, borderWidth: 2 }));
    overlay.add(inkText(this, 195, 238, model.title, { size: FONT_SIZE.heading, bold: true }));
    overlay.add(
      inkText(this, 195, 272, '三选一，壮大战团', { size: FONT_SIZE.small, color: THEME.inkLight })
    );

    model.choices.forEach((choice, index) => {
      overlay.add(this.createRewardCard(choice, 195 + (index - 1) * 108, 400));
    });

    this.overlayLayer = overlay;
  }

  private createRewardCard(
    choice: RewardChoice & { artKey?: string; chipText?: string; theme?: string },
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.add(drawPanel(this, { x: 0, y: 0, width: 100, height: 210, borderWidth: 1.5, radius: 8 }));

    const chipColor = choice.theme === 'totem' ? THEME.indigo : choice.theme === 'economy' ? THEME.gold : THEME.cinnabar;
    container.add(this.add.image(0, -68, choice.artKey ?? 'ink-bloom').setDisplaySize(52, 52));
    container.add(inkText(this, 0, -26, choice.label, { size: FONT_SIZE.small, bold: true, wordWrapWidth: 88 }));
    container.add(makeChip(this, 0, 4, choice.chipText ?? '', chipColor, FONT_SIZE.tiny - 1));
    container.add(
      inkText(this, 0, 56, choice.description, {
        size: FONT_SIZE.tiny,
        color: THEME.inkLight,
        wordWrapWidth: 84,
      })
    );

    container.setSize(100, 210);
    container.setInteractive({ useHandCursor: true }).on('pointerup', () => this.pickReward(choice));
    return container;
  }

  private pickReward(choice: RewardChoice): void {
    playUiClick(this);
    const before = this.state.bench.length;
    this.state = applyRewardChoice(this.state, choice);
    this.clearOverlay();
    const merged = this.state.bench.length < before + (choice.kind === 'unit' ? 1 : 0);
    this.refreshScene(merged ? `获得 ${choice.label}，并触发三合一升星。` : `获得 ${choice.label}。`);
  }

  private showCard(unit: BenchUnit): void {
    this.clearOverlay();

    const lines = buildUnitCardLines(unit.unitId, unit.star);
    const overlay = this.add.container(0, 0).setDepth(70);
    overlay.add(drawPanel(this, { x: 195, y: 400, width: 320, height: 390, borderWidth: 2 }));
    overlay.add(this.add.image(120, 278, `unit-${unit.unitId}`).setDisplaySize(84, 84));
    overlay.add(inkText(this, 240, 246, lines[0], { size: FONT_SIZE.heading - 4, bold: true }));
    overlay.add(inkText(this, 240, 284, lines[1], { size: FONT_SIZE.small, color: THEME.inkLight }));
    overlay.add(makeChip(this, 84, 356, '技能', THEME.cinnabar));
    overlay.add(inkText(this, 195, 392, lines[2], { size: FONT_SIZE.small, wordWrapWidth: 260 }));
    overlay.add(makeChip(this, 84, 446, '其人', THEME.indigo));
    overlay.add(inkText(this, 195, 480, lines[3], { size: FONT_SIZE.small, wordWrapWidth: 260, color: THEME.inkLight }));
    overlay.add(inkText(this, 195, 532, lines[4], { size: FONT_SIZE.tiny, wordWrapWidth: 260, color: THEME.inkLight }));

    const close = makeInkButton(this, {
      x: 195,
      y: 574,
      width: 120,
      height: 36,
      label: '关闭',
      fontSize: FONT_SIZE.small,
      onTap: () => this.clearOverlay(),
    });
    overlay.add(close);

    this.overlayLayer = overlay;
  }

  private showResultOverlay(seal: string, titleText: string, bodyText: string): void {
    this.clearOverlay();

    const won = seal === '胜';
    const overlay = this.add.container(0, 0).setDepth(90);
    overlay.add(drawPanel(this, { x: 195, y: 400, width: 344, height: 380, borderWidth: 2 }));
    overlay.add(this.add.image(195, 316, 'ink-bloom').setDisplaySize(180, 180).setAlpha(0.9));
    overlay.add(
      inkText(this, 195, 316, seal, {
        size: 72,
        bold: true,
        color: won ? THEME.cinnabar : THEME.inkLight,
      })
    );
    overlay.add(inkText(this, 195, 432, titleText, { size: FONT_SIZE.heading, bold: true }));
    overlay.add(inkText(this, 195, 472, bodyText, { size: FONT_SIZE.small, color: THEME.inkLight, wordWrapWidth: 280 }));

    overlay.add(
      makeInkButton(this, {
        x: 130,
        y: 552,
        width: 128,
        height: 44,
        label: won ? '再开一局' : '重新试炼',
        fontSize: FONT_SIZE.small,
        onTap: () => {
          playUiClick(this);
          this.scene.start('JiuzhouBattleScene', { freshRun: true });
        },
      })
    );
    overlay.add(
      makeInkButton(this, {
        x: 272,
        y: 552,
        width: 128,
        height: 44,
        label: '返回首页',
        fontSize: FONT_SIZE.small,
        fill: THEME.indigo,
        onTap: () => {
          playUiClick(this);
          this.scene.start('TitleScene');
        },
      })
    );

    this.overlayLayer = overlay;
  }

  // ---------------------------------------------------------------- 杂项

  private refreshButtonState(): void {
    const deployedCount = getDeployedUnits(this.state).length;
    this.startButton?.setAlpha(deployedCount > 0 && !this.overlayLayer && !this.resolvingBattle ? 1 : 0.5);
    this.recruitButton?.setAlpha(this.state.gold >= RECRUIT_COST && !this.overlayLayer && !this.resolvingBattle ? 1 : 0.6);
  }

  private clearOverlay(): void {
    this.overlayLayer?.destroy(true);
    this.overlayLayer = undefined;
    this.refreshButtonState();
  }

  private showWaveBanner(text: string): void {
    const banner = this.add.container(195, 330).setDepth(80);
    banner.add(drawPanel(this, { x: 0, y: 0, width: 280, height: 48, border: THEME.cinnabar, borderWidth: 2, radius: 24 }));
    banner.add(inkText(this, 0, 0, text, { size: FONT_SIZE.body, bold: true, color: THEME.cinnabar }));

    this.tweens.add({
      targets: banner,
      alpha: 0,
      delay: 1100,
      duration: 420,
      onComplete: () => banner.destroy(true),
    });
  }
}
