"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Loader2,
  Inbox,
  CheckCircle2,
  User as UserIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface MoveRequest {
  id: string;
  from_address: string;
  to_address: string;
  service_type: "general" | "half_packing" | "full_packing" | null;
  move_type: string;
  preferred_date: string;
  time_slot: string;
  is_urgent: boolean;
  status: "open" | "matched" | "in_progress" | "completed" | "cancelled" | "expired";
  bid_deadline: string;
  created_at: string;
  selected_bid_id: string | null;
  bid_count?: number;
  selected_driver_name?: string | null;
  selected_price?: number | null;
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

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  open: { label: "입찰 받는 중", color: "text-mint-700", bg: "bg-mint-50" },
  matched: { label: "✓ 매칭 완료", color: "text-blue-700", bg: "bg-blue-50" },
  in_progress: { label: "진행 중", color: "text-purple-700", bg: "bg-purple-50" },
  completed: { label: "완료", color: "text-gray-600", bg: "bg-gray-100" },
  cancelled: { label: "취소됨", color: "text-red-600", bg: "bg-red-50" },
  expired: { label: "기간 만료", color: "text-gray-600", bg: "bg-gray-100" },
};

function getRemainingTime(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "마감";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  return `${minutes}분 남음`;
}

export default function MyRequestsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<MoveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRequests = async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("move_requests")
      .select("*")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("요청 조회 실패:", error);
      toast.error("요청 목록을 불러오지 못했어요");
      setLoading(false);
      return;
    }

    const requestsList = data || [];
    const requestIds = requestsList.map((r) => r.id);

    let bidCounts: Record<string, number> = {};
    if (requestIds.length > 0) {
      const { data: allBids } = await supabase
        .from("bids")
        .select("request_id")
        .in("request_id", requestIds);
      bidCounts = (allBids || []).reduce(
        (acc: Record<string, number>, b) => {
          acc[b.request_id] = (acc[b.request_id] || 0) + 1;
          return acc;
        },
        {}
      );
    }

    const matchedRequests = requestsList.filter(
      (r) => r.status === "matched" && r.selected_bid_id
    );

    const driverInfoByBidId: Record<
      string,
      { name: string | null; price: number | null }
    > = {};

    if (matchedRequests.length > 0) {
      await Promise.all(
        matchedRequests.map(async (req) => {
          const { data: bidsData } = await supabase.rpc(
            "get_bids_for_my_request",
            { p_request_id: req.id }
          );
          const selected = (bidsData || []).find(
            (b: { id: string }) => b.id === req.selected_bid_id
          );
          if (selected) {
            driverInfoByBidId[req.selected_bid_id!] = {
              name: selected.driver_name || "기사님",
              price: selected.price,
            };
          }
        })
      );
    }

    const enriched: MoveRequest[] = requestsList.map((r) => ({
      ...r,
      bid_count: bidCounts[r.id] || 0,
      selected_driver_name: r.selected_bid_id
        ? driverInfoByBidId[r.selected_bid_id]?.name ?? null
        : null,
      selected_price: r.selected_bid_id
        ? driverInfoByBidId[r.selected_bid_id]?.price ?? null
        : null,
    }));

    setRequests(enriched);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error("로그인이 필요합니다");
      router.push("/login");
      return;
    }

    fetchRequests(user.id);
  }, [user, authLoading, router]);

  const handleDelete = async (
    e: React.MouseEvent,
    req: MoveRequest
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // 안전장치: 종료된 상태만 삭제 가능
    if (!["cancelled", "completed", "expired"].includes(req.status)) {
      toast.error("진행 중인 요청은 삭제할 수 없어요");
      return;
    }

    if (!confirm("이 요청을 영구 삭제하시겠어요?\n삭제하면 복구할 수 없습니다.")) {
      return;
    }

    setDeletingId(req.id);
    const supabase = createClient();

    // 1. 관련 bids 먼저 삭제
    const { error: bidsError } = await supabase
      .from("bids")
      .delete()
      .eq("request_id", req.id);

    if (bidsError) {
      console.error("입찰 삭제 실패:", bidsError);
      // 진행 (move_requests 삭제 시 CASCADE면 어차피 같이 지워짐)
    }

    // 2. move_requests 삭제
    const { error: reqError } = await supabase
      .from("move_requests")
      .delete()
      .eq("id", req.id);

    setDeletingId(null);
    if (reqError) {
      console.error(reqError);
      toast.error("삭제 실패: " + reqError.message);
      return;
    }

    toast.success("요청이 삭제되었어요");
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  };

  if (authLoading || loading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-mint-500" />
      </div>
    );
  }

  const matchedList = requests.filter((r) => r.status === "matched");
  const openList = requests.filter((r) => r.status === "open");
  const otherList = requests.filter(
    (r) => r.status !== "matched" && r.status !== "open"
  );

  const renderCard = (req: MoveRequest) => {
    const status = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.open;
    const remaining = getRemainingTime(req.bid_deadline);
    const isOpen = req.status === "open";
    const isMatched = req.status === "matched";
    const isDeletable = ["cancelled", "completed", "expired"].includes(
      req.status
    );

    return (
      <div key={req.id} className="relative">
        <Link
          href={`/my/requests/${req.id}`}
          className={`block rounded-2xl border p-4 transition hover:shadow-sm ${
            isMatched
              ? "border-blue-300 bg-blue-50/30 hover:border-blue-400"
              : isDeletable
              ? "border-gray-100 bg-gray-50/50 hover:border-gray-300"
              : "border-gray-100 bg-white hover:border-mint-300"
          }`}
        >
          {/* 상태 + 남은 시간 */}
          <div className="flex items-center justify-between mb-3">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${status.bg} ${status.color}`}
            >
              {status.label}
            </span>
            {isOpen && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-600">
                <Clock className="h-3 w-3" />
                {remaining}
              </span>
            )}
          </div>

          {/* 이사 종류·공간 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-gray-900">
              {req.service_type
                ? SERVICE_TYPE_LABELS[req.service_type]
                : "이사"}
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-600">
              {MOVE_TYPE_LABELS[req.move_type] ?? req.move_type}
            </span>
            {req.is_urgent && (
              <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                긴급
              </span>
            )}
          </div>

          {/* 주소 요약 */}
          <div className="flex items-start gap-1.5 text-xs text-gray-600 mb-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-mint-600" />
            <div className="flex-1 line-clamp-1">
              {req.from_address} → {req.to_address}
            </div>
          </div>

          {/* 날짜 */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-mint-600" />
            <span>{req.preferred_date}</span>
          </div>

          {/* 매칭된 기사 정보 미리보기 */}
          {isMatched && req.selected_driver_name && (
            <div className="flex items-center justify-between rounded-xl bg-white border border-blue-200 px-3 py-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
                  <UserIcon className="h-3.5 w-3.5 text-blue-700" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 leading-tight">
                    선택한 기사님
                  </div>
                  <div className="text-xs font-bold text-gray-900">
                    {req.selected_driver_name}
                  </div>
                </div>
              </div>
              {req.selected_price != null && (
                <div className="text-sm font-bold text-blue-700">
                  {req.selected_price.toLocaleString("ko-KR")}원
                </div>
              )}
            </div>
          )}

          {/* 푸터 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              {isMatched ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    매칭 완료 — 자세히 보기
                  </span>
                </>
              ) : (
                <>
                  <Users className="h-3.5 w-3.5 text-mint-600" />
                  <span className="font-medium">
                    받은 견적{" "}
                    <span className="text-mint-700 font-bold">
                      {req.bid_count ?? 0}
                    </span>
                    건
                  </span>
                </>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </Link>

        {/* 삭제 버튼 (종료된 요청만) */}
        {isDeletable && (
          <button
            onClick={(e) => handleDelete(e, req)}
            disabled={deletingId === req.id}
            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 disabled:opacity-50 transition"
            title="삭제"
          >
            {deletingId === req.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3">
        <Link href="/" className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold">내 견적 요청</h1>
      </header>

      <div className="px-5 pt-4 pb-10">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">
              아직 요청한 견적이 없어요
            </h2>
            <p className="text-sm text-gray-500 mb-6 text-center">
              지금 견적을 요청하고
              <br />
              기사님들의 입찰을 받아보세요
            </p>
            <Link href="/request">
              <Button className="h-12 px-8 bg-mint-500 hover:bg-mint-600 text-white font-bold rounded-xl">
                견적 요청하기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-gray-500">총 {requests.length}건</p>

            {matchedList.length > 0 && (
              <section>
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-gray-900">
                    매칭 완료 ({matchedList.length})
                  </h2>
                </div>
                <div className="space-y-3">{matchedList.map(renderCard)}</div>
              </section>
            )}

            {openList.length > 0 && (
              <section>
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="h-4 w-4 text-mint-600" />
                  <h2 className="text-sm font-bold text-gray-900">
                    입찰 받는 중 ({openList.length})
                  </h2>
                </div>
                <div className="space-y-3">{openList.map(renderCard)}</div>
              </section>
            )}

            {otherList.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-gray-500">
                    지난 요청 ({otherList.length})
                  </h2>
                  <span className="text-[11px] text-gray-400">
                    🗑 버튼으로 삭제 가능
                  </span>
                </div>
                <div className="space-y-3">{otherList.map(renderCard)}</div>
              </section>
            )}

            <Link href="/request" className="block pt-2">
              <Button
                variant="outline"
                className="w-full h-12 border-mint-200 text-mint-600 font-bold rounded-xl hover:bg-mint-50"
              >
                + 새 견적 요청하기
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
