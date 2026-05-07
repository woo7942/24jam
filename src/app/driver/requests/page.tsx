"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Package,
  Loader2,
  Inbox,
  CheckCircle2,
  Phone,
  Sparkles,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface MoveRequest {
  id: string;
  from_address: string;
  to_address: string;
  preferred_date: string;
  time_slot: string;
  service_type: string;
  move_type: string;
  box_count: number;
  bid_deadline: string;
  status: string;
  has_my_bid?: boolean;
  bid_count?: number;
}

interface MatchedRequest {
  bid_id: string;
  request_id: string;
  price: number;
  message: string | null;
  estimated_duration_min: number | null;
  bid_created_at: string;
  from_address: string;
  to_address: string;
  preferred_date: string;
  time_slot: string;
  service_type: string;
  move_type: string;
  box_count: number;
  notes: string | null;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  request_status: string;
  matched_at: string;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  general: "일반이사",
  half_packing: "반포장이사",
  full_packing: "포장이사",
};

const MOVE_TYPE_LABELS: Record<string, string> = {
  studio: "원룸",
  small: "1.5룸",
  medium: "투룸",
  large: "쓰리룸 이상",
};

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
  anytime: "시간 무관",
};

function getRemainingTime(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "마감";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  return `${minutes}분 남음`;
}

export default function DriverRequestsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<MoveRequest[]>([]);
  const [matched, setMatched] = useState<MatchedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    // 1. 매칭된 요청
    const { data: matchedData, error: matchedError } = await supabase.rpc(
      "get_my_matched_requests"
    );
    if (matchedError) {
      console.error("매칭 조회 실패:", matchedError);
    } else {
      setMatched(matchedData || []);
    }

    // 2. 입찰 가능한 요청
    const { data: requestsData, error: requestsError } = await supabase
      .from("move_requests")
      .select("*")
      .eq("status", "open")
      .gt("bid_deadline", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (requestsError) {
      console.error(requestsError);
      toast.error("요청 목록을 불러오지 못했어요");
      setLoading(false);
      return;
    }

    const { data: myBids } = await supabase
      .from("bids")
      .select("request_id")
      .eq("driver_id", user.id);
    const myBidIds = new Set((myBids || []).map((b) => b.request_id));
    const requestIds = (requestsData || []).map((r) => r.id);

    let bidCounts: Record<string, number> = {};
    if (requestIds.length) {
      const { data: allBids } = await supabase
        .from("bids")
        .select("request_id")
        .in("request_id", requestIds);
      bidCounts = (allBids || []).reduce(
        (a: Record<string, number>, b) => {
          a[b.request_id] = (a[b.request_id] || 0) + 1;
          return a;
        },
        {}
      );
    }

    const enriched = (requestsData || []).map((r) => ({
      ...r,
      has_my_bid: myBidIds.has(r.id),
      bid_count: bidCounts[r.id] || 0,
    }));

    setRequests(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error("로그인이 필요합니다");
      router.push("/login");
      return;
    }
    if (profile?.role !== "driver") {
      toast.error("기사 전용 페이지입니다");
      router.push("/");
      return;
    }
    loadData();
  }, [user, profile, authLoading, router, loadData]);

  // 🔔 Realtime 구독
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`driver-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "move_requests",
        },
        (payload) => {
          const newReq = payload.new as { status?: string };
          if (newReq.status === "open") {
            toast.success("📦 새로운 요청이 도착했어요!", {
              description: "지금 바로 입찰해보세요",
              duration: 5000,
            });
            loadData();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "move_requests",
        },
        (payload) => {
          const newReq = payload.new as { status?: string };
          const oldReq = payload.old as { status?: string };
          if (newReq.status !== oldReq.status) {
            // 내 매칭 요청이 completed 되면 토스트
            if (newReq.status === "completed") {
              toast.success("🎉 고객님이 이사 완료를 확인했어요!", {
                description: "수고하셨습니다.",
                duration: 5000,
              });
            }
            loadData();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bids",
          filter: `driver_id=eq.${user.id}`,
        },
        (payload) => {
          const newRow = payload.new as { status?: string };
          if (newRow.status === "selected") {
            toast.success("🎉 새로운 매칭이 도착했어요!", {
              description: "고객님이 회원님을 선택했습니다.",
              duration: 6000,
            });
            loadData();
          } else if (newRow.status === "rejected") {
            toast("😢 다른 기사님이 선택되었어요", {
              description: "다음 기회에 다시 도전해보세요!",
              duration: 5000,
            });
            loadData();
          } else if (newRow.status === "cancelled") {
            toast("⚠️ 고객이 요청을 취소했어요", {
              description: "다른 요청을 확인해보세요.",
              duration: 5000,
            });
            loadData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadData]);

  // 이사 완료 요청 (matched → pending_completion)
  const handleCompleteRequest = async (
    requestId: string,
    customerName: string
  ) => {
    if (
      !confirm(
        `${customerName} 고객님의 이사를 완료하셨나요?\n\n고객님께 완료 확인 요청을 보냅니다.\n고객이 확인하면 정식 완료 처리됩니다.`
      )
    ) {
      return;
    }

    setCompleting(requestId);
    const supabase = createClient();

    const { error } = await supabase
      .from("move_requests")
      .update({ status: "pending_completion" })
      .eq("id", requestId);

    setCompleting(null);
    if (error) {
      console.error(error);
      toast.error("완료 요청 실패: " + error.message);
      return;
    }

    toast.success("고객 확인을 기다리고 있어요");
    // 로컬 상태 즉시 반영
    setMatched((prev) =>
      prev.map((m) =>
        m.request_id === requestId
          ? { ...m, request_status: "pending_completion" }
          : m
      )
    );
  };

  if (authLoading || loading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-mint-500" />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-white px-3">
        <Link href="/" className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold">기사 대시보드</h1>
      </header>

      <div className="px-5 pt-4 pb-10 space-y-6">
        {/* 🎉 매칭 완료된 요청 */}
        {matched.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-mint-600" />
              <h2 className="font-bold text-base">
                매칭 완료된 요청 ({matched.length}건)
              </h2>
            </div>
            <div className="space-y-3">
              {matched.map((m) => {
                const isMatched = m.request_status === "matched";
                const isPendingCompletion =
                  m.request_status === "pending_completion";
                const isCompleted = m.request_status === "completed";

                return (
                  <div
                    key={m.bid_id}
                    className={`rounded-2xl border-2 p-4 ${
                      isCompleted
                        ? "border-gray-200 bg-gray-50"
                        : isPendingCompletion
                        ? "border-orange-200 bg-orange-50/50"
                        : "border-mint-300 bg-mint-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-2">
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-gray-500" />
                          <span className="text-xs font-semibold text-gray-600">
                            이사 완료
                          </span>
                        </>
                      ) : isPendingCompletion ? (
                        <>
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="text-xs font-semibold text-orange-700">
                            고객 확인 대기 중
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-mint-600" />
                          <span className="text-xs font-semibold text-mint-700">
                            매칭 완료
                          </span>
                        </>
                      )}
                      <span className="ml-auto text-xs text-gray-500">
                        {new Date(m.matched_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700 border">
                        {SERVICE_TYPE_LABELS[m.service_type] || m.service_type}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700 border">
                        {MOVE_TYPE_LABELS[m.move_type] || m.move_type}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${
                          isCompleted ? "bg-gray-500" : "bg-mint-600"
                        }`}
                      >
                        {m.price.toLocaleString()}원
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-700 mb-3">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="truncate">출발: {m.from_address}</div>
                          <div className="truncate">도착: {m.to_address}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{m.preferred_date}</span>
                        <Clock className="h-3.5 w-3.5 text-gray-400 ml-2" />
                        <span>
                          {TIME_SLOT_LABELS[m.time_slot] || m.time_slot}
                        </span>
                      </div>
                      {m.box_count > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-gray-400" />
                          <span>박스 {m.box_count}개</span>
                        </div>
                      )}
                    </div>

                    {/* 고객 연락처 박스 */}
                    <div className="rounded-xl bg-white border p-3 mb-3">
                      <div className="text-[11px] font-semibold text-gray-500 mb-1">
                        고객 정보
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-sm">
                            {m.customer_name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {m.customer_phone}
                          </div>
                        </div>
                        {!isCompleted && (
                          <a
                            href={`tel:${m.customer_phone}`}
                            className="flex items-center gap-1 rounded-full bg-mint-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-mint-700"
                          >
                            <Phone className="h-3 w-3" />
                            전화
                          </a>
                        )}
                      </div>
                    </div>

                    {m.notes && (
                      <div className="text-xs text-gray-600 bg-white rounded-lg p-2 border mb-3">
                        💬 {m.notes}
                      </div>
                    )}

                    {/* 상태별 버튼 */}
                    {isMatched && (
                      <button
                        onClick={() =>
                          handleCompleteRequest(m.request_id, m.customer_name)
                        }
                        disabled={completing === m.request_id}
                        className="flex items-center justify-center gap-1.5 w-full h-11 rounded-xl bg-mint-600 hover:bg-mint-700 text-white text-sm font-bold disabled:opacity-50"
                      >
                        {completing === m.request_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <PackageCheck className="h-4 w-4" />
                            이사 완료했어요
                          </>
                        )}
                      </button>
                    )}

                    {isPendingCompletion && (
                      <div className="flex items-center justify-center gap-1.5 w-full h-11 rounded-xl bg-orange-100 text-orange-700 text-sm font-semibold">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        고객 확인 대기 중
                      </div>
                    )}

                    {isCompleted && (
                      <div className="flex items-center justify-center gap-1.5 w-full h-11 rounded-xl bg-gray-200 text-gray-600 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        이사가 완료되었어요
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 입찰 가능한 요청 */}
        <section>
          <h2 className="font-bold text-base mb-3">입찰 가능한 요청</h2>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm">지금은 입찰 가능한 요청이 없어요</h3>
              <p className="text-xs text-gray-500 mt-1">
                새 요청이 들어오면 알려드릴게요
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-2">
                총 {requests.length}건의 요청
              </p>
              {requests.map((req) => {
                const remaining = getRemainingTime(req.bid_deadline);
                return (
                  <Link
                    key={req.id}
                    href={`/driver/requests/${req.id}`}
                    className="block rounded-2xl border bg-white p-4 hover:border-mint-300 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {req.has_my_bid && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-semibold text-mint-700">
                            <CheckCircle2 className="h-3 w-3" />
                            입찰 완료
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-gray-500">
                          {remaining}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500">
                        입찰 {req.bid_count ?? 0}건
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                        {SERVICE_TYPE_LABELS[req.service_type] || req.service_type}
                      </span>
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                        {MOVE_TYPE_LABELS[req.move_type] || req.move_type}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-700">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="truncate">출발: {req.from_address}</div>
                          <div className="truncate">도착: {req.to_address}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{req.preferred_date}</span>
                        <Clock className="h-3.5 w-3.5 text-gray-400 ml-2" />
                        <span>{TIME_SLOT_LABELS[req.time_slot] || req.time_slot}</span>
                      </div>
                      {req.box_count > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-gray-400" />
                          <span>박스 {req.box_count}개</span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
