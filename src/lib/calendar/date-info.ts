import KoreanLunarCalendar from "korean-lunar-calendar";

const HOLIDAYS: Record<string, string> = {
  "2026-01-01": "신정",
  "2026-02-16": "설날",
  "2026-02-17": "설날",
  "2026-02-18": "설날",
  "2026-03-01": "삼일절",
  "2026-03-02": "삼일절 대체공휴일",
  "2026-05-01": "노동절",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "부처님오신날 대체공휴일",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "광복절 대체공휴일",
  "2026-09-24": "추석",
  "2026-09-25": "추석",
  "2026-09-26": "추석",
  "2026-10-03": "개천절",
  "2026-10-05": "개천절 대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",
  "2027-01-01": "신정",
};

export interface DateInfo {
  dateKey: string;
  isLuckyDay: boolean;
  isHoliday: boolean;
  isWeekend: boolean;
  isSunday: boolean;
  isSaturday: boolean;
  holidayName?: string;
  priceMultiplier: number;
  priceLabel: string;
  badges: { type: "lucky" | "holiday" | "weekend"; label: string }[];
}

function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDateInfo(date: Date): DateInfo {
  const dateKey = toKey(date);

  const cal = new KoreanLunarCalendar();
  cal.setSolarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const lunar = cal.getLunarCalendar();
  const lunarDay = lunar.day;
  const isLuckyDay = [9, 10, 19, 20, 29, 30].includes(lunarDay);

  const holidayName = HOLIDAYS[dateKey];
  const isHoliday = !!holidayName;

  const day = date.getDay();
  const isSunday = day === 0;
  const isSaturday = day === 6;
  const isWeekend = isSunday || isSaturday;

  let extra = 0;
  if (isLuckyDay) extra += 0.10;
  if (isHoliday) extra += 0.10;
  if (isWeekend) extra += 0.05;
  extra = Math.min(extra, 0.20);

  const priceMultiplier = 1 + extra;
  const priceLabel = extra > 0 ? `+${Math.round(extra * 100)}%` : "기본가";

  const badges: DateInfo["badges"] = [];
  if (isLuckyDay) badges.push({ type: "lucky", label: "손없는날" });
  if (isHoliday) badges.push({ type: "holiday", label: holidayName! });
  if (isWeekend && !isHoliday) {
    badges.push({ type: "weekend", label: isSunday ? "일요일" : "토요일" });
  }

  return {
    dateKey,
    isLuckyDay,
    isHoliday,
    isWeekend,
    isSunday,
    isSaturday,
    holidayName,
    priceMultiplier,
    priceLabel,
    badges,
  };
}

export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d < today;
}
