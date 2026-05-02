"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Package,
  FileText,
  Users,
  Loader2,
  X,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface MoveRequest {
  id: string;
  customer_id: string;
  from_address: string;
  from_address_detail: string;
  from_floor: number;
  from_has_elevator: boolean;
  from_needs_ladder: boolean;
  to_address: string;
  to_address_detail: string;
  to_floor: number;
  to_has_elevator: boolean;
  to_needs_ladder: boolean;
  service_type: "general" | "half_packing" | "full_packing" | null;
  move_type: string;
  furniture_items: string[];
  box_count: number;
  notes: string;
  preferred_date: string;
  time_slot: string;
  is_urgent: boolean;
  status: "open" | "matched" | "completed" | "cancelled";
  bid_deadline: string;
  created_at: string;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  general: "일반 이사",
  half_packing: "반포장 이사",
  full_packing: "포장 이사",
};

const MOVE_TYPE_LABELS: Record<string, string> = {
  one_room: "원룸",
  one_half_room: "1.5룸",
  two_room: "투룸",
  small_office: "소형 사무실",
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "입찰 중", color: "text-mint-700", bg: "bg-mint-50" },
  matched: { label: "매칭 완료", color: "text-blue-700", bg: "bg-blue-50" },
  completed: { label: "완료", color: "text-gray-600", bg: "bg-gray-100" },
  cancelled: { label: "취소", color: "text-red-600", bg: "bg-red-50" },
};

function getRemainingTime(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "입찰 마감";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  return `${minutes}분 남음`;
}

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;

  const { user, loading: authLoading } = useAuth();
  const [request, setRequest] = useState<MoveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error("로그인이 필요합니다");
      router.push("/login");
      return;
    }

    const fetchRequest = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("move_requests")
        .select("*")
        .eq("id", requestId)
        .eq("customer_id", user.id)
        .single();

      if (error || !data) {
        console.error("요청 조회 실패:", error);
        toast.error("요청을 찾을 수 없어요");
        router.push("/my/requests");
        return;
      }

      setRequest(data);
      setLoading(false);
    };

    fetchRequest();
  }, [user, authLoading, requestId, router]);

  const handleCancel = async () => {
    if (!request) return;
    if (!confirm("정말 취소하시겠어요? 되돌릴 수 없어요")) return;

    setCancelling(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("move_requests")
      .update({ status: "cancelled" })
      .eq("id", request.id);

    setCancelling(false);

    if (error) {
      toast.error("취소에 실패했어요");
      return;
    }

    toast.success("견적 요청이 취소됐어요");
    router.push("/my/requests");
  };

  if (authLoading || loading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-mint-500" />
      </div>
    );
  }

  if (!request) return null;

  const status = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.open;
  const isOpen = request.status === "open";
  const remaining = getRemainingTime(request.bid_deadline);

  return (
    <div className="app-container">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3">
        <Link href="/my/requests" className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold">견적 상세</h1>
      </header>

      <div className="px-5 pt-4 pb-10 space-y-5">
        {/* 상태 + 남은 시간 */}
        <div className="rounded-2xl bg-gradient-to-br from-mint-500 to-mint-600 p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.bg} ${status.color}`}
            >
              {status.label}
            </span>
            {isOpen && (
              <span className="flex items-center gap-1 text-xs font-semibold opacity-90">
                <Clock className="h-3.5 w-3.5" />
                {remaining}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold mb-1">
            {request.service_type
              ? SERVICE_TYPE_LABELS[request.service_type]
              : "이사"}
            <span className="text-base font-medium ml-2 opacity-80">
              · {MOVE_TYPE_LABELS[request.move_type] ?? request.move_type}
            </span>
          </div>
          <div className="text-xs opacity-90">
            {new Date(request.created_at).toLocaleDateString("ko-KR")} 요청
          </div>
        </div>

        {/* 받은 견적 (입찰) 섹션 */}
        <div className="rounded-2xl border-2 border-mint-100 bg-mint-50/30 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-mint-600" />
            <span className="font-bold text-sm text-gray-900">
              받은 견적{" "}
              <span className="text-mint-700">0</span>건
            </span>
          </div>

          {/* 입찰이 없을 때 (지금은 항상 이 화면) */}
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white mb-3">
              <Inbox className="h-6 w-6 text-mint-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              아직 들어온 견적이 없어요
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              {isOpen ? (
                <>
                  기사님들이 입찰 중이에요
                  <br />
                  새 견적이 오면 알려드릴게요
                </>
              ) : (
                "입찰이 마감됐어요"
              )}
            </p>
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
                {request.from_address} {request.from_address_detail}
              </span>
              <div className="text-xs text-gray-500 mt-0.5 ml-9">
                {request.from_floor}층
                {request.from_has_elevator ? " · 엘리베이터" : ""}
                {request.from_needs_ladder ? " · 사다리차" : ""}
              </div>
            </div>
            <div>
              <span className="text-gray-400">도착</span>{" "}
              <span className="text-gray-900">
                {request.to_address} {request.to_address_detail}
              </span>
              <div className="text-xs text-gray-500 mt-0.5 ml-9">
                {request.to_floor}층
                {request.to_has_elevator ? " · 엘리베이터" : ""}
                {request.to_needs_ladder ? " · 사다리차" : ""}
              </div>
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
            {request.furniture_items && request.furniture_items.length > 0 && (
              <div>
                <span className="text-gray-400">가구</span>{" "}
                <span className="text-gray-900">
                  {request.furniture_items
                    .map((f) => FURNITURE_LABELS[f] ?? f)
                    .join(", ")}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-400">박스</span>{" "}
              <span className="text-gray-900">{request.box_count}개</span>
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
              <span className="text-gray-900">{request.preferred_date}</span>
              {request.is_urgent && (
                <span className="ml-2 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                  긴급
                </span>
              )}
            </div>
            <div>
              <span className="text-gray-400">시간대</span>{" "}
              <span className="text-gray-900">
                {TIME_SLOT_LABELS[request.time_slot] ?? request.time_slot}
              </span>
            </div>
          </div>
        </div>

        {/* 메모 */}
        {request.notes && (
          <div className="rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <FileText className="h-4 w-4 text-mint-600" />
              <span className="font-bold text-sm">메모</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {request.notes}
            </p>
          </div>
        )}

        {/* 취소 버튼 (입찰 중일 때만) */}
        {isOpen && (
          <Button
            onClick={handleCancel}
            disabled={cancelling}
            variant="outline"
            className="w-full h-12 border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 disabled:opacity-50"
          >
            <X className="mr-1.5 h-4 w-4" />
            {cancelling ? "취소 중..." : "견적 요청 취소"}
          </Button>
        )}
      </div>
    </div>
  );
}
