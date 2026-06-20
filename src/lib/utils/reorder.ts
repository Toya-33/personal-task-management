/**
 * Merge a reordered *visible* subset back into the full ordered list.
 *
 * The task list is filtered (pending / completed views), so a drag only ever
 * reorders the items currently on screen. To persist a single canonical
 * `sort_order` we splice the new visible order back into the full list: hidden
 * items keep their absolute slots, while the slots occupied by visible items are
 * refilled, in order, by the new visible sequence.
 *
 *   full:        [A(vis) B(hidden) C(vis) D(vis) E(hidden)]
 *   newVisible:  [D A C]
 *   result:      [D B A C E]
 */
export function mergeVisibleOrder<T extends { id: string }>(
  full: T[],
  newVisibleIds: string[],
): T[] {
  const visible = new Set(newVisibleIds);
  const byId = new Map(full.map((item) => [item.id, item]));
  let vi = 0;
  return full.map((item) =>
    visible.has(item.id) ? byId.get(newVisibleIds[vi++])! : item,
  );
}
