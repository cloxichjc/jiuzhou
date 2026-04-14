import Phaser from 'phaser';
import { simulateBattle } from '../core/battle';
import { autoMergeRunState, applyRewardChoice, assignBoardSlot, clearBoardSlot, getDeployedUnits, advanceAfterVictory, initialRunState } from '../core/run-state';
import { createBenchUnit, getBenchUnitOrThrow, getUnitDefinitionOrThrow } from '../core/helpers';
import { chapter } from '../data/chapter';
import { waves } from '../data/waves';
import { buildBenchCardModel } from '../ui/bench';
import { buildUnitCardLines } from '../ui/card-modal';
import { createHud, updateHud, type HudRefs } from '../ui/hud';
import { buildRewardPanelModel } from '../ui/reward-panel';
import type { BattleEvent, BattleSimulationResult, BenchUnit, RewardChoice, RunState } from '../types';

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

  preload(): void {
    this.load.image('ground', '/art/frost-ground.svg');
    this.load.image('panel-header', '/art/panel-header.svg');
    this.load.image('panel-bench', '/art/panel-bench.svg');
    this.load.image('card-unit', '/art/card-unit.svg');
    this.load.image('button-lacquer', '/art/button-lacquer.svg');
    this.load.image('slot-stone', '/art/slot-stone.svg');
    this.load.image('unit-axe-warrior', '/art/unit-axe-warrior.svg');
    this.load.image('unit-frost-shaman', '/art/unit-frost-shaman.svg');
    this.load.image('unit-wolf-rider', '/art/unit-wolf-rider.svg');
    this.load.image('unit-wastes-hunter', '/art/unit-wastes-hunter.svg');
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

  private drawBackdrop(): void {
    this.add.image(195, 422, 'ground').setDisplaySize(390, 844);
    this.add.image(195, 104, 'panel-header').setDisplaySize(360, 154);
    this.add.rectangle(195, 368, 332, 444, 0x000000, 0.06).setStrokeStyle(4, 0x725436, 0.65);
    this.add.image(195, 745, 'panel-bench').setDisplaySize(360, 168);
    this.add.rectangle(195, 621, 328, 62, 0xf4e6c9, 0.88).setStrokeStyle(2, 0x82603c, 0.7);
    this.add.text(270, 138, '殇州试炼', {
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
    this.recruitButton = this.buildButton(86, 791, 84, 44, '招募', '#fff5ea', () => this.recruitUnit());
    this.startButton = this.buildButton(300, 788, 114, 54, '开始', '#fff5ea', () => this.runBattle());
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
    this.enemyInfo?.setText(`当前目标：${wave?.title ?? '试炼凯旋'}${wave ? `  ·  敌势 ${wave.powerScore}` : ''}`);
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

    const boardFrame = this.add.rectangle(195, 368, 316, 408, 0xf3ead3, 0.08);
    boardFrame.setStrokeStyle(3, 0x8e6b42, 0.75);
    this.battleLayer.add(boardFrame);
    const boardTitle = this.add.text(136, 176, '北陆战桌', {
      color: '#71512d',
      fontFamily: 'Microsoft YaHei',
      fontSize: '16px',
      fontStyle: 'bold',
    });
    this.battleLayer.add(boardTitle);

    BOARD_SLOT_POSITIONS.forEach((slot, index) => {
      const slotSkin = this.add.image(slot.x, slot.y, 'slot-stone').setDisplaySize(58, 58);
      slotSkin.setAlpha(index < this.state.population ? 1 : 0.35);
      this.battleLayer?.add(slotSkin);
      slotSkin.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (this.state.boardSlots[index]) {
          this.state = clearBoardSlot(this.state, index);
          this.refreshScene('战团已下阵，重新部署。');
        }
      });

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
      const icon = this.add.image(slot.x, slot.y - 2, `unit-${occupant.unitId}`).setDisplaySize(48, 48);
      const name = this.add.text(slot.x - 24, slot.y + 28, `${unitDef.name.slice(0, 4)} ${occupant.star}星`, {
        color: '#f8f1e3',
        fontFamily: 'Microsoft YaHei',
        fontSize: '11px',
        backgroundColor: '#5e4127',
      });
      this.battleLayer?.add([icon, name]);
      icon.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.showCard(occupant));
    });

    const wave = waves.find((entry) => entry.id === `wave-${this.state.waveNumber}`);
    wave?.enemies.slice(0, 3).forEach((enemy, index) => {
      const x = 96 + index * 96;
      const y = 258;
      const enemyCircle = this.add.circle(x, y, 23, 0x7b4a42, 0.9);
      enemyCircle.setStrokeStyle(2, 0xf0dec0);
      const enemyText = this.add.text(x - 18, y - 10, enemy.name.slice(0, 3), {
        color: '#fef6e5',
        fontFamily: 'Microsoft YaHei',
        fontSize: '12px',
      });
      this.battleLayer?.add([enemyCircle, enemyText]);
    });
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

    this.state.bench.slice(0, 6).forEach((benchUnit, index) => {
      const card = this.createBenchCard(benchUnit, index);
      this.benchLayer?.add(card);
    });
  }

  private createBenchCard(benchUnit: BenchUnit, index: number): Phaser.GameObjects.Container {
    const model = buildBenchCardModel(benchUnit);
    const column = index % 4;
    const row = Math.floor(index / 4);
    const originX = 66 + column * 78;
    const originY = 758 + row * 88;
    const deployed = this.state.boardSlots.includes(benchUnit.instanceId);

    const container = this.add.container(originX, originY);
    const frame = this.add.image(0, 0, 'card-unit').setDisplaySize(72, 96);
    const icon = this.add.image(0, -14, model.artKey).setDisplaySize(40, 40);
    const title = this.add.text(-24, 18, model.title.slice(0, 4), {
      color: '#2e1e11',
      fontFamily: 'Microsoft YaHei',
      fontSize: '13px',
    });
    const sub = this.add.text(-24, 34, model.subtitle, {
      color: '#866441',
      fontFamily: 'Microsoft YaHei',
      fontSize: '9px',
    });
    const chip = this.add.text(-24, 48, deployed ? '已上阵' : model.skillName, {
      color: deployed ? '#f4eadb' : '#6d4d2a',
      backgroundColor: deployed ? '#7f4831' : '#dbc198',
      fontFamily: 'Microsoft YaHei',
      fontSize: '9px',
      padding: { left: 4, right: 4, top: 2, bottom: 2 },
    });
    container.add([frame, icon, title, sub, chip]);
    container.setSize(72, 96);
    container.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(container);

    container.on('pointerdown', () => this.showCard(benchUnit));
    container.on('dragstart', () => {
      if (this.resolvingBattle || this.overlayLayer) {
        return;
      }
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

    const result = simulateBattle({
      alliedUnits: deployed,
      enemyWaveId: wave.id,
      ownedTotemIds: this.state.ownedTotemIds,
    });

    this.resolvingBattle = true;
    this.state = {
      ...this.state,
      usedPopulation: deployed.length,
      health: result.outcome === 'victory' ? this.state.health : result.remainingHealth,
    };
    this.refreshScene(`战团冲阵中。${result.damageLog.join('  ')}`);
    this.playBattleSequence(result, deployed);
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
    const panel = this.add.rectangle(171, 188, 338, 376, 0xf7ebd2);
    panel.setStrokeStyle(3, 0x6d4e31);
    const title = this.add.text(106, 28, model.title, {
      color: '#2d2115',
      fontFamily: 'Microsoft YaHei',
      fontSize: '28px',
      fontStyle: 'bold',
    });
    const subtitle = this.add.text(22, 64, model.subtitle, {
      color: '#6f5235',
      fontFamily: 'Microsoft YaHei',
      fontSize: '15px',
      wordWrap: { width: 300 },
    });

    overlay.add([shade, panel, title, subtitle]);
    model.choices.forEach((choice, index) => {
      overlay.add(this.createRewardCard(choice, 18 + index * 106, 118));
    });
    this.overlayLayer = overlay;
  }

  private createRewardCard(choice: RewardChoice & { artKey?: string; chipText?: string }, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const panel = this.add.rectangle(46, 92, 96, 184, 0xebd8b5);
    panel.setOrigin(0);
    panel.setStrokeStyle(2, 0x6d4e31);
    const icon = this.add.image(94, 40, choice.artKey ?? 'button-lacquer').setDisplaySize(50, 50);
    const title = this.add.text(18, 76, choice.label, {
      color: '#2d2115',
      fontFamily: 'Microsoft YaHei',
      fontSize: '17px',
      fontStyle: 'bold',
      wordWrap: { width: 56 },
    });
    const chip = this.add.text(18, 120, choice.chipText ?? choice.kind, {
      color: '#f7ebd2',
      backgroundColor: '#7d4d2e',
      fontFamily: 'Microsoft YaHei',
      fontSize: '10px',
      padding: { left: 4, right: 4, top: 2, bottom: 2 },
    });
    const desc = this.add.text(18, 146, choice.description, {
      color: '#6b4c2c',
      fontFamily: 'Microsoft YaHei',
      fontSize: '11px',
      wordWrap: { width: 56 },
    });
    panel.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.pickReward(choice));
    container.add([panel, icon, title, chip, desc]);
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
    const panel = this.add.rectangle(157, 178, 298, 332, 0xf8edd6);
    panel.setStrokeStyle(3, 0x6d4e31);
    const icon = this.add.image(62, 72, `unit-${unit.unitId}`).setDisplaySize(78, 78);
    const lines = buildUnitCardLines(unit.unitId, unit.star);
    const title = this.add.text(116, 36, lines[0], {
      color: '#2d2115',
      fontFamily: 'Microsoft YaHei',
      fontSize: '24px',
      fontStyle: 'bold',
    });
    const stats = this.add.text(116, 82, lines[1], {
      color: '#5a4128',
      fontFamily: 'Microsoft YaHei',
      fontSize: '15px',
      wordWrap: { width: 152 },
    });
    const skill = this.add.text(34, 152, lines[2], {
      color: '#714d2d',
      fontFamily: 'Microsoft YaHei',
      fontSize: '16px',
      wordWrap: { width: 244 },
    });
    const lore = this.add.text(34, 230, lines[3], {
      color: '#8a6742',
      fontFamily: 'Microsoft YaHei',
      fontSize: '15px',
      wordWrap: { width: 244 },
    });
    const close = this.add.text(238, 24, '关闭', {
      color: '#915b32',
      fontFamily: 'Microsoft YaHei',
      fontSize: '18px',
    });
    close.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.clearOverlay());
    overlay.add([shade, panel, icon, title, stats, skill, lore, close]);
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

  private playBattleSequence(result: BattleSimulationResult, deployed: BenchUnit[]): void {
    this.effectsLayer?.removeAll(true);
    const enemyAnchors = this.getEnemyAnchors(result);

    result.events.forEach((event, index) => {
      this.time.delayedCall(event.timestampMs, () => {
        this.spawnBattleEventFx(event, enemyAnchors[index % enemyAnchors.length]);
      });
    });

    const finishAt = (result.events.at(-1)?.timestampMs ?? 0) + 900;
    this.time.delayedCall(finishAt, () => {
      this.showResultBanner(result.outcome, deployed.length);
      if (result.outcome === 'victory') {
        this.state = advanceAfterVictory(this.state);
        this.resolvingBattle = false;
        this.showRewards(`${result.waveLabel} 已击破。敌势 ${result.enemyPower.toFixed(0)}，我方战势 ${result.alliedPower.toFixed(0)}。`);
      } else {
        this.resolvingBattle = false;
        this.refreshScene(`${result.waveLabel} 失利。敌势 ${result.enemyPower.toFixed(0)}，我方战势 ${result.alliedPower.toFixed(0)}。`);
      }
    });
  }

  private spawnBattleEventFx(event: BattleEvent, target: SlotAnchor): void {
    if (!this.effectsLayer) {
      return;
    }

    const actorSlotIndex = this.state.boardSlots.findIndex((slotId) => slotId === event.actorId);
    const actorAnchor = actorSlotIndex >= 0 ? BOARD_SLOT_POSITIONS[actorSlotIndex] : BOARD_SLOT_POSITIONS[0];
    const tint = event.kind === 'spell' ? 0x9dd3ff : event.kind === 'projectile' ? 0xe9c074 : 0xdc7b58;
    const projectile = this.add.circle(actorAnchor.x, actorAnchor.y, event.kind === 'melee' ? 7 : 5, tint, 0.95);
    const trail = this.add.rectangle(
      (actorAnchor.x + target.x) / 2,
      (actorAnchor.y + target.y) / 2,
      Math.max(18, Phaser.Math.Distance.Between(actorAnchor.x, actorAnchor.y, target.x, target.y) - 18),
      event.kind === 'spell' ? 6 : 4,
      tint,
      0.18
    );
    trail.rotation = Phaser.Math.Angle.Between(actorAnchor.x, actorAnchor.y, target.x, target.y);
    this.effectsLayer.add([trail, projectile]);

    this.tweens.add({
      targets: projectile,
      x: target.x,
      y: target.y,
      duration: event.kind === 'melee' ? 160 : 220,
      ease: 'Quad.easeOut',
      onComplete: () => {
        const burst = this.add.circle(target.x, target.y, 10, tint, 0.4);
        const damage = this.add.text(target.x - 10, target.y - 14, `${event.amount}`, {
          color: '#fff4d7',
          stroke: '#66391f',
          strokeThickness: 3,
          fontFamily: 'Microsoft YaHei',
          fontSize: '18px',
          fontStyle: 'bold',
        });
        this.effectsLayer?.add([burst, damage]);
        this.cameras.main.shake(90, 0.0025);
        this.tweens.add({
          targets: [burst, damage],
          y: '-=22',
          alpha: 0,
          duration: 420,
          onComplete: () => {
            burst.destroy();
            damage.destroy();
          },
        });
        projectile.destroy();
        trail.destroy();
      },
    });
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

  private getEnemyAnchors(result: BattleSimulationResult): SlotAnchor[] {
    const count = Math.max(1, result.events.length);
    return Array.from({ length: count }, (_, index) => ({
      x: 96 + (index % 3) * 96,
      y: 258,
    }));
  }
}
