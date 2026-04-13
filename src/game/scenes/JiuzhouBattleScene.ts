import Phaser from 'phaser';
import { waves } from '../data/waves';
import { simulateBattle } from '../core/battle';
import { applyRewardChoice, advanceAfterVictory, initialRunState } from '../core/run-state';
import { buildUnitCardLines } from '../ui/card-modal';
import { createBenchPanel, renderBenchUnits } from '../ui/bench';
import { createHud, updateHud, type HudRefs } from '../ui/hud';
import { buildRewardPanelModel } from '../ui/reward-panel';
import type { BenchUnit, RewardChoice, RunState } from '../types';

export class JiuzhouBattleScene extends Phaser.Scene {
  private state: RunState = structuredClone(initialRunState);
  private hud?: HudRefs;
  private benchPanel?: Phaser.GameObjects.Container;
  private startButton?: Phaser.GameObjects.Container;
  private battleInfo?: Phaser.GameObjects.Text;
  private enemyInfo?: Phaser.GameObjects.Text;
  private battleLayer?: Phaser.GameObjects.Container;
  private overlayLayer?: Phaser.GameObjects.Container;

  constructor() {
    super('JiuzhouBattleScene');
  }

  create(): void {
    this.drawBackdrop();
    this.hud = createHud(this, this.state);
    this.createBattlefield();
    this.benchPanel = createBenchPanel(this);
    this.createStartButton();
    this.refreshScene();
  }

  private drawBackdrop(): void {
    this.add.rectangle(195, 422, 390, 844, 0xefe0c0).setStrokeStyle(0);
    this.add.rectangle(195, 312, 334, 472, 0xd6c59d).setStrokeStyle(3, 0x6d5231);
    this.add.ellipse(84, 184, 54, 30, 0xb0a173, 0.55);
    this.add.ellipse(286, 250, 78, 42, 0xb7aa7b, 0.45);
    this.add.ellipse(214, 338, 92, 46, 0xcec49b, 0.55);
    this.add.text(248, 122, '荒原试炼', {
      color: '#64492f',
      fontFamily: 'Microsoft YaHei',
      fontSize: '18px',
    });
  }

  private createBattlefield(): void {
    this.battleLayer = this.add.container(0, 0);
    this.enemyInfo = this.add.text(34, 568, '', {
      color: '#5c4127',
      fontFamily: 'Microsoft YaHei',
      fontSize: '18px',
    });
    this.battleInfo = this.add.text(34, 598, '', {
      color: '#73462d',
      fontFamily: 'Microsoft YaHei',
      fontSize: '17px',
      wordWrap: { width: 320 },
    });
  }

  private createStartButton(): void {
    const container = this.add.container(262, 744);
    const button = this.add.rectangle(0, 0, 92, 56, 0xa74332);
    button.setStrokeStyle(2, 0x67301e);
    const label = this.add.text(-26, -16, '开始', {
      color: '#fff5ea',
      fontFamily: 'Microsoft YaHei',
      fontSize: '28px',
      fontStyle: 'bold',
    });
    button.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.runBattle());
    container.add([button, label]);
    container.setDepth(20);
    this.startButton = container;
  }

  private refreshScene(): void {
    this.renderBattlefieldUnits();
    this.refreshBench();
    this.refreshWaveInfo();
    if (this.hud) {
      updateHud(this.hud, this.state);
    }
  }

  private refreshBench(): void {
    this.benchPanel?.destroy(true);
    this.benchPanel = createBenchPanel(this);
    this.benchPanel.setDepth(10);
    renderBenchUnits(this, this.benchPanel, this.state.bench, (unit) => this.showCard(unit));
    this.startButton?.setDepth(20);
  }

  private refreshWaveInfo(): void {
    const wave = waves.find((entry) => entry.id === `wave-${this.state.waveNumber}`);
    const nextTitle = wave?.title ?? '试炼已完成';
    this.enemyInfo?.setText(`当前目标：${nextTitle}`);
  }

  private renderBattlefieldUnits(): void {
    this.battleLayer?.removeAll(true);
    if (!this.battleLayer) {
      return;
    }

    const activeUnits = this.state.bench.slice(0, this.state.population);
    activeUnits.forEach((unit, index) => {
      const x = 110 + index * 84;
      const y = 410 + (index % 2) * 36;
      const marker = this.add.circle(x, y, 22, 0x58724f);
      const label = this.add.text(x - 24, y - 10, buildUnitCardLines(unit.unitId, unit.star)[0], {
        color: '#fff7ed',
        fontFamily: 'Microsoft YaHei',
        fontSize: '12px',
      });
      marker.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.showCard(unit));
      this.battleLayer?.add([marker, label]);
    });
  }

  private showCard(unit: BenchUnit): void {
    this.clearOverlay();
    const overlay = this.add.container(42, 186);
    const shade = this.add.rectangle(153, 168, 306, 336, 0x111111, 0.32);
    const panel = this.add.rectangle(153, 168, 286, 296, 0xf8edd6);
    panel.setStrokeStyle(3, 0x6c4f30);
    const lines = buildUnitCardLines(unit.unitId, unit.star);
    const title = this.add.text(46, 52, lines[0], {
      color: '#2d2115',
      fontFamily: 'Microsoft YaHei',
      fontSize: '24px',
      fontStyle: 'bold',
    });
    const stats = this.add.text(46, 104, lines[1], {
      color: '#5a4128',
      fontFamily: 'Microsoft YaHei',
      fontSize: '16px',
      wordWrap: { width: 220 },
    });
    const skill = this.add.text(46, 152, lines[2], {
      color: '#704c2a',
      fontFamily: 'Microsoft YaHei',
      fontSize: '17px',
      wordWrap: { width: 220 },
    });
    const close = this.add.text(230, 28, '关闭', {
      color: '#915b32',
      fontFamily: 'Microsoft YaHei',
      fontSize: '18px',
    });
    close.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.clearOverlay());
    overlay.add([shade, panel, title, stats, skill, close]);
    this.overlayLayer = overlay;
  }

  private runBattle(): void {
    const wave = waves.find((entry) => entry.id === `wave-${this.state.waveNumber}`);
    if (!wave) {
      this.battleInfo?.setText('试炼已完成，当前版本到此结束。');
      return;
    }

    const activeUnits = this.state.bench.slice(0, this.state.population);
    const result = simulateBattle({
      alliedUnits: activeUnits,
      enemyWaveId: wave.id,
      ownedTotemIds: this.state.ownedTotemIds,
    });

    this.state = {
      ...this.state,
      usedPopulation: activeUnits.length,
      health: result.outcome === 'victory' ? this.state.health : result.remainingHealth,
    };

    this.battleInfo?.setText(
      result.outcome === 'victory'
        ? `${result.waveLabel} 已击破。${result.damageLog.join('  ')}`
        : `${result.waveLabel} 失利。${result.damageLog.join('  ')}`
    );

    if (result.outcome === 'victory') {
      this.state = advanceAfterVictory(this.state);
      this.showRewards();
    } else if (this.state.health <= 0) {
      this.battleInfo?.setText('战团全灭。刷新页面后重新挑战。');
    }

    this.refreshScene();
  }

  private showRewards(): void {
    this.clearOverlay();
    const model = buildRewardPanelModel({
      waveNumber: this.state.waveNumber - 1,
      unlockedUnitIds: this.state.unlockedUnitIds,
      ownedTotemIds: this.state.ownedTotemIds,
    });

    const overlay = this.add.container(26, 188);
    const panel = this.add.rectangle(169, 186, 338, 372, 0xf8edd6);
    panel.setStrokeStyle(3, 0x6c4f30);
    const title = this.add.text(116, 28, model.title, {
      color: '#2d2115',
      fontFamily: 'Microsoft YaHei',
      fontSize: '28px',
      fontStyle: 'bold',
    });
    const subtitle = this.add.text(80, 66, model.subtitle, {
      color: '#7f5d3d',
      fontFamily: 'Microsoft YaHei',
      fontSize: '16px',
    });

    overlay.add([panel, title, subtitle]);

    model.choices.forEach((choice, index) => {
      overlay.add(this.createRewardButton(choice, 26 + index * 104, 118));
    });

    this.overlayLayer = overlay;
  }

  private createRewardButton(choice: RewardChoice, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const card = this.add.rectangle(46, 78, 92, 156, 0xe7d2ae);
    card.setOrigin(0);
    card.setStrokeStyle(2, 0x6c4f30);
    const kind = this.add.text(20, 12, choice.kind.toUpperCase(), {
      color: '#7b5937',
      fontFamily: 'Microsoft YaHei',
      fontSize: '14px',
    });
    const label = this.add.text(16, 48, choice.label, {
      color: '#2d2115',
      fontFamily: 'Microsoft YaHei',
      fontSize: '18px',
      fontStyle: 'bold',
      wordWrap: { width: 72 },
    });
    const desc = this.add.text(16, 92, choice.description, {
      color: '#674a30',
      fontFamily: 'Microsoft YaHei',
      fontSize: '14px',
      wordWrap: { width: 72 },
    });
    card.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.pickReward(choice));
    container.add([card, kind, label, desc]);
    return container;
  }

  private pickReward(choice: RewardChoice): void {
    this.state = applyRewardChoice(this.state, choice);
    this.clearOverlay();
    this.battleInfo?.setText(`获得 ${choice.label}。继续推进下一波。`);
    this.refreshScene();
  }

  private clearOverlay(): void {
    this.overlayLayer?.destroy(true);
    this.overlayLayer = undefined;
  }
}
