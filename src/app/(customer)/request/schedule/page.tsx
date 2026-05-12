"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRequestStore, type TimeSlot } from "@/stores/requestStore";
import { MoveDateCalendar } from "@/components/common/MoveDateCalendar";
import { getDateInfo } from "@/lib/calendar/date-info";

const TIME_SLOTS: { value: TimeSlot; label: string; desc: string }[] = [
  { value: "morning", label: "오전", desc: "08:00 ~ 12:00" },
  { value: "afternoon", label: "오후", desc: "12:00 ~ 17:00" },
  { value: "evening", label: "저녁", desc: "17:00 ~ 21:00" },
  { value: "any", label: "아무때나", desc: "기사님 일정에 맞춰서" },
];

export default function Step3SchedulePage() {
  const router = useRouter();
  const store = useRequestStore();

  const [preferredDate, setPreferredDate] = useState(store.preferredDate);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(store.timeSlot);
  const [isUrgent, setIsUrgent] = useState(store.isUrgent);

  // 선택한 날짜의 가격 정보
  const selectedInfo = preferredDate ? getDateInfo(new Date(preferredDate)) : null;

  const handleNext = () => {
    if (!preferredDate) {
      toast.error("이사 날짜를 선택해주세요");
      return;
    }
    store.setStep3({ preferredDate, timeSlot, isUrgent });
    router.push("/request/confirm");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">언제 이사하나요?</h1>
        <p className="text-sm text-gray-500">날짜와 시간대를 선택해주세요</p>
      </div>

      {/* 날짜 선택 - 커스텀 달력 */}
      <div className="space-y-2">
        <Label>이사 날짜</Label>
        <MoveDateCalendar
          value={preferredDate}
          onChange={setPreferredDate}
          maxDaysAhead={60}
        />
        <p className="text-xs text-gray-500">오늘부터 최대 60일 이후까지 선택 가능</p>

        {/* 선택한 날짜 가격 안내 */}
        {selectedInfo && selectedInfo.priceMultiplier > 1 && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm font-semibold text-amber-900 mb-1">
              💡 이날은 평소보다 비쌀 수 있어요
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              {selectedInfo.badges.map((b) => b.label).join(" · ")} 이라{" "}
              기사님이 약 <strong>{selectedInfo.priceLabel}</strong> 정도 높게 입찰할 수 있어요.
              비용을 아끼려면 평일을 추천해요.
            </p>
          </div>
        )}
        {selectedInfo && selectedInfo.priceMultiplier === 1 && (
          <div className="mt-3 rounded-xl bg-mint-50 border border-mint-200 p-4">
            <p className="text-sm font-semibold text-mint-700">
              ✅ 합리적인 가격에 이사할 수 있는 날이에요
            </p>
          </div>
        )}
      </div>

      {/* 시간대 */}
      <div className="space-y-3">
        <Label>희망 시간대</Label>
        <div className="grid grid-cols-2 gap-2">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot.value}
              onClick={() => setTimeSlot(slot.value)}
              className={`rounded-xl border p-4 text-left transition ${
                timeSlot === slot.value
                  ? "border-mint-500 bg-mint-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="font-bold text-gray-900">{slot.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{slot.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 긴급 이사 */}
      <button
        onClick={() => setIsUrgent(!isUrgent)}
        className={`w-full rounded-xl border p-4 text-left transition ${
          isUrgent ? "border-mint-500 bg-mint-50" : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-gray-900">긴급 이사 🚨</div>
            <div className="text-xs text-gray-500 mt-0.5">
              48시간 이내, 추가 비용 발생 가능
            </div>
          </div>
          <div
            className={`h-6 w-6 rounded-full border-2 ${
              isUrgent ? "border-mint-500 bg-mint-500" : "border-gray-300"
            }`}
          >
            {isUrgent && (
              <span className="flex h-full w-full items-center justify-center text-white text-sm">
                ✓
              </span>
            )}
          </div>
        </div>
      </button>

      <Button
        onClick={handleNext}
        className="w-full h-14 bg-mint-500 hover:bg-mint-600 text-white text-base font-bold rounded-xl"
      >
        다음
      </Button>
    </div>
  );
}
