import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { getNextPrayer, type PrayerTimesData } from "../services/prayerService";

/** Wake the parent only on prayer/date boundaries or returning to the app. */
export function usePrayerClock(
  times: PrayerTimesData | null,
  location: { lat: number; lng: number } | null,
) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      const date = new Date();
      setNow(date);
      const midnight = new Date(date);
      midnight.setHours(24, 0, 0, 0);
      const target =
        times && location
          ? getNextPrayer(times, location.lat, location.lng).time.getTime()
          : midnight.getTime();
      clearTimeout(timer);
      timer = setTimeout(
        update,
        Math.max(50, Math.min(target, midnight.getTime()) - Date.now() + 50),
      );
    };
    update();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") update();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [times, location]);
  return now;
}
