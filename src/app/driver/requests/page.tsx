"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Package,
  ChevronRight,
  Loader2,
  Inbox,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
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
  status: "open" | "matched" | "completed" | "cancelled";
  bid_deadline: string;
  box_count: number;
  created_at: string;
  has_my_bid?: boolean;
  bid_count?: number;
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

function getRemainingTime(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { text: "마감", expired: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return {
    text: h > 0 ? `${h}시간 ${m}분 남음` : `${m}분 남음`,
    expired: false,
  };
}

export default function DriverRequestsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<MoveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error("로그인이 필요합니다");
      router.push("/login");
      return;
    }

    if (profile && profile.role !== "driver") {
      toast.error("기사 전용 페이지입니다");
      router.push("/");
      return;
    }

    if (!profile) return;

    const loadRequests = async () => {
      const supabase = createClient();

      const { data: requestsData, error: requestsError } = await supabase
        .from("move_requests")
        .select("*")
        .eq("status", "open")
        .gt("bid_deadline", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (requestsError) {
        console.error("요청 조회 실패:", requestsError);
        toast.error("요청 목록을 불러오지 못했어요");
        setLoading(false);
        return;
      }

      const { data: myBids } = await supabase
        .from("bids")
        .select("request_id")
        .eq("driver_id", user.id);

      const myBidRequestIds = new Set(
        (myBids || []).map((b) => b.request_id)
      );

      const requestIds = (requestsData || []).map((r) => r.id);
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

      const enriched = (requestsData || []).map((r) => ({
        ...r,
        has_my_bid: myBidRequestIds.has(r.id),
        bid_count: bidCounts[r.id] || 0,
      }));

      setRequests(enriched);
      setLoading(false);
    };

    loadRequests();
  }, [user, profile, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-mint-500" />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3">
        <Link href="/" className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold">입찰 가능한 요청</h1>
      </header>

      <div className="px-5 pt-4 pb-10">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">
              지금은 입찰 가능한 요청이 없어요
            </h2>
            <p className="text-sm text-gray-500 text-center">
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
                  className="block rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-mint-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {req.has_my_bid && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2 py-0.5 text-[11px] font-bold text-mint-700">
                          <CheckCircle2 className="h-3 w-3" />
                          입찰 완료
                        </span>
                      )}
                      {req.is_urgent && (
                        <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                          긴급
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-600">
                      <Clock className="h-3 w-3" />
                      {remaining.text}
                    </span>
                  </div>

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
                  </div>

                  <div className="flex items-start gap-1.5 text-xs text-gray-600 mb-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-mint-600" />
                    <div className="flex-1 line-clamp-1">
                      {req.from_address} → {req.to_address}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-mint-600" />
                      <span>
                        {req.preferred_date} ·{" "}
                        {TIME_SLOT_LABELS[req.time_slot] ?? req.time_slot}
                      </span>
                    </div>
                  </div>

                  {req.box_count > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
                      <Package className="h-3.5 w-3.5 text-mint-600" />
                      <span>박스 {req.box_count}개</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-500">
                      현재 입찰{" "}
                      <span className="text-mint-700 font-bold">
                        {req.bid_count}
                      </span>
                      건
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
