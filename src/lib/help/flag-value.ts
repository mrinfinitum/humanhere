/** Pure helper kept separate so fail-closed feature behavior is unit-testable. */
export function enabledOnlyWhenExplicitlyTrue(value: string | undefined) {
  return value === "true";
}
