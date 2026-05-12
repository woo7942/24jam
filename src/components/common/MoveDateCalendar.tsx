"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDateInfo, isPastDate, type DateInfo } from "@/lib/calendar/date-info";

interface Props {
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  maxDaysAhead?: number; // 기본 60일
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function MoveDateCalendar({ value, onChange, maxDaysAhead = 60 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDaysAhead);

  // 표시 중인 달
  const initial = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth()); // 0~11

  // 달력 그리드 계산
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewYear, viewMonth, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  // 월 이동 가능 여부
  const canPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const canNext =
    viewYear < maxDate.getFullYear() ||
    (viewYear === maxDate.getFullYear() && viewMonth < maxDate.getMonth());

  const goPrev = () => {
    if (!canPrev) return;
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goNext = () => {
    if (!canNext) return;
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      {/* 헤더 (월 이동) */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canPrev}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="font-bold text-base">
          {viewYear}년 {viewMonth + 1}월
        </div>
        <button
          type="button"
          onClick={goNext}
          disabled={!canNext}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`text-center text-xs font-semibold py-1 ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 날짜 셀 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, idx) => {
          if (!date) return <div key={idx} className="h-14" />;

          const key = toKey(date);
          const info: DateInfo = getDateInfo(date);
          const disabled = isPastDate(date) || date > maxDate;
          const selected = key === value;
          const isToday = key === toKey(today);

          // 색상 결정
          let textColor = "text-gray-900";
          if (info.isHoliday || info.isSunday) textColor = "text-red-500";
          else if (info.isSaturday) textColor = "text-blue-500";

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onChange(key)}
              className={`relative h-14 rounded-lg border text-sm transition flex flex-col items-center justify-center
                ${selected
                  ? "border-mint-500 bg-mint-50 ring-2 ring-mint-500"
                  : "border-transparent hover:bg-gray-50"}
                ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                ${isToday && !selected ? "border-gray-300" : ""}
              `}
            >
              <span className={`font-semibold ${textColor}`}>{date.getDate()}</span>

              {/* 배지 영역 */}
              <div className="flex items-center gap-0.5 mt-0.5">
                {info.isLuckyDay && (
                  <span className="text-[9px] leading-none px-1 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">
                    손
                  </span>
                )}
                {info.isHoliday && (
                  <span className="text-[9px] leading-none px-1 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                    휴
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-3 text-[11px] text-gray-600">
        <div className="flex items-center gap-1">
          <span className="px-1 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">손</span>
          <span>손없는날 (+10%)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-1 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">휴</span>
          <span>공휴일 (+10%)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-500 font-bold">●</span>
          <span>주말 (+5%)</span>
        </div>
      </div>
    </div>
  );
}
