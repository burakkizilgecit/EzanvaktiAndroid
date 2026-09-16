/** Calendar keys always follow the device's local day, not UTC. */
export function localDateKey(date: Date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
