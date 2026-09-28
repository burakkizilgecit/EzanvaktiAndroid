import { PrayerRepository, PrayerSnapshot, PrayerMoment, DhikrItem } from '../services/PrayerRepository';
import { common } from '@kit.AbilityKit';

@Entry @Component
struct Index {
  @State snapshot?: PrayerSnapshot = undefined
  @State now: number = Date.now()

  aboutToAppear(): void {
    PrayerRepository.read(getContext(this) as common.UIAbilityContext).then(value => this.snapshot = value)
    setInterval(() => this.now = Date.now(), 1000)
  }
  next(): PrayerMoment | undefined {
    return this.snapshot?.days.flatMap(day => day.entries).find(item => item.at > this.now)
  }
  remaining(at: number): string {
    const seconds = Math.max(0, Math.floor((at - this.now) / 1000))
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const m = Math.floor(seconds % 3600 / 60).toString().padStart(2, '0')
    const s = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }
  persist(): void {
    if (this.snapshot) PrayerRepository.save(getContext(this) as common.UIAbilityContext, JSON.stringify(this.snapshot))
  }
  togglePrayer(key: string): void {
    if (!this.snapshot || key === 'sunrise') return
    this.snapshot.watch.prayer.prayers[key] = !this.snapshot.watch.prayer.prayers[key]
    this.snapshot = JSON.parse(JSON.stringify(this.snapshot)) as PrayerSnapshot
    this.persist()
    PrayerRepository.queueAction(getContext(this) as common.UIAbilityContext, { type: 'togglePrayer', date: this.snapshot.watch.prayer.date, prayer: key })
  }
  incrementDhikr(id: string): void {
    if (!this.snapshot) return
    const item = this.snapshot.watch.dhikr.find(value => value.id === id)
    if (!item) return
    item.count += 1
    this.snapshot = JSON.parse(JSON.stringify(this.snapshot)) as PrayerSnapshot
    this.persist()
    PrayerRepository.queueAction(getContext(this) as common.UIAbilityContext, { type: 'incrementDhikr', id: id })
  }
  build() {
    Scroll() { Column({ space: 8 }) {
      Text(this.snapshot?.city || $r('app.string.app_name')).fontSize(13).fontColor('#AAB8CD')
      if (this.next()) {
        Text(this.next()!.label).fontSize(24).fontWeight(FontWeight.Bold).fontColor('#E7B34E')
        Text(this.next()!.time).fontSize(20).fontColor(Color.White)
        Text(this.remaining(this.next()!.at)).fontSize(22).fontWeight(FontWeight.Bold).fontColor('#E7B34E')
        Text('Bugünün vakitleri').fontSize(13).fontColor('#AAB8CD').margin({ top: 8 })
        ForEach(this.snapshot?.days[0]?.entries || [], (item: PrayerMoment) => {
          Row() { Text(item.label).fontColor(Color.White); Blank(); Text(item.time).fontColor('#E7B34E') }
            .width('92%').padding(9).backgroundColor('#111C2C').borderRadius(18)
            .opacity(item.key === 'sunrise' ? 0.65 : 1).onClick(() => this.togglePrayer(item.key))
        })
        Text('Zikir').fontSize(13).fontColor('#AAB8CD').margin({ top: 8 })
        ForEach(this.snapshot?.watch.dhikr || [], (item: DhikrItem) => {
          Row() { Text(item.name).fontColor(Color.White).maxLines(1); Blank(); Text(`${item.count}/${item.target}`).fontColor('#E7B34E') }
            .width('92%').padding(9).backgroundColor('#111C2C').borderRadius(18)
            .onClick(() => this.incrementDhikr(item.id))
        })
      } else { Text($r('app.string.sync_phone')).fontSize(14).fontColor(Color.White).textAlign(TextAlign.Center).padding(18) }
    }.width('100%').padding({ top: 18, bottom: 24 }) }.backgroundColor('#050B13').width('100%').height('100%')
  }
}
