// AppGallery Connect Wear Engine etkinleştirildikten ve iki imza parmak izi
// üretildikten sonra P2P alıcı/verici burada bağlanır. Güvenlik nedeniyle boş
// parmak iziyle bağlantı kurulmaz.
export const PHONE_PACKAGE = 'com.islamicibadet.app';
export const WATCH_PACKAGE = 'com.islamicibadet.app.watch';
export const PHONE_FINGERPRINT = '';
export const WATCH_FINGERPRINT = '';

export function wearEngineConfigured(): boolean {
  return PHONE_FINGERPRINT.length > 0 && WATCH_FINGERPRINT.length > 0;
}

// P2P bağlanana kadar eylemler saat üzerinde tutulur; sonraki eşitlemede
// telefona sıralı olarak gönderilir. Bu işlev veri kaybını önleyen yerel sınırdır.
export interface WatchAction { type: string; date?: string; prayer?: string; id?: string }
