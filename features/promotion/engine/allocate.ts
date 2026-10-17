export function allocateLargestRemainder(
  totalDiscount: number,
  ratios: { id: string; weight: number }[],
  isZeroDecimal = true
): Record<string, number> {
  const precisionMultiplier = isZeroDecimal ? 1 : 100;
  const targetUnits = Math.round(totalDiscount * precisionMultiplier);
  const totalWeight = ratios.reduce((sum, r) => sum + r.weight, 0);

  if (totalWeight <= 0 || targetUnits <= 0) {
    return ratios.reduce((acc, r) => ({ ...acc, [r.id]: 0 }), {});
  }

  const result: Record<string, number> = {};
  let allocatedUnits = 0;
  const remainders: { id: string; remainder: number }[] = [];

  for (const r of ratios) {
    const rawUnits = (r.weight / totalWeight) * targetUnits;
    const floorUnits = Math.floor(rawUnits);
    result[r.id] = floorUnits;
    allocatedUnits += floorUnits;
    remainders.push({ id: r.id, remainder: rawUnits - floorUnits });
  }

  let unitsLeft = targetUnits - allocatedUnits;
  remainders.sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; i < unitsLeft; i++) {
    const winner = remainders[i % remainders.length];
    result[winner.id] += 1;
  }

  const finalAllocations: Record<string, number> = {};
  for (const [id, units] of Object.entries(result)) {
    finalAllocations[id] = units / precisionMultiplier;
  }

  return finalAllocations;
}
