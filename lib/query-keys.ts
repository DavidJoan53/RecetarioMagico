/**
 * Shared, so a list and the thing that changes it cannot drift apart. A
 * mutation that invalidates the wrong key fails silently: the write lands,
 * the screen keeps showing what was there before, and nothing says so.
 */
export const queryKeys = {
  recipes: ['recipes'] as const,
  ingredients: ['ingredients'] as const,
  pantry: ['pantry'] as const,
}
