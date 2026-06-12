/** Browser confirm for irreversible actions. Returns false during SSR. */
export function confirmDestructive(message: string): boolean {
  if (typeof window === "undefined") return false;
  return window.confirm(message);
}
