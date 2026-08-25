/** Team leader/admin shows first wherever members are listed, regardless of when they were added. */
export function sortLeaderFirst<T extends { role: string }>(members: T[]): T[] {
  return [...members].sort((a, b) => (a.role !== "MEMBER" ? 0 : 1) - (b.role !== "MEMBER" ? 0 : 1));
}
