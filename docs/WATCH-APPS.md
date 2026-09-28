# Saat uygulamaları

## Ortak ilk sürüm

| Özellik | Apple Watch | Wear OS | Huawei Watch |
|---|---:|---:|---:|
| Sıradaki vakit, saat ve geri sayım | ✓ | ✓ | ✓ |
| Günün altı vakti | ✓ | ✓ | ✓ |
| 32 günlük çevrimdışı veri | ✓ | ✓ | ✓ |
| Şehir ve son eşitleme | ✓ | ✓ | ✓ |
| Namazı kıldım işareti | ✓ | ✓ | UI hazır; Wear Engine kimliği gerekli |
| Zikir ve özel zikirler | ✓ | ✓ | UI hazır; Wear Engine kimliği gerekli |
| Saat yüzü complication | ✓ | ✓ | Sistem yüzeyi cihaz ailesine göre doğrulanacak |
| Smart Stack / Tile | Smart Stack | Tile | Cihaz ailesine göre doğrulanacak |

Telefon, Adhan hesaplamasıyla oluşturduğu tek JSON paketini saate yollar. Saatler namaz vaktini yeniden hesaplamaz; böylece mobil uygulama, widget ve saat aynı sonucu gösterir.

## Wear OS

Kaynak modül `android/wearos`, kalıcı şablon `plugins/wear-os` altındadır. Aynı `com.islamicibadet.app` paket adı ve aynı imza kullanılmalıdır; Data Layer bununla iki uygulamayı doğrular.

Geliştirme derlemesi:

```powershell
cd android
./gradlew :wearos:assembleDebug
```

Play Console paketi:

```powershell
./gradlew :wearos:bundleRelease
```

Üretilen Wear AAB, Play Console'da mevcut uygulamanın Wear OS sürümüne yüklenir. Telefon AAB'si Wear AAB'yi otomatik olarak içermez.

## Apple Watch

iOS projesindeki config plugin şu hedefleri üretir:

- `EzanVaktiWatch` — `com.islamicibadet.app.watchkitapp`
- `PrayerWatchWidgetsExtension` — `com.islamicibadet.app.watchkitapp.widgets`

İki App ID Apple Developer'da oluşturulmalı, `group.com.islamicibadet.app` App Group ikisine de bağlanmalı ve EAS credentials çalıştırıldığında iki yeni provisioning profile üretilmelidir. WatchConnectivity fiziksel iPhone ve Apple Watch üzerinde test edilmelidir.

## Huawei Watch

DevEco projesi `huawei-watch` klasöründedir. Tam P2P eşitleme için AppGallery Connect'te Wear Engine etkinleştirilir. Telefon ve saat paket adlarıyla iki imza parmak izi `WearSyncService.ets` içine girilmeden bağlantı bilinçli olarak kurulmaz.

HarmonyOS 5+ akıllı saat tam uygulama hedefidir. Lite wearable desteği, hedef cihaz modeli ve Lite API kapsamı doğrulandıktan sonra ayrı paket olarak ele alınır.
