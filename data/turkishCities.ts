export interface CityCoords {
  name: string;
  lat: number;
  lng: number;
}

// Province-center coordinates for Turkey's 81 administrative provinces.
export const TURKISH_CITIES: CityCoords[] = [
  { name: 'Adana', lat: 37.0000, lng: 35.3213 },
  { name: 'Adıyaman', lat: 37.7648, lng: 38.2786 },
  { name: 'Afyonkarahisar', lat: 38.7507, lng: 30.5567 },
  { name: 'Ağrı', lat: 39.7191, lng: 43.0503 },
  { name: 'Aksaray', lat: 38.3687, lng: 34.0370 },
  { name: 'Amasya', lat: 40.6499, lng: 35.8353 },
  { name: 'Ankara', lat: 39.9334, lng: 32.8597 },
  { name: 'Antalya', lat: 36.8969, lng: 30.7133 },
  { name: 'Ardahan', lat: 41.1105, lng: 42.7022 },
  { name: 'Artvin', lat: 41.1828, lng: 41.8183 },
  { name: 'Aydın', lat: 37.8560, lng: 27.8416 },
  { name: 'Balıkesir', lat: 39.6484, lng: 27.8826 },
  { name: 'Bartın', lat: 41.5811, lng: 32.4610 },
  { name: 'Batman', lat: 37.8812, lng: 41.1351 },
  { name: 'Bayburt', lat: 40.2552, lng: 40.2249 },
  { name: 'Bilecik', lat: 40.1506, lng: 29.9792 },
  { name: 'Bingöl', lat: 38.8855, lng: 40.4966 },
  { name: 'Bitlis', lat: 38.4006, lng: 42.1095 },
  { name: 'Bolu', lat: 40.7392, lng: 31.6089 },
  { name: 'Burdur', lat: 37.7203, lng: 30.2908 },
  { name: 'Bursa', lat: 40.1826, lng: 29.0665 },
  { name: 'Çanakkale', lat: 40.1553, lng: 26.4142 },
  { name: 'Çankırı', lat: 40.6013, lng: 33.6134 },
  { name: 'Çorum', lat: 40.5506, lng: 34.9556 },
  { name: 'Denizli', lat: 37.7765, lng: 29.0864 },
  { name: 'Diyarbakır', lat: 37.9144, lng: 40.2306 },
  { name: 'Düzce', lat: 40.8438, lng: 31.1565 },
  { name: 'Edirne', lat: 41.6771, lng: 26.5557 },
  { name: 'Elazığ', lat: 38.6810, lng: 39.2264 },
  { name: 'Erzincan', lat: 39.7500, lng: 39.5000 },
  { name: 'Erzurum', lat: 39.9000, lng: 41.2700 },
  { name: 'Eskişehir', lat: 39.7767, lng: 30.5206 },
  { name: 'Gaziantep', lat: 37.0662, lng: 37.3833 },
  { name: 'Giresun', lat: 40.9128, lng: 38.3895 },
  { name: 'Gümüşhane', lat: 40.4386, lng: 39.5086 },
  { name: 'Hakkari', lat: 37.5744, lng: 43.7408 },
  { name: 'Hatay', lat: 36.4018, lng: 36.3498 },
  { name: 'Iğdır', lat: 39.9167, lng: 44.0333 },
  { name: 'Isparta', lat: 37.7648, lng: 30.5566 },
  { name: 'İstanbul', lat: 41.0082, lng: 28.9784 },
  { name: 'İzmir', lat: 38.4237, lng: 27.1428 },
  { name: 'Kahramanmaraş', lat: 37.5753, lng: 36.9228 },
  { name: 'Karabük', lat: 41.2061, lng: 32.6204 },
  { name: 'Karaman', lat: 37.1759, lng: 33.2287 },
  { name: 'Kars', lat: 40.6167, lng: 43.1000 },
  { name: 'Kastamonu', lat: 41.3887, lng: 33.7827 },
  { name: 'Kayseri', lat: 38.7312, lng: 35.4787 },
  { name: 'Kilis', lat: 36.7184, lng: 37.1212 },
  { name: 'Kırıkkale', lat: 39.8468, lng: 33.5153 },
  { name: 'Kırklareli', lat: 41.7333, lng: 27.2167 },
  { name: 'Kırşehir', lat: 39.1425, lng: 34.1709 },
  { name: 'Kocaeli', lat: 40.8533, lng: 29.8815 },
  { name: 'Konya', lat: 37.8746, lng: 32.4932 },
  { name: 'Kütahya', lat: 39.4242, lng: 29.9833 },
  { name: 'Malatya', lat: 38.3552, lng: 38.3095 },
  { name: 'Manisa', lat: 38.6191, lng: 27.4289 },
  { name: 'Mardin', lat: 37.3212, lng: 40.7245 },
  { name: 'Mersin', lat: 36.8000, lng: 34.6333 },
  { name: 'Muğla', lat: 37.2153, lng: 28.3636 },
  { name: 'Muş', lat: 38.9462, lng: 41.7539 },
  { name: 'Nevşehir', lat: 38.6939, lng: 34.6857 },
  { name: 'Niğde', lat: 37.9667, lng: 34.6833 },
  { name: 'Ordu', lat: 40.9839, lng: 37.8764 },
  { name: 'Osmaniye', lat: 37.0742, lng: 36.2478 },
  { name: 'Rize', lat: 41.0201, lng: 40.5234 },
  { name: 'Sakarya', lat: 40.7569, lng: 30.3781 },
  { name: 'Samsun', lat: 41.2867, lng: 36.3300 },
  { name: 'Siirt', lat: 37.9333, lng: 41.9500 },
  { name: 'Sinop', lat: 42.0231, lng: 35.1531 },
  { name: 'Sivas', lat: 39.7477, lng: 37.0179 },
  { name: 'Şanlıurfa', lat: 37.1591, lng: 38.7969 },
  { name: 'Şırnak', lat: 37.4187, lng: 42.4918 },
  { name: 'Tekirdağ', lat: 40.9833, lng: 27.5167 },
  { name: 'Tokat', lat: 40.3167, lng: 36.5500 },
  { name: 'Trabzon', lat: 41.0027, lng: 39.7168 },
  { name: 'Tunceli', lat: 39.3074, lng: 39.4388 },
  { name: 'Uşak', lat: 38.6823, lng: 29.4082 },
  { name: 'Van', lat: 38.4891, lng: 43.4089 },
  { name: 'Yalova', lat: 40.6500, lng: 29.2667 },
  { name: 'Yozgat', lat: 39.8181, lng: 34.8147 },
  { name: 'Zonguldak', lat: 41.4564, lng: 31.7987 },
];

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Falls back to the nearest known province center when reverse geocoding
// gives nothing usable, so the UI never has to show raw coordinates.
export function findNearestCity(lat: number, lng: number): string {
  let nearest = TURKISH_CITIES[0];
  let best = Infinity;
  for (const city of TURKISH_CITIES) {
    const d = haversineKm(lat, lng, city.lat, city.lng);
    if (d < best) { best = d; nearest = city; }
  }
  return nearest.name;
}
