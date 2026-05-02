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
  status: "open" | "matched" | "completed" | "cancelled";
  bid_deadline: string;
  created_at: string;
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

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  open: { label: "입찰 중", color: "text-mint-700", bg: "bg-mint-50" },
  matched: { label: "매칭 완료", color: "text-blue-700", bg: "bg-blue-50" },
  completed: { label: "완료", color: "text-gray-600", bg: "bg-gray-100" },
  cancelled: { label: "취소", color: "text-red-600", bg: "bg-red-50" },
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

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error("로그인이 필요합니다");
      router.push("/login");
      return;
    }

    const fetchRequests = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("move_requests")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("요청 조회 실패:", error);
        toast.error("요청 목록을 불러오지 못했어요");
        setLoading(false);
        return;
      }

      // 입찰 수 카운트
      const requestIds = (data || []).map((r) => r.id);
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

      const enriched = (data || []).map((r) => ({
        ...r,
        bid_count: bidCounts[r.id] || 0,
      }));

      setRequests(enriched);
      setLoading(false);
    };

    fetchRequests();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-mint-500" />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3">
        <Link href="/" className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold">내 견적 요청</h1>
      </header>

      <div className="px-5 pt-4 pb-10">
        {requests.length === 0 ? (
          /* 빈 상태 */
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
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-2">
              총 {requests.length}건
            </p>
            {requests.map((req) => {
              const status = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.open;
              const remaining = getRemainingTime(req.bid_deadline);
              const isOpen = req.status === "open";

              return (
                <Link
                  key={req.id}
                  href={`/my/requests/${req.id}`}
                  className="block rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-mint-300 hover:shadow-sm"
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

                  {/* 푸터: 입찰 수 + 화살표 */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Users className="h-3.5 w-3.5 text-mint-600" />
                      <span className="font-medium">
                        받은 견적{" "}
                        <span className="text-mint-700 font-bold">
                          {req.bid_count ?? 0}
                        </span>
                        건
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              );
            })}

            {/* 새 요청 버튼 */}
            <Link href="/request" className="block pt-4">
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
