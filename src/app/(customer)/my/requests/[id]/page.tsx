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
  Loader2,
  Building2,
  CheckCircle2,
  Inbox,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface MoveRequest {
  id: string;
  customer_id: string;
  from_address: string;
  from_floor: number;
  to_address: string;
  to_floor: number;
  service_type: "general" | "half_packing" | "full_packing" | null;
  move_type: string;
  furniture_items: string[] | null;
  box_count: number;
  notes: string | null;
  preferred_date: string;
  time_slot: string;
  is_urgent: boolean;
  status: "open" | "matched" | "completed" | "cancelled";
  bid_deadline: string;
  selected_bid_id: string | null;
}

interface Bid {
  id: string;
  driver_id: string;
  price: number;
  message: string | null;
  estimated_duration_min: number | null;
  status: string;
  created_at: string;
  driver_name?: string;
  driver_phone?: string;
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

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
  any: "시간 무관",
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

function getRemainingTime(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "마감";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}시간 ${m}분 남음` : `${m}분 남음`;
}

export default function CustomerRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [request, setRequest] = useState<MoveRequest | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error("로그인이 필요합니다");
      router.push("/login");
      return;
    }

    const loadData = async () => {
      const supabase = createClient();

      const { data: req, error: reqError } = await supabase
        .from("move_requests")
        .select("*")
        .eq("id", requestId)
        .eq("customer_id", user.id)
        .single();

      if (reqError || !req) {
        console.error(reqError);
        toast.error("요청을 찾을 수 없습니다");
        router.push("/my/requests");
        return;
      }

      setRequest(req);

      // DB 함수로 입찰 + 기사 정보 한 번에 가져오기 (RLS 우회, 권한 체크 내장)
const { data: bidsData, error: bidsError } = await supabase
  .rpc("get_bids_for_my_request", { p_request_id: requestId });

if (bidsError) {
  console.error("입찰 조회 실패:", bidsError);
  toast.error("입찰 목록을 불러오지 못했어요");
  setLoading(false);
  return;
}

const enriched = (bidsData || []).map((b: Bid) => ({
  ...b,
  driver_name: b.driver_name || "기사님",
}));

setBids(enriched);
setLoading(false);

    };

    loadData();
  }, [user, authLoading, requestId, router]);

  const handleAccept = async (bid: Bid) => {
    if (!request) return;
    if (!confirm(`${bid.driver_name} 기사님을 선택하시겠어요?\n선택 후에는 변경이 어렵습니다.`)) {
      return;
    }

    setAccepting(bid.id);
    const supabase = createClient();

    const { error: bidError } = await supabase
      .from("bids")
      .update({ status: "selected" })
      .eq("id", bid.id);

    if (bidError) {
      setAccepting(null);
      toast.error("선택 실패: " + bidError.message);
      return;
    }

    const { error: reqError } = await supabase
      .from("move_requests")
      .update({
        status: "matched",
        selected_bid_id: bid.id,
      })
      .eq("id", request.id);

    setAccepting(null);
    if (reqError) {
      toast.error("매칭 실패: " + reqError.message);
      return;
    }

    toast.success(`${bid.driver_name} 기사님 선택 완료!`);
    setTimeout(() => window.location.reload(), 800);
  };

  if (authLoading || loading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-mint-500" />
      </div>
    );
  }

  if (!request) return null;

  const isMatched = request.status === "matched";
  const acceptedBid = bids.find((b) => b.id === request.selected_bid_id);

  return (
    <div className="app-container pb-10">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3">
        <Link href="/my/requests" className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold">견적 요청 상세</h1>
      </header>

      <div className="px-5 pt-4">
        {/* 상태 표시 */}
        <div className="flex items-center justify-between mb-4">
          {isMatched ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              매칭 완료
            </span>
          ) : (
            <span className="inline-block rounded-full bg-mint-50 px-2.5 py-1 text-xs font-bold text-mint-700">
              입찰 받는 중
            </span>
          )}
          {!isMatched && (
            <span className="flex items-center gap-1 text-xs font-semibold text-orange-600">
              <Clock className="h-3.5 w-3.5" />
              {getRemainingTime(request.bid_deadline)}
            </span>
          )}
        </div>

        {/* 요청 요약 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold">
              {request.service_type
                ? SERVICE_TYPE_LABELS[request.service_type]
                : "이사"}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-sm text-gray-700">
              {MOVE_TYPE_LABELS[request.move_type] ?? request.move_type}
            </span>
            {request.is_urgent && (
              <span className="ml-auto inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                긴급
              </span>
            )}
          </div>
          <div className="flex items-start gap-1.5 text-sm text-gray-700 mb-2">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-mint-600" />
            <div className="flex-1">
              <div>{request.from_address} ({request.from_floor}층)</div>
              <div className="text-gray-500 text-xs my-0.5">↓</div>
              <div>{request.to_address} ({request.to_floor}층)</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
            <Calendar className="h-3.5 w-3.5 text-mint-600" />
            {request.preferred_date} ·{" "}
            {TIME_SLOT_LABELS[request.time_slot] ?? request.time_slot}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Package className="h-3.5 w-3.5 text-mint-600" />
            박스 {request.box_count}개
            {request.furniture_items && request.furniture_items.length > 0 && (
              <span className="ml-1 text-gray-500">
                · {request.furniture_items
                  .map((f) => FURNITURE_LABELS[f] ?? f)
                  .join(", ")}
              </span>
            )}
          </div>
        </div>

        {/* 매칭된 기사 표시 */}
        {isMatched && acceptedBid && (
          <div className="rounded-2xl border-2 border-blue-300 bg-blue-50/40 p-4 mb-4">
            <div className="text-xs text-blue-700 font-semibold mb-2">
              ✓ 선택한 기사님
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                  <UserIcon className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <div className="font-bold text-sm">{acceptedBid.driver_name}</div>
                  {acceptedBid.driver_phone && (
                    <div className="text-xs text-gray-600">
                      {acceptedBid.driver_phone}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-700">
                  {acceptedBid.price.toLocaleString("ko-KR")}원
                </div>
              </div>
            </div>
            {acceptedBid.message && (
              <p className="text-sm text-gray-700 mt-2 p-2 bg-white rounded-lg">
                {acceptedBid.message}
              </p>
            )}
          </div>
        )}

        {/* 입찰 목록 */}
        <div className="mt-5 mb-3 flex items-center justify-between">
          <h2 className="font-bold text-base">
            받은 견적 <span className="text-mint-600">{bids.length}</span>건
          </h2>
          {!isMatched && bids.length > 0 && (
            <span className="text-xs text-gray-500">가격순 정렬</span>
          )}
        </div>

        {bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">
              아직 받은 견적이 없어요
            </p>
            <p className="text-xs text-gray-500">
              평균 5~10명의 기사님이 입찰합니다
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bids.map((bid, idx) => {
              const isAccepted = bid.id === request.selected_bid_id;
              const isLowest = idx === 0 && !isMatched;
              return (
                <div
                  key={bid.id}
                  className={`rounded-2xl border p-4 ${
                    isAccepted
                      ? "border-blue-300 bg-blue-50/40"
                      : "border-gray-100 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-100">
                        <UserIcon className="h-4 w-4 text-mint-700" />
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          {bid.driver_name}
                          {isLowest && (
                            <span className="inline-block rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                              최저가
                            </span>
                          )}
                          {isAccepted && (
                            <span className="inline-block rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                              선택됨
                            </span>
                          )}
                        </div>
                        {bid.estimated_duration_min && (
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            예상 {Math.floor(bid.estimated_duration_min / 60)}시간{" "}
                            {bid.estimated_duration_min % 60 > 0 &&
                              `${bid.estimated_duration_min % 60}분`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {bid.price.toLocaleString("ko-KR")}
                        <span className="text-xs font-medium text-gray-500 ml-0.5">
                          원
                        </span>
                      </div>
                    </div>
                  </div>

                  {bid.message && (
                    <p className="text-sm text-gray-700 mb-3 p-2.5 bg-gray-50 rounded-lg whitespace-pre-wrap">
                      {bid.message}
                    </p>
                  )}

                  {!isMatched && (
                    <Button
                      onClick={() => handleAccept(bid)}
                      disabled={accepting !== null}
                      className="w-full h-11 bg-mint-500 hover:bg-mint-600 text-white font-bold"
                    >
                      {accepting === bid.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "이 기사님 선택하기"
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
