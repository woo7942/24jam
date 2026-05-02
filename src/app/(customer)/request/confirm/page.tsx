"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Package, Calendar, FileText, Sparkles, Users } from "lucide-react";
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

const SERVICE_TYPE_LABELS: Record<string, string> = {
  general: "일반 이사",
  half_packing: "반포장 이사",
  full_packing: "포장 이사",
};

const FURNITURE_LABELS: Record<string, string> = {
  bed: "침대",
  wardrobe: "옷장",
  desk: "책상",
  chair: "의자",
  fridge: "냉장고",
  washer: "세탁기",
  tv: "TV",
  sofa: "소파",
  table: "식탁",
  bookshelf: "책장",
};

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "오전 (08:00~12:00)",
  afternoon: "오후 (12:00~17:00)",
  evening: "저녁 (17:00~21:00)",
  any: "아무때나",
};

export default function Step4ConfirmPage() {
  const router = useRouter();
  const store = useRequestStore();
  const { user, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

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
        service_type: store.serviceType,
        move_type: store.moveType,
        furniture_items: store.furnitureItems,
        box_count: store.boxCount,
        notes: store.notes,
        preferred_date: store.preferredDate,
        time_slot: store.timeSlot,
        is_urgent: store.isUrgent,
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

    toast.success("견적 요청이 전송됐어요!");
    store.reset();
    router.push(`/request/complete?id=${data.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">이대로 견적을 받을까요?</h1>
        <p className="text-sm text-gray-500">입력하신 내용을 확인해주세요</p>
      </div>

      {/* 안내 박스 (기존 가격 박스 대체) */}
      <div className="rounded-2xl bg-gradient-to-br from-mint-500 to-mint-600 p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-semibold">기사님들이 직접 견적을 보내드려요</span>
        </div>
        <div className="text-lg font-bold leading-snug mb-3">
          요청을 등록하면<br />2시간 동안 기사님들이 입찰해요
        </div>
        <div className="flex items-center gap-2 text-xs opacity-90">
          <Users className="h-4 w-4" />
          <span>평균 5~10명의 기사님이 견적을 보내드려요</span>
        </div>
      </div>

      {/* 이사 종류 + 공간 */}
      <div className="rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Package className="h-4 w-4 text-mint-600" />
          <span className="font-bold text-sm">이사 정보</span>
        </div>
        <div className="text-sm space-y-1.5">
          <div>
            <span className="text-gray-400">종류</span>{" "}
            <span className="text-gray-900 font-medium">
              {store.serviceType ? SERVICE_TYPE_LABELS[store.serviceType] : "-"}
            </span>
          </div>
          <div>
            <span className="text-gray-400">공간</span>{" "}
            <span className="text-gray-900">
              {store.moveType ? MOVE_TYPE_LABELS[store.moveType] : "-"}
            </span>
          </div>
          {store.furnitureItems.length > 0 && (
            <div>
              <span className="text-gray-400">가구</span>{" "}
              <span className="text-gray-900">
                {store.furnitureItems
                  .map((f) => FURNITURE_LABELS[f] ?? f)
                  .join(", ")}
              </span>
            </div>
          )}
          <div>
            <span className="text-gray-400">박스</span>{" "}
            <span className="text-gray-900">{store.boxCount}개</span>
          </div>
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
        {submitting ? "전송 중..." : "견적 받기 시작"}
      </Button>

      <p className="text-center text-xs text-gray-400 -mt-2">
        등록 즉시 기사님들에게 알림이 갑니다
      </p>
    </div>
  );
}
