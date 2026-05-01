"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Package, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRequestStore } from "@/stores/requestStore";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

const MOVE_TYPE_LABELS: Record<string, string> = {
  one_room: "원룸",
  one_half_room: "1.5룸",
  two_room: "투룸",
  small_office: "소형 사무실",
};

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "오전 (08:00~12:00)",
  afternoon: "오후 (12:00~17:00)",
  evening: "저녁 (17:00~21:00)",
  any: "아무때나",
};

// 간단한 예상 견적 계산
function estimatePrice(store: ReturnType<typeof useRequestStore.getState>): {
  min: number;
  max: number;
} {
  let basePrice = 100000;

  // 이사 유형
  if (store.moveType === "one_room") basePrice = 120000;
  else if (store.moveType === "one_half_room") basePrice = 180000;
  else if (store.moveType === "two_room") basePrice = 250000;
  else if (store.moveType === "small_office") basePrice = 200000;

  // 층수 (엘리베이터 없으면 층당 1만원 추가)
  if (!store.fromHasElevator) basePrice += store.fromFloor * 10000;
  if (!store.toHasElevator) basePrice += store.toFloor * 10000;

  // 사다리차 필요 시
  if (store.fromNeedsLadder) basePrice += 50000;
  if (store.toNeedsLadder) basePrice += 50000;

  // 박스 개수
  basePrice += store.boxCount * 2000;

  // 긴급
  if (store.isUrgent) basePrice = Math.round(basePrice * 1.2);

  return {
    min: Math.round(basePrice * 0.85),
    max: Math.round(basePrice * 1.15),
  };
}

export default function Step4ConfirmPage() {
  const router = useRouter();
  const store = useRequestStore();
  const { user, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const estimate = estimatePrice(store);

  const handleSubmit = async () => {
    if (!user || !profile) {
      toast.error("로그인이 필요합니다");
      router.push("/login");
      return;
    }

    setSubmitting(true);

    const supabase = createClient();

    // 입찰 마감: 2시간 후
    const bidDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("move_requests")
      .insert({
        customer_id: user.id,
        from_address: store.fromAddress,
        from_address_detail: store.fromAddressDetail,
        from_floor: store.fromFloor,
        from_has_elevator: store.fromHasElevator,
        from_needs_ladder: store.fromNeedsLadder,
        to_address: store.toAddress,
        to_address_detail: store.toAddressDetail,
        to_floor: store.toFloor,
        to_has_elevator: store.toHasElevator,
        to_needs_ladder: store.toNeedsLadder,
        move_type: store.moveType,
        furniture_items: store.furnitureItems,
        box_count: store.boxCount,
        notes: store.notes,
        preferred_date: store.preferredDate,
        time_slot: store.timeSlot,
        is_urgent: store.isUrgent,
        estimated_price_min: estimate.min,
        estimated_price_max: estimate.max,
        status: "open",
        bid_deadline: bidDeadline,
      })
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      console.error("견적 요청 저장 실패:", error);
      toast.error("견적 요청 저장에 실패했어요. 다시 시도해주세요");
      return;
    }

    toast.success("견적 요청이 전송됐어요! 기사님들의 입찰을 기다려주세요");
    store.reset();
    router.push("/");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">이대로 견적을 받을까요?</h1>
        <p className="text-sm text-gray-500">입력하신 내용을 확인해주세요</p>
      </div>

      {/* 예상 견적 */}
      <div className="rounded-2xl bg-gradient-to-br from-mint-500 to-mint-600 p-6 text-white">
        <div className="text-xs opacity-80 mb-1">예상 견적 범위</div>
        <div className="text-3xl font-bold">
          {estimate.min.toLocaleString()} ~ {estimate.max.toLocaleString()}원
        </div>
        <div className="text-xs opacity-80 mt-2">
          기사님들이 더 좋은 가격으로 입찰할 수 있어요
        </div>
      </div>

      {/* 주소 */}
      <div className="rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin className="h-4 w-4 text-mint-600" />
          <span className="font-bold text-sm">주소</span>
        </div>
        <div className="text-sm space-y-2">
          <div>
            <span className="text-gray-400">출발</span>{" "}
            <span className="text-gray-900">
              {store.fromAddress} {store.fromAddressDetail}
            </span>
            <span className="text-gray-500 ml-2">
              ({store.fromFloor}층
              {store.fromHasElevator ? "·EV" : ""}
              {store.fromNeedsLadder ? "·사다리차" : ""})
            </span>
          </div>
          <div>
            <span className="text-gray-400">도착</span>{" "}
            <span className="text-gray-900">
              {store.toAddress} {store.toAddressDetail}
            </span>
            <span className="text-gray-500 ml-2">
              ({store.toFloor}층
              {store.toHasElevator ? "·EV" : ""}
              {store.toNeedsLadder ? "·사다리차" : ""})
            </span>
          </div>
        </div>
      </div>

      {/* 짐 정보 */}
      <div className="rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Package className="h-4 w-4 text-mint-600" />
          <span className="font-bold text-sm">짐 정보</span>
        </div>
        <div className="text-sm space-y-1.5">
          <div>
            <span className="text-gray-400">유형</span>{" "}
            <span className="text-gray-900">
              {store.moveType ? MOVE_TYPE_LABELS[store.moveType] : "-"}
            </span>
          </div>
          {store.furnitureItems.length > 0 && (
            <div>
              <span className="text-gray-400">가구</span>{" "}
              <span className="text-gray-900">
                {store.furnitureItems.map((f) => f.name).join(", ")}
              </span>
            </div>
          )}
          <div>
            <span className="text-gray-400">박스</span>{" "}
            <span className="text-gray-900">{store.boxCount}개</span>
          </div>
        </div>
      </div>

      {/* 일정 */}
      <div className="rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Calendar className="h-4 w-4 text-mint-600" />
          <span className="font-bold text-sm">일정</span>
        </div>
        <div className="text-sm space-y-1.5">
          <div>
            <span className="text-gray-400">날짜</span>{" "}
            <span className="text-gray-900">{store.preferredDate}</span>
            {store.isUrgent && (
              <span className="ml-2 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                긴급
              </span>
            )}
          </div>
          <div>
            <span className="text-gray-400">시간대</span>{" "}
            <span className="text-gray-900">
              {TIME_SLOT_LABELS[store.timeSlot]}
            </span>
          </div>
        </div>
      </div>

      {/* 메모 */}
      {store.notes && (
        <div className="rounded-2xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <FileText className="h-4 w-4 text-mint-600" />
            <span className="font-bold text-sm">메모</span>
          </div>
          <p className="text-sm text-gray-700">{store.notes}</p>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full h-14 bg-mint-500 hover:bg-mint-600 text-white text-base font-bold rounded-xl disabled:opacity-50"
      >
        {submitting ? "전송 중..." : "기사님께 견적 요청 보내기"}
      </Button>
    </div>
  );
}
