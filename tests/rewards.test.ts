import { describe, expect, it } from 'vitest';
import { chapter } from '../src/game/data/chapter';
import { totems } from '../src/game/data/totems';
import { units } from '../src/game/data/units';
import { createRewardChoices } from '../src/game/core/rewards';
import { buildUnitCardLines } from '../src/game/ui/card-modal';
import { buildRewardPanelModel } from '../src/game/ui/reward-panel';

describe('Jiuzhou MVP content', () => {
  it('defines the Shangzhou chapter and core Northland tribe units', () => {
    expect(chapter.id).toBe('shangzhou-north-wastes');
    expect(chapter.faction).toBe('northland-tribe');
    expect(units.map((unit) => unit.id)).toEqual(
      expect.arrayContaining(['axe-warrior', 'frost-shaman', 'wolf-rider'])
    );
    expect(totems.map((totem) => totem.id)).toEqual(
      expect.arrayContaining(['war-drum', 'wolf-spirit', 'frost-bone'])
    );
  });

  it('returns one unit reward, one totem reward, and one economy reward', () => {
    const choices = createRewardChoices({
      waveNumber: 2,
      unlockedUnitIds: ['axe-warrior'],
      ownedTotemIds: [],
    });

    expect(choices).toHaveLength(3);
    expect(choices.map((choice) => choice.kind).sort()).toEqual(['economy', 'totem', 'unit']);
  });

  it('formats card copy and reward panel view models', () => {
    expect(buildUnitCardLines('axe-warrior')[0]).toContain('战斧勇士');
    expect(
      buildRewardPanelModel({
        waveNumber: 2,
        unlockedUnitIds: ['axe-warrior'],
        ownedTotemIds: [],
      }).choices
    ).toHaveLength(3);
  });
});
