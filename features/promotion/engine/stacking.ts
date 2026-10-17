import { PromotionRule } from './types';

export function arePromotionsCompatible(a: PromotionRule, b: PromotionRule): boolean {
  if (a.id === b.id) return false;
  if (a.stackMode === 'EXCLUSIVE' || b.stackMode === 'EXCLUSIVE') return false;

  if (a.incompatibleKinds?.includes(b.kind) || b.incompatibleKinds?.includes(a.kind)) {
    return false;
  }

  if (a.incompatiblePromotionIds?.includes(b.id) || b.incompatiblePromotionIds?.includes(a.id)) {
    return false;
  }

  if (a.stackGroupId && b.stackGroupId) {
    if (a.incompatibleGroupIds?.includes(b.stackGroupId) || b.incompatibleGroupIds?.includes(a.stackGroupId)) {
      return false;
    }
    if (a.stackGroupId === b.stackGroupId) {
      return false;
    }
  }

  if (a.allowedGroupIds && a.allowedGroupIds.length > 0) {
    if (!b.stackGroupId || !a.allowedGroupIds.includes(b.stackGroupId)) {
      return false;
    }
  }

  if (b.allowedGroupIds && b.allowedGroupIds.length > 0) {
    if (!a.stackGroupId || !b.allowedGroupIds.includes(a.stackGroupId)) {
      return false;
    }
  }

  return true;
}

function countBits(n: number): number {
  let count = 0;
  let temp = n;
  while (temp > 0) {
    count += temp & 1;
    temp >>= 1;
  }
  return count;
}

export function selectOptimalPromotionSet(
  candidates: { promo: PromotionRule; benefit: number }[]
): PromotionRule[] {
  if (candidates.length === 0) return [];

  if (candidates.length <= 16) {
    const n = candidates.length;
    let maxBenefit = -1;
    let bestMask = 0;

    for (let mask = 1; mask < (1 << n); mask++) {
      let isCompatible = true;
      let currentBenefit = 0;

      for (let i = 0; i < n; i++) {
        if (!(mask & (1 << i))) continue;
        currentBenefit += candidates[i].benefit;

        for (let j = i + 1; j < n; j++) {
          if ((mask & (1 << j)) && !arePromotionsCompatible(candidates[i].promo, candidates[j].promo)) {
            isCompatible = false;
            break;
          }
        }
        if (!isCompatible) break;
      }

      if (
        isCompatible &&
        (currentBenefit > maxBenefit ||
          (currentBenefit === maxBenefit && countBits(mask) > countBits(bestMask)))
      ) {
        maxBenefit = currentBenefit;
        bestMask = mask;
      }
    }

    const selected: PromotionRule[] = [];
    for (let i = 0; i < n; i++) {
      if (bestMask & (1 << i)) selected.push(candidates[i].promo);
    }
    return selected;
  }

  const sorted = [...candidates].sort((a, b) => {
    if (a.promo.priority !== b.promo.priority) return a.promo.priority - b.promo.priority;
    return b.benefit - a.benefit;
  });

  const selected: PromotionRule[] = [];
  for (const item of sorted) {
    if (selected.every((s) => arePromotionsCompatible(s, item.promo))) {
      selected.push(item.promo);
    }
  }
  return selected;
}
