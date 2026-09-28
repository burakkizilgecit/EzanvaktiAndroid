# Ezan Vakti — Huawei Watch

HarmonyOS 5+ akıllı saat istemcisi. DevEco Studio ile bu klasörü açın. İlk sürüm aynı `prayer-watch-v1` JSON sözleşmesini kullanır: sıradaki vakit, günlük vakitler, 32 günlük çevrimdışı veri, namaz tamamlama ve zikir sayacı.

## Telefon eşitlemesi

Huawei telefon/saat iletişimi Wear Engine P2P ile yapılacaktır. Üretim bağlantısını açmak için AppGallery Connect'te Wear Engine servisi etkinleştirilmeli ve şu değerler `entry/src/main/ets/services/WearSyncService.ets` içindeki yer tutuculara yazılmalıdır:

- Telefon uygulaması paket adı ve imza parmak izi
- Saat uygulaması bundle adı (`com.islamicibadet.app.watch`)
- Saat uygulaması imza parmak izi

Wear Engine kısa P2P mesajlarını 1 KB ile sınırlar. Bu yüzden 32 günlük paket dosya aktarımıyla; `togglePrayer` ve `incrementDhikr` eylemleri kısa mesajla gönderilmelidir. Sertifika değerleri bilinmeden güvenli eşleştirme kod içinde tamamlanamaz.

## Hedefler

- `default`: HarmonyOS 5+ akıllı saat
- Lite wearable: API ve dağıtım uygunluğu doğrulandıktan sonra ayrı HAP hedefi açılmalıdır; bu hedefte tam uygulama desteği varsayılmaz.

Resmî belgeler: https://developer.huawei.com/consumer/en/multidevice/wearables/get-started/
