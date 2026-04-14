import Phaser from 'phaser';
import { createBattleRuntime, stepBattleRuntime, summarizeBattleRuntime } from '../core/battle';
import { autoMergeRunState, applyRewardChoice, assignBoardSlot, getDeployedUnits, advanceAfterVictory, initialRunState } from '../core/run-state';
import { createBenchUnit, getBenchUnitOrThrow, getUnitDefinitionOrThrow } from '../core/helpers';
import { chapter } from '../data/chapter';
import { waves } from '../data/waves';
import { buildBenchCardModel } from '../ui/bench';
import { buildUnitCardLines } from '../ui/card-modal';
import { createHud, updateHud, type HudRefs } from '../ui/hud';
import { buildRewardPanelModel } from '../ui/reward-panel';
import type { BattleEvent, BattleRuntimeState, BattleSimulationResult, BenchUnit, RewardChoice, RunState } from '../types';

interface SlotAnchor {
  x: number;
  y: number;
}

const BOARD_SLOT_POSITIONS: SlotAnchor[] = [
  { x: 118, y: 432 },
  { x: 196, y: 386 },
  { x: 274, y: 432 },
];

const RECRUIT_COST = 15;

export class JiuzhouBattleScene extends Phaser.Scene {
  private state: RunState = structuredClone(initialRunState);
  private hud?: HudRefs;
  private battleLayer?: Phaser.GameObjects.Container;
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

  preload(): void {
    this.load.image('ground', '/art/frost-ground.svg');
    this.load.image('board-shangzhou', '/art/board-shangzhou.svg');
    this.load.image('panel-header', '/art/panel-header.svg');
    this.load.image('panel-bench', '/art/panel-bench.svg');
    this.load.image('panel-detail', '/art/panel-detail.svg');
    this.load.image('panel-reward', '/art/panel-reward.svg');
    this.load.image('card-unit', '/art/card-unit.svg');
    this.load.image('card-reward', '/art/card-reward.svg');
    this.load.image('card-bench-compact', '/art/card-bench-compact.svg');
    this.load.image('button-lacquer', '/art/button-lacquer.svg');
    this.load.image('slot-stone', '/art/slot-stone.svg');
    this.load.image('unit-axe-warrior', '/art/unit-axe-warrior.svg');
    this.load.image('unit-frost-shaman', '/art/unit-frost-shaman.svg');
    this.load.image('unit-wolf-rider', '/art/unit-wolf-rider.svg');
    this.load.image('unit-wastes-hunter', '/art/unit-wastes-hunter.svg');
    this.load.image('enemy-melee', '/art/enemy-melee.svg');
    this.load.image('enemy-projectile', '/art/enemy-projectile.svg');
    this.load.image('enemy-spell', '/art/enemy-spell.svg');
    this.load.image('totem-war-drum', '/art/totem-war-drum.svg');
    this.load.image('totem-wolf-spirit', '/art/totem-wolf-spirit.svg');
    this.load.image('totem-frost-bone', '/art/totem-frost-bone.svg');
  }

  create(): void {
    this.input.setTopOnly(false);
    this.drawBackdrop();
    this.battleLayer = this.add.container(0, 0);
    this.benchLayer = this.add.container(0, 0);
    this.effectsLayer = this.add.container(0, 0);
    this.hud = createHud(this, this.state);
    this.createInfoText();
    this.createButtons();
    this.refreshScene('拖拽战团卡牌到战场圆阵上阵。');
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
    this.refreshScene(`战团交锋中。历时 ${Math.round(this.runtimeState.elapsedMs / 100) / 10}s`);

    if (this.runtimeState.status !== 'ongoing') {
      this.finishRealtimeBattle();
    }
  }

  private drawBackdrop(): void {
    this.add.image(195, 422, 'ground').setDisplaySize(390, 844);
    this.add.image(195, 104, 'panel-header').setDisplaySize(360, 154);
    this.add.image(195, 376, 'board-shangzhou').setDisplaySize(334, 446);
    this.add.image(195, 745, 'panel-bench').setDisplaySize(360, 168);
    this.add.rectangle(195, 621, 328, 62, 0xf4e6c9, 0.88).setStrokeStyle(2, 0x82603c, 0.7);
    this.add.text(248, 138, '殇州试炼', {
      color: '#765635',
      fontFamily: 'Microsoft YaHei',
      fontSize: '18px',
      fontStyle: 'bold',
    });
  }

  private createInfoText(): void {
    this.enemyInfo = this.add.text(36, 578, '', {
      color: '#5c4127',
      fontFamily: 'Microsoft YaHei',
      fontSize: '18px',
      fontStyle: 'bold',
    });
    this.battleInfo = this.add.text(36, 608, '', {
      color: '#6c4d2c',
      fontFamily: 'Microsoft YaHei',
      fontSize: '14px',
      wordWrap: { width: 318 },
    });
  }

  private createButtons(): void {
    this.recruitButton = this.buildButton(304, 722, 92, 44, '招募', '#fff5ea', () => this.recruitUnit());
    this.startButton = this.buildButton(304, 790, 108, 52, '开始', '#fff5ea', () => this.runBattle());
    this.recruitButton.setDepth(14);
    this.startButton.setDepth(14);
  }

  private buildButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    textColor: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const skin = this.add.image(0, 0, 'button-lacquer').setDisplaySize(width, height);
    const text = this.add.text(-22, -14, label, {
      color: textColor,
      fontFamily: 'Microsoft YaHei',
      fontSize: label.length > 2 ? '22px' : '28px',
      fontStyle: 'bold',
    });
    skin.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
    container.add([skin, text]);
    return container;
  }

  private refreshScene(message?: string): void {
    this.refreshHud();
    this.refreshBattlefield();
    this.refreshBench();
    this.refreshWaveInfo(message);
    this.refreshButtonState();
  }

  private refreshHud(): void {
    if (this.hud) {
      updateHud(this.hud, this.state);
    }
  }

  private refreshWaveInfo(message?: string): void {
    const wave = waves.find((entry) => entry.id === `wave-${this.state.waveNumber}`);
    const runtimeSummary = this.runtimeState
      ? `  ·  敌余 ${this.runtimeState.actors.filter((actor) => actor.team === 'enemy' && actor.currentHealth > 0).length}  我方 ${this.runtimeState.actors.filter((actor) => actor.team === 'ally' && actor.currentHealth > 0).length}`
      : '';
    this.enemyInfo?.setText(`当前目标：${wave?.title ?? '试炼凯旋'}${wave ? `  ·  敌势 ${wave.powerScore}` : ''}${runtimeSummary}`);
    if (message) {
      this.battleInfo?.setText(message);
    } else {
      this.battleInfo?.setText(chapter.backdrop);
    }
  }

  private refreshBattlefield(): void {
    this.battleLayer?.removeAll(true);
    if (!this.battleLayer) {
      return;
    }

    if (this.resolvingBattle && this.runtimeState) {
      this.renderRuntimeBattlefield();
      return;
    }

    BOARD_SLOT_POSITIONS.forEach((slot, index) => {
      const slotSkin = this.add.image(slot.x, slot.y, 'slot-stone').setDisplaySize(58, 58);
      slotSkin.setAlpha(index < this.state.population ? 1 : 0.35);
      this.battleLayer?.add(slotSkin);

      const occupantId = this.state.boardSlots[index];
      if (!occupantId) {
        const empty = this.add.text(slot.x - 18, slot.y - 10, index < this.state.population ? '上阵' : '封位', {
          color: '#866440',
          fontFamily: 'Microsoft YaHei',
          fontSize: '13px',
        });
        this.battleLayer?.add(empty);
        return;
      }

      const occupant = getBenchUnitOrThrow(this.state.bench, occupantId);
      const unitDef = getUnitDefinitionOrThrow(occupant.unitId);
      const pedestal = this.add.ellipse(slot.x, slot.y + 20, 44, 14, 0x4b6543, 0.22);
      const icon = this.add.image(slot.x, slot.y + 2, `unit-${occupant.unitId}`).setDisplaySize(56, 56);
      const name = this.add.text(slot.x - 24, slot.y + 34, `${unitDef.name.slice(0, 4)} ${occupant.star}星`, {
        color: '#f8f1e3',
        fontFamily: 'Microsoft YaHei',
        fontSize: '11px',
        backgroundColor: '#4f6a41',
      });
      this.battleLayer?.add([pedestal, icon, name]);
      icon.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.showCard(occupant));
    });

    const wave = waves.find((entry) => entry.id === `wave-${this.state.waveNumber}`);
    wave?.enemies.slice(0, 3).forEach((enemy, index) => {
      const x = 96 + index * 96;
      const y = 258;
      const enemyBase = this.add.ellipse(x, y + 20, 46, 14, 0x6d4138, 0.24);
      const enemyArt = this.add.image(x, y, this.getEnemyArtKey(enemy.kind ?? 'melee')).setDisplaySize(56, 56);
      const enemyText = this.add.text(x - 18, y - 10, enemy.name.slice(0, 3), {
        color: '#fef6e5',
        fontFamily: 'Microsoft YaHei',
        fontSize: '12px',
      });
      const enemyTag = this.add.text(x - 16, y + 26, this.getEnemyKindLabel(enemy.kind ?? 'melee'), {
        color: '#f8ead7',
        backgroundColor: '#71483b',
        fontFamily: 'Microsoft YaHei',
        fontSize: '9px',
        padding: { left: 4, right: 4, top: 2, bottom: 2 },
      });
      this.battleLayer?.add([enemyBase, enemyArt, enemyText, enemyTag]);
    });
  }

  private renderRuntimeBattlefield(): void {
    if (!this.battleLayer || !this.runtimeState) {
      return;
    }

    for (const actor of this.runtimeState.actors) {
      if (actor.currentHealth <= 0) {
        continue;
      }

      const isAlly = actor.team === 'ally';
      const fillColor = isAlly
        ? 0x5d7f50
        : actor.kind === 'projectile'
          ? 0x8e5f3f
          : actor.kind === 'spell'
            ? 0x5f6e90
            : 0x7b4a42;
      const spriteKey = isAlly && actor.unitId ? `unit-${actor.unitId}` : this.getEnemyArtKey(actor.kind);
      const base = this.add.ellipse(actor.x, actor.y + 20, 44, 14, fillColor, 0.2);
      const token = this.add.image(actor.x, actor.y + 2, spriteKey).setDisplaySize(56, 56);
      const hpRatio = actor.currentHealth / actor.maxHealth;
      const hpBg = this.add.rectangle(actor.x, actor.y - 32, 40, 5, 0x2c2015, 0.8);
      const hpFg = this.add.rectangle(actor.x - 20 + 40 * hpRatio / 2, actor.y - 32, 40 * hpRatio, 5, isAlly ? 0x9cc36f : 0xd77a68);
      const name = this.add.text(actor.x - 24, actor.y + 26, actor.name.slice(0, 4), {
        color: '#f8f1e3',
        fontFamily: 'Microsoft YaHei',
        fontSize: '11px',
        backgroundColor: isAlly ? '#4a5d33' : '#5e4127',
      });
      const status = !isAlly && (actor.slowUntilMs ?? 0) > this.runtimeState.elapsedMs
        ? this.add.text(actor.x - 10, actor.y - 48, '缓', {
            color: '#eff8ff',
            backgroundColor: '#486683',
            fontFamily: 'Microsoft YaHei',
            fontSize: '10px',
            padding: { left: 4, right: 4, top: 2, bottom: 2 },
          })
        : undefined;
      this.battleLayer.add(status ? [base, token, hpBg, hpFg, name, status] : [base, token, hpBg, hpFg, name]);
    }
  }

  private refreshBench(): void {
    this.benchLayer?.removeAll(true);
    if (!this.benchLayer) {
      return;
    }

    this.benchLayer.add(
      this.add.text(34, 682, '待上场战团', {
        color: '#5a422d',
        fontFamily: 'Microsoft YaHei',
        fontSize: '20px',
        fontStyle: 'bold',
      })
    );
    this.benchLayer.add(
      this.add.text(34, 704, '拖拽上阵，轻点看详情', {
        color: '#8b6a45',
        fontFamily: 'Microsoft YaHei',
        fontSize: '12px',
      })
    );

    this.state.bench.slice(0, 6).forEach((benchUnit, index) => {
      const card = this.createBenchCard(benchUnit, index);
      this.benchLayer?.add(card);
    });
  }

  private createBenchCard(benchUnit: BenchUnit, index: number): Phaser.GameObjects.Container {
    const model = buildBenchCardModel(benchUnit);
    const column = index % 3;
    const row = Math.floor(index / 3);
    const originX = 58 + column * 78;
    const originY = 736 + row * 68;
    const deployed = this.state.boardSlots.includes(benchUnit.instanceId);

    const container = this.add.container(originX, originY);
    const frame = this.add.image(0, 0, 'card-bench-compact').setDisplaySize(72, 94);
    const icon = this.add.image(0, -18, model.artKey).setDisplaySize(34, 34);
    const star = this.add.text(20, -36, `${model.star}★`, {
      color: '#fff1d7',
      backgroundColor: '#7b5431',
      fontFamily: 'Microsoft YaHei',
      fontSize: '9px',
      padding: { left: 4, right: 4, top: 2, bottom: 2 },
    });
    const title = this.add.text(-22, 8, model.title.slice(0, 4), {
      color: '#2e1e11',
      fontFamily: 'Microsoft YaHei',
      fontSize: '12px',
      fontStyle: 'bold',
    });
    const sub = this.add.text(-22, 22, model.roleText, {
      color: '#7a5a38',
      fontFamily: 'Microsoft YaHei',
      fontSize: '8px',
    });
    const chip = this.add.text(-22, 36, deployed ? '已上阵' : model.tagText, {
      color: deployed ? '#f4eadb' : '#624325',
      backgroundColor: deployed ? '#6f7f4b' : '#e6d1ad',
      fontFamily: 'Microsoft YaHei',
      fontSize: '8px',
      padding: { left: 3, right: 3, top: 2, bottom: 2 },
    });
    container.add([frame, icon, star, title, sub, chip]);
    container.setSize(72, 94);
    container.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(container);

    let didDrag = false;

    container.on('pointerdown', () => {
      didDrag = false;
    });
    container.on('dragstart', () => {
      if (this.resolvingBattle || this.overlayLayer) {
        return;
      }
      didDrag = true;
      container.setDepth(40);
      container.setScale(1.06);
    });
    container.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.resolvingBattle || this.overlayLayer) {
        return;
      }
      container.x = dragX;
      container.y = dragY;
    });
    container.on('dragend', (pointer: Phaser.Input.Pointer) => {
      if (this.resolvingBattle || this.overlayLayer) {
        this.refreshScene();
        return;
      }
      container.setDepth(0);
      container.setScale(1);
      const targetSlotIndex = this.findHoveredSlot(pointer.x, pointer.y);
      if (targetSlotIndex >= 0) {
        this.state = assignBoardSlot(this.state, benchUnit.instanceId, targetSlotIndex);
        this.refreshScene(`已将 ${model.title} 布置到第 ${targetSlotIndex + 1} 格。`);
      } else {
        this.refreshScene();
      }
    });
    container.on('pointerup', () => {
      if (this.resolvingBattle || this.overlayLayer || didDrag) {
        return;
      }
      this.showCard(benchUnit);
    });
    return container;
  }

  private findHoveredSlot(x: number, y: number): number {
    for (let index = 0; index < BOARD_SLOT_POSITIONS.length; index += 1) {
      const slot = BOARD_SLOT_POSITIONS[index];
      if (Phaser.Math.Distance.Between(x, y, slot.x, slot.y) <= 34) {
        return index;
      }
    }
    return -1;
  }

  private recruitUnit(): void {
    if (this.overlayLayer) {
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

  private runBattle(): void {
    if (this.overlayLayer || this.resolvingBattle) {
      return;
    }

    const wave = waves.find((entry) => entry.id === `wave-${this.state.waveNumber}`);
    if (!wave) {
      this.refreshWaveInfo('当前版本试炼已完成。');
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
    this.state = {
      ...this.state,
      usedPopulation: deployed.length,
    };
    this.effectsLayer?.removeAll(true);
    this.refreshScene(`战团冲阵中。第 ${this.state.waveNumber} 波正在实时结算。`);
  }

  private showRewards(resultMessage: string): void {
    this.clearOverlay();
    this.refreshWaveInfo(resultMessage);

    const model = buildRewardPanelModel({
      waveNumber: this.state.waveNumber - 1,
      unlockedUnitIds: this.state.unlockedUnitIds,
      ownedTotemIds: this.state.ownedTotemIds,
    });

    const overlay = this.add.container(24, 188);
    overlay.setDepth(60);
    const shade = this.add.rectangle(171, 188, 342, 380, 0x140f0b, 0.36);
    const panel = this.add.image(186, 196, 'panel-reward').setDisplaySize(344, 392);
    const title = this.add.text(112, 32, model.title, {
      color: '#2d2115',
      fontFamily: 'Microsoft YaHei',
      fontSize: '26px',
      fontStyle: 'bold',
    });
    const subtitle = this.add.text(22, 64, model.subtitle, {
      color: '#6f5235',
      fontFamily: 'Microsoft YaHei',
      fontSize: '14px',
      wordWrap: { width: 300 },
    });

    overlay.add([shade, panel, title, subtitle]);
    model.choices.forEach((choice, index) => {
      overlay.add(this.createRewardCard(choice, 18 + index * 106, 120));
    });
    this.overlayLayer = overlay;
  }

  private createRewardCard(choice: RewardChoice & { artKey?: string; chipText?: string; theme?: string }, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const frame = this.add.image(48, 94, 'card-reward').setDisplaySize(98, 188);
    const glow = this.add.rectangle(48, 94, 98, 188, choice.theme === 'totem' ? 0x6d8f7d : choice.theme === 'economy' ? 0x8f6a46 : 0x7f5c39, 0.08);
    const icon = this.add.image(48, 42, choice.artKey ?? 'button-lacquer').setDisplaySize(46, 46);
    const title = this.add.text(12, 78, choice.label, {
      color: '#2d2115',
      fontFamily: 'Microsoft YaHei',
      fontSize: '16px',
      fontStyle: 'bold',
      wordWrap: { width: 72 },
      align: 'center',
    });
    const chip = this.add.text(14, 118, choice.chipText ?? choice.kind, {
      color: '#f7ebd2',
      backgroundColor: choice.theme === 'totem' ? '#476b58' : choice.theme === 'economy' ? '#8a6137' : '#7d4d2e',
      fontFamily: 'Microsoft YaHei',
      fontSize: '10px',
      padding: { left: 4, right: 4, top: 2, bottom: 2 },
    });
    const desc = this.add.text(12, 146, choice.description, {
      color: '#6b4c2c',
      fontFamily: 'Microsoft YaHei',
      fontSize: '11px',
      wordWrap: { width: 72 },
    });
    frame.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.pickReward(choice));
    container.add([glow, frame, icon, title, chip, desc]);
    return container;
  }

  private pickReward(choice: RewardChoice): void {
    const before = this.state.bench.length;
    this.state = applyRewardChoice(this.state, choice);
    this.clearOverlay();
    const merged = this.state.bench.length < before + (choice.kind === 'unit' ? 1 : 0);
    this.refreshScene(merged ? `获得 ${choice.label}，并触发了三合一升星。` : `获得 ${choice.label}。继续推进下一波。`);
  }

  private showCard(unit: BenchUnit): void {
    this.clearOverlay();
    const overlay = this.add.container(38, 172);
    overlay.setDepth(70);
    const shade = this.add.rectangle(157, 178, 314, 356, 0x18120d, 0.32);
    const panel = this.add.image(158, 182, 'panel-detail').setDisplaySize(304, 348);
    const icon = this.add.image(74, 74, `unit-${unit.unitId}`).setDisplaySize(84, 84);
    const lines = buildUnitCardLines(unit.unitId, unit.star);
    const title = this.add.text(136, 40, lines[0], {
      color: '#2d2115',
      fontFamily: 'Microsoft YaHei',
      fontSize: '22px',
      fontStyle: 'bold',
    });
    const stats = this.add.text(136, 84, lines[1], {
      color: '#5a4128',
      fontFamily: 'Microsoft YaHei',
      fontSize: '14px',
      wordWrap: { width: 152 },
    });
    const skillTag = this.add.text(34, 156, '技能', {
      color: '#f7ecd6',
      backgroundColor: '#7b5431',
      fontFamily: 'Microsoft YaHei',
      fontSize: '11px',
      padding: { left: 6, right: 6, top: 3, bottom: 3 },
    });
    const skill = this.add.text(34, 182, lines[2], {
      color: '#714d2d',
      fontFamily: 'Microsoft YaHei',
      fontSize: '15px',
      wordWrap: { width: 244 },
    });
    const roleTag = this.add.text(34, 244, '定位', {
      color: '#f7ecd6',
      backgroundColor: '#556e4b',
      fontFamily: 'Microsoft YaHei',
      fontSize: '11px',
      padding: { left: 6, right: 6, top: 3, bottom: 3 },
    });
    const roleText = this.add.text(34, 270, lines[4], {
      color: '#5a4128',
      fontFamily: 'Microsoft YaHei',
      fontSize: '14px',
      wordWrap: { width: 244 },
    });
    const lore = this.add.text(34, 316, lines[3], {
      color: '#8a6742',
      fontFamily: 'Microsoft YaHei',
      fontSize: '14px',
      wordWrap: { width: 244 },
    });
    const close = this.add.text(238, 24, '关闭', {
      color: '#915b32',
      fontFamily: 'Microsoft YaHei',
      fontSize: '18px',
    });
    close.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.clearOverlay());
    overlay.add([shade, panel, icon, title, stats, skillTag, skill, roleTag, roleText, lore, close]);
    this.overlayLayer = overlay;
  }

  private refreshButtonState(): void {
    const deployedCount = getDeployedUnits(this.state).length;
    this.startButton?.setAlpha(deployedCount > 0 && !this.overlayLayer && !this.resolvingBattle ? 1 : 0.65);
    this.recruitButton?.setAlpha(this.state.gold >= RECRUIT_COST && !this.overlayLayer && !this.resolvingBattle ? 1 : 0.7);
  }

  private clearOverlay(): void {
    this.overlayLayer?.destroy(true);
    this.overlayLayer = undefined;
  }

  private spawnBattleEventFx(event: BattleEvent): void {
    if (!this.effectsLayer) {
      return;
    }

    const tint = event.effect === 'crit'
      ? 0xff9b5c
      : event.effect === 'slow'
        ? 0x8fd4ff
        : event.effect === 'charge'
          ? 0xd7c15d
          : event.effect === 'longshot'
            ? 0xf2d889
            : event.kind === 'spell'
              ? 0x9dd3ff
              : event.kind === 'projectile'
                ? 0xe9c074
                : 0xdc7b58;
    const projectile = this.add.circle(event.fromX, event.fromY, event.kind === 'melee' ? 7 : 5, tint, 0.95);
    const trail = this.add.rectangle(
      (event.fromX + event.toX) / 2,
      (event.fromY + event.toY) / 2,
      Math.max(18, Phaser.Math.Distance.Between(event.fromX, event.fromY, event.toX, event.toY) - 18),
      event.kind === 'spell' ? 6 : 4,
      tint,
      0.18
    );
    trail.rotation = Phaser.Math.Angle.Between(event.fromX, event.fromY, event.toX, event.toY);
    this.effectsLayer.add([trail, projectile]);

    this.tweens.add({
      targets: projectile,
      x: event.toX,
      y: event.toY,
      duration: event.kind === 'melee' ? 160 : 220,
      ease: 'Quad.easeOut',
      onComplete: () => {
        const burst = this.add.circle(event.toX, event.toY, 10, tint, 0.4);
        const damage = this.add.text(event.toX - 12, event.toY - 14, `${event.amount}`, {
          color: '#fff4d7',
          stroke: '#66391f',
          strokeThickness: 3,
          fontFamily: 'Microsoft YaHei',
          fontSize: '18px',
          fontStyle: 'bold',
        });
        const marker = event.effect
          ? this.add.text(event.toX - 18, event.toY + 4, this.effectLabel(event.effect), {
              color: '#fdf1d9',
              backgroundColor: '#6b4125',
              fontFamily: 'Microsoft YaHei',
              fontSize: '10px',
              padding: { left: 4, right: 4, top: 2, bottom: 2 },
            })
          : undefined;
        this.effectsLayer?.add(marker ? [burst, damage, marker] : [burst, damage]);
        this.cameras.main.shake(90, 0.0025);
        this.tweens.add({
          targets: marker ? [burst, damage, marker] : [burst, damage],
          y: '-=22',
          alpha: 0,
          duration: 420,
          onComplete: () => {
            burst.destroy();
            damage.destroy();
            marker?.destroy();
          },
        });
        projectile.destroy();
        trail.destroy();
      },
    });
  }

  private effectLabel(effect: NonNullable<BattleEvent['effect']>): string {
    if (effect === 'crit') {
      return '裂骨';
    }
    if (effect === 'slow') {
      return '霜咒';
    }
    if (effect === 'charge') {
      return '扑袭';
    }
    return '远矛';
  }

  private showResultBanner(outcome: BattleSimulationResult['outcome'], deployedCount: number): void {
    if (!this.effectsLayer) {
      return;
    }
    const banner = this.add.rectangle(195, 212, 220, 44, outcome === 'victory' ? 0x7f4a2a : 0x553737, 0.95);
    banner.setStrokeStyle(2, 0xf0dbb7);
    const text = this.add.text(128, 196, outcome === 'victory' ? `破阵 · ${deployedCount}骑突入` : '折戟 · 战团受挫', {
      color: '#fff0d9',
      fontFamily: 'Microsoft YaHei',
      fontSize: '20px',
      fontStyle: 'bold',
    });
    this.effectsLayer.add([banner, text]);
    this.tweens.add({
      targets: [banner, text],
      alpha: 0,
      delay: 360,
      duration: 620,
      onComplete: () => {
        banner.destroy();
        text.destroy();
      },
    });
  }

  private finishRealtimeBattle(): void {
    if (!this.runtimeState) {
      return;
    }

    const summary = summarizeBattleRuntime(this.runtimeState);
    const deployedCount = this.runtimeState.actors.filter((actor) => actor.team === 'ally' && actor.currentHealth > 0).length;
    this.showResultBanner(summary.outcome, Math.max(1, deployedCount));
    this.resolvingBattle = false;
    this.runtimeState = undefined;

    if (summary.outcome === 'victory') {
      this.state = advanceAfterVictory(this.state);
      this.showRewards(`${summary.waveLabel} 已击破。敌势 ${summary.enemyPower.toFixed(0)}，我方战势 ${summary.alliedPower.toFixed(0)}。`);
      return;
    }

    this.state = {
      ...this.state,
      health: summary.remainingHealth,
    };
    this.refreshScene(`${summary.waveLabel} 失利。敌势 ${summary.enemyPower.toFixed(0)}，我方战势 ${summary.alliedPower.toFixed(0)}。`);
  }

  private getEnemyArtKey(kind: 'melee' | 'spell' | 'projectile'): string {
    if (kind === 'projectile') {
      return 'enemy-projectile';
    }
    if (kind === 'spell') {
      return 'enemy-spell';
    }
    return 'enemy-melee';
  }

  private getEnemyKindLabel(kind: 'melee' | 'spell' | 'projectile'): string {
    if (kind === 'projectile') {
      return '远袭';
    }
    if (kind === 'spell') {
      return '术法';
    }
    return '近战';
  }
}
