"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRequestStore, type TimeSlot } from "@/stores/requestStore";

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

  // 오늘부터 60일 후까지 선택 가능
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

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

      {/* 날짜 선택 */}
      <div className="space-y-2">
        <Label htmlFor="date">이사 날짜</Label>
        <input
          id="date"
          type="date"
          min={today}
          max={maxDate}
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:border-mint-500 focus:outline-none"
        />
        <p className="text-xs text-gray-500">오늘부터 최대 60일 이후까지 선택 가능</p>
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
