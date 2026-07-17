import { _decorator, Component, Graphics, Label, Node, Sprite, UIOpacity } from 'cc';
import { bindRouterToDirector } from '../app/CocosSceneNavigator';
import { BattleController } from './BattleController';
import {
  ALLY_BOARD,
  ENEMY_BOARD,
  buildUnitModels,
  mapEventsToEffects,
  slotRect,
  type BattleEffect,
  type BoardGeometry,
  type UnitRenderModel,
  type UnitSide
} from './BattleViewModel';
import {
  applyRect,
  createButton,
  createHpBar,
  createInkImage,
  createLabel,
  createPanel,
  hexColor,
  theme,
  type ButtonHandle,
  type HpBarHandle
} from './kit';

const { ccclass } = _decorator;

/** 每个攻击指令的呈现间隔；队列积压时加速消化。 */
const EFFECT_INTERVAL_MS = 280;
const EFFECT_INTERVAL_BUSY_MS = 120;

interface Anim {
  elapsed: number;
  durationMs: number;
  step(t: number): void;
  done?(): void;
}

interface UnitToken {
  model: UnitRenderModel;
  node: Node;
  hpBar: HpBarHandle;
  statusDot: Graphics;
  portrait: Sprite;
}

/**
 * 战斗场景 binder：整棵 UI 树由代码构建。
 * 职责：建场景、把 controller 的事件队列变成动画、每帧刷新 HUD。
 */
@ccclass('BattleSceneBinder')
export class BattleSceneBinder extends Component {
  readonly controller = new BattleController();

  private readonly tokens = new Map<string, UnitToken>();
  private readonly enemyTokenIds: string[] = [];
  private effects: BattleEffect[] = [];
  private effectCooldownMs = 0;
  private anims: Anim[] = [];
  private lastWaveIndex = -1;
  private skillButton: ButtonHandle | null = null;
  private waveLabel: Label | null = null;
  private banner: Node | null = null;
  private effectsLayer: Node | null = null;
  private unitsLayer: Node | null = null;

  onLoad(): void {
    bindRouterToDirector();
    this.controller.onLoad();
    this.buildScene();
    this.rebuildEnemyTokens();
    this.lastWaveIndex = this.controller.waveIndex;
    this.refreshHud();
  }

  update(deltaTime: number): void {
    this.controller.update(deltaTime);

    const allyIds = this.controller.getAlliesView().map((view) => view.id);
    this.effects.push(...mapEventsToEffects(this.controller.consumeEvents(), allyIds));

    if (this.controller.waveIndex !== this.lastWaveIndex) {
      this.lastWaveIndex = this.controller.waveIndex;
      this.rebuildEnemyTokens();
      this.showBanner(`第 ${this.lastWaveIndex + 1} 波`);
    }

    this.effectCooldownMs -= deltaTime * 1000;
    if (this.effects.length > 0 && this.effectCooldownMs <= 0) {
      const effect = this.effects.shift();
      if (effect) this.playEffect(effect);
      this.effectCooldownMs = this.effects.length > 4 ? EFFECT_INTERVAL_BUSY_MS : EFFECT_INTERVAL_MS;
    }

    this.stepAnims(deltaTime * 1000);
    this.refreshHud();
  }

  onUseSkillTap(): void {
    this.controller.useSkill();
    this.refreshHud();
  }

  // ---------------------------------------------------------------- 场景搭建

  private buildScene(): void {
    const bg = createInkImage('art/bg_battle', { width: 720, height: 1280, name: 'Background' });
    this.node.addChild(bg);

    const title = createLabel(this.controller.getStageTitle(), {
      fontSize: theme.fontSize.heading,
      name: 'StageTitle'
    });
    title.setPosition(0, 590);
    this.node.addChild(title);

    const wave = createLabel(this.controller.getWaveLabel(), {
      fontSize: theme.fontSize.small,
      color: theme.colors.inkLight,
      name: 'WaveLabel'
    });
    wave.setPosition(0, 548);
    this.node.addChild(wave);
    this.waveLabel = wave.getComponent(Label);

    const storyPanel = createPanel({ width: 660, height: 64, name: 'StoryPanel', radius: 10 });
    storyPanel.setPosition(0, 482);
    this.node.addChild(storyPanel);
    const story = createLabel(this.controller.getStoryText(), {
      fontSize: theme.fontSize.small,
      name: 'StoryText'
    });
    storyPanel.addChild(story);

    this.node.addChild(this.buildBoardCells('BoardCells_Enemy', ENEMY_BOARD));
    this.node.addChild(this.buildBoardCells('BoardCells_Ally', ALLY_BOARD));

    const unitsLayer = new Node('UnitsLayer');
    this.node.addChild(unitsLayer);
    this.unitsLayer = unitsLayer;

    for (const model of buildUnitModels('ally', this.controller.getAlliesView(), ALLY_BOARD)) {
      this.addUnitToken(model);
    }

    const effectsLayer = new Node('EffectsLayer');
    this.node.addChild(effectsLayer);
    this.effectsLayer = effectsLayer;

    const banner = createLabel('', { fontSize: theme.fontSize.title, color: theme.colors.cinnabar, name: 'Banner' });
    banner.active = false;
    banner.setPosition(0, 80);
    banner.addComponent(UIOpacity);
    this.effectsLayer.addChild(banner);
    this.banner = banner;

    const heroId = this.controller.selectedHeroId;
    const portrait = createInkImage(`art/portrait_${heroId}`, { width: 84, height: 84, name: 'SkillPortrait' });
    portrait.setPosition(-252, -565);
    this.node.addChild(portrait);

    this.skillButton = createButton(this.controller.getSkillLabel(), {
      width: 280,
      height: 76,
      name: 'SkillButton',
      fontSize: theme.fontSize.body,
      onTap: () => this.onUseSkillTap()
    });
    this.skillButton.node.setPosition(20, -565);
    this.node.addChild(this.skillButton.node);
  }

  private buildBoardCells(name: string, board: BoardGeometry): Node {
    const node = new Node(name);
    const g = node.addComponent(Graphics);
    g.strokeColor = hexColor(theme.colors.inkLight, 110);
    g.lineWidth = 2;

    for (let slot = 0; slot < 6; slot += 1) {
      const rect = slotRect(board, slot);
      g.roundRect(rect.x - rect.width / 2, rect.y - rect.height / 2, rect.width, rect.height, 12);
      g.stroke();
    }

    return node;
  }

  private addUnitToken(model: UnitRenderModel): void {
    const node = new Node(`Unit_${model.id}`);
    applyRect(node, model.rect);

    const frame = createInkImage(model.framePath, { width: 132, height: 132, name: 'Frame', fallbackFill: null });
    node.addChild(frame);

    const portraitNode = createInkImage(model.artPath, { width: 108, height: 108, name: 'Portrait' });
    node.addChild(portraitNode);
    const portrait = portraitNode.getComponent(Sprite);

    const name = createLabel(model.name, { fontSize: theme.fontSize.small, name: 'NameLabel' });
    name.setPosition(0, -82);
    node.addChild(name);

    const hpBar = createHpBar({ width: 104, height: 10, fill: model.side === 'ally' ? theme.colors.indigo : theme.colors.damage });
    hpBar.node.setPosition(0, 72);
    node.addChild(hpBar.node);

    const statusNode = new Node('StatusDots');
    statusNode.setPosition(56, 58);
    const statusDot = statusNode.addComponent(Graphics);
    node.addChild(statusNode);

    this.unitsLayer?.addChild(node);
    if (portrait) {
      this.tokens.set(model.id, { model, node, hpBar, statusDot, portrait });
      if (model.side === 'enemy') {
        this.enemyTokenIds.push(model.id);
      }
    }
  }

  private rebuildEnemyTokens(): void {
    for (const id of this.enemyTokenIds.splice(0)) {
      const token = this.tokens.get(id);
      if (token) {
        token.node.destroy();
        this.tokens.delete(id);
      }
    }

    for (const model of buildUnitModels('enemy', this.controller.getEnemiesView(), ENEMY_BOARD)) {
      this.addUnitToken(model);
    }
  }

  // ---------------------------------------------------------------- HUD 刷新

  private refreshHud(): void {
    const views = [...this.controller.getAlliesView(), ...this.controller.getEnemiesView()];

    for (const view of views) {
      const token = this.tokens.get(view.id);
      if (!token) continue;

      token.hpBar.setRatio(view.maxHp > 0 ? view.hp / view.maxHp : 0);

      const grey = hexColor(theme.colors.inkLight);
      const normal = hexColor('#ffffff');
      token.portrait.color = view.alive ? normal : grey;

      token.statusDot.clear();
      if (view.warded) {
        token.statusDot.fillColor = hexColor(theme.colors.indigo);
        token.statusDot.circle(0, 0, 7);
        token.statusDot.fill();
      }
      if (view.slowed) {
        token.statusDot.fillColor = hexColor(theme.colors.inkLight);
        token.statusDot.circle(view.warded ? -18 : 0, 0, 7);
        token.statusDot.fill();
      }
    }

    this.skillButton?.setEnabled(this.controller.canUseSkill());
    if (this.waveLabel) {
      this.waveLabel.string = this.controller.getWaveLabel();
    }
  }

  // ---------------------------------------------------------------- 动画

  private stepAnims(deltaMs: number): void {
    const finished: Anim[] = [];

    for (const anim of this.anims) {
      anim.elapsed += deltaMs;
      const t = Math.min(1, anim.elapsed / anim.durationMs);
      anim.step(t);
      if (t >= 1) finished.push(anim);
    }

    for (const anim of finished) {
      anim.done?.();
      this.anims.splice(this.anims.indexOf(anim), 1);
    }
  }

  private playEffect(effect: BattleEffect): void {
    if (effect.kind === 'attack') {
      this.playAttack(effect);
    } else {
      this.playSkill(effect);
    }
  }

  private playAttack(effect: Extract<BattleEffect, { kind: 'attack' }>): void {
    const attacker = this.tokens.get(effect.attackerId);
    const target = this.tokens.get(effect.targetId);
    if (!attacker || !target) return;

    const base = attacker.node.getPosition();
    const aim = target.node.getPosition();
    const dx = aim.x - base.x;
    const dy = aim.y - base.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const lunge = 44;

    this.anims.push({
      elapsed: 0,
      durationMs: 260,
      step: (t) => {
        const push = Math.sin(Math.PI * t) * lunge;
        attacker.node.setPosition(base.x + (dx / length) * push, base.y + (dy / length) * push);
      },
      done: () => attacker.node.setPosition(base.x, base.y)
    });

    this.spawnDamageFloat(aim.x, aim.y + 70, `-${effect.damage}`);

    if (effect.killed) {
      this.anims.push({
        elapsed: 0,
        durationMs: 380,
        step: (t) => target.node.setScale(1 - 0.3 * t, 1 - 0.3 * t)
      });
    }
  }

  private playSkill(effect: Extract<BattleEffect, { kind: 'skill' }>): void {
    if (effect.skillId === 'wolfBlessing') {
      this.spawnInkFx('art/ink_bloom', 0, -180, 420, 1.4);
      return;
    }

    if (effect.skillId === 'tigerCharge') {
      this.spawnInkFx('art/ink_slash', 0, 220, 560, 1.3);
    } else if (effect.skillId === 'featherBounce') {
      for (const targetId of effect.targetIds) {
        const token = this.tokens.get(targetId);
        if (token) {
          const pos = token.node.getPosition();
          this.spawnInkFx('art/ink_bloom', pos.x, pos.y, 150, 1.2);
        }
      }
    }

    for (const hit of effect.hits) {
      const token = this.tokens.get(hit.targetId);
      if (!token) continue;
      const pos = token.node.getPosition();
      this.spawnDamageFloat(pos.x, pos.y + 70, `-${hit.damage}`);
      if (hit.killed) {
        this.anims.push({
          elapsed: 0,
          durationMs: 380,
          step: (t) => token.node.setScale(1 - 0.3 * t, 1 - 0.3 * t)
        });
      }
    }
  }

  private spawnDamageFloat(x: number, y: number, text: string): void {
    const node = createLabel(text, { fontSize: theme.fontSize.body, color: theme.colors.damage, name: 'DamageFloat' });
    node.setPosition(x, y);
    const opacity = node.addComponent(UIOpacity);
    this.effectsLayer?.addChild(node);

    this.anims.push({
      elapsed: 0,
      durationMs: 620,
      step: (t) => {
        node.setPosition(x, y + 64 * t);
        opacity.opacity = Math.round(255 * (1 - t));
      },
      done: () => node.destroy()
    });
  }

  private spawnInkFx(path: string, x: number, y: number, width: number, scaleTo: number): void {
    const height = path.endsWith('ink_slash') ? width / 2 : width;
    const node = createInkImage(path, { width, height, name: 'SkillEffect', fallbackFill: null });
    node.setPosition(x, y);
    node.setScale(0.6, 0.6);
    const opacity = node.addComponent(UIOpacity);
    this.effectsLayer?.addChild(node);

    this.anims.push({
      elapsed: 0,
      durationMs: 560,
      step: (t) => {
        const scale = 0.6 + (scaleTo - 0.6) * t;
        node.setScale(scale, scale);
        opacity.opacity = Math.round(255 * Math.sin(Math.PI * t));
      },
      done: () => node.destroy()
    });
  }

  private showBanner(text: string): void {
    if (!this.banner) return;
    const label = this.banner.getComponent(Label);
    const opacity = this.banner.getComponent(UIOpacity);
    if (label) label.string = text;
    this.banner.active = true;

    this.anims.push({
      elapsed: 0,
      durationMs: 900,
      step: (t) => {
        if (opacity) opacity.opacity = Math.round(255 * Math.sin(Math.PI * t));
      },
      done: () => {
        if (this.banner) this.banner.active = false;
      }
    });
  }
}
