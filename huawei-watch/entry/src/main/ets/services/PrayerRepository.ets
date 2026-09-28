import { preferences } from '@kit.ArkData';
import { common } from '@kit.AbilityKit';

export interface PrayerMoment { key: string; label: string; time: string; at: number }
export interface DhikrItem { id: string; name: string; count: number; target: number }
export interface PrayerDay { date: string; entries: PrayerMoment[] }
export interface WatchState { prayer: { date: string; prayers: Record<string, boolean> }; dhikr: DhikrItem[]; offlineDaysAvailable: number; lastPrayerUpdateAt?: string }
export interface PrayerSnapshot { city: string; language: string; days: PrayerDay[]; watch: WatchState }

export class PrayerRepository {
  static async read(context: common.UIAbilityContext): Promise<PrayerSnapshot | undefined> {
    const store = await preferences.getPreferences(context, 'prayer_watch');
    const json = await store.get('snapshot', '') as string;
    if (!json) return undefined;
    try { return JSON.parse(json) as PrayerSnapshot } catch (_) { return undefined }
  }
  static async save(context: common.UIAbilityContext, json: string): Promise<void> {
    JSON.parse(json) as PrayerSnapshot;
    const store = await preferences.getPreferences(context, 'prayer_watch');
    await store.put('snapshot', json); await store.flush();
  }
  static async queueAction(context: common.UIAbilityContext, action: object): Promise<void> {
    const store = await preferences.getPreferences(context, 'prayer_watch');
    const raw = await store.get('pending_actions', '[]') as string;
    let actions: object[] = [];
    try { actions = JSON.parse(raw) as object[] } catch (_) {}
    actions.push(action);
    if (actions.length > 100) actions = actions.slice(actions.length - 100)
    await store.put('pending_actions', JSON.stringify(actions)); await store.flush();
  }
}
