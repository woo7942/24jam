"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, FileText, Sparkles, Inbox } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [matchedCount, setMatchedCount] = useState(0); // 기사: 매칭된 입찰 수
  const [bidReceivedCount, setBidReceivedCount] = useState(0); // 고객: 입찰 받은 요청 수

  // 기사: 매칭된 입찰(selected) 카운트
  useEffect(() => {
    if (!user || !profile || profile.role !== "driver") {
      setMatchedCount(0);
      return;
    }

    const supabase = createClient();

    const fetchMatchedCount = async () => {
      const { count, error } = await supabase
        .from("bids")
        .select("id", { count: "exact", head: true })
        .eq("driver_id", user.id)
        .eq("status", "selected");

      if (error) {
        console.error("매칭 카운트 조회 실패:", error);
        return;
      }
      setMatchedCount(count ?? 0);
    };

    fetchMatchedCount();

    const channel = supabase
      .channel(`header-driver-bids-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bids",
          filter: `driver_id=eq.${user.id}`,
        },
        () => fetchMatchedCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  // 고객: 입찰 받은 진행 중 요청 카운트
  useEffect(() => {
    if (!user || !profile || profile.role !== "customer") {
      setBidReceivedCount(0);
      return;
    }

    const supabase = createClient();

    const fetchBidReceivedCount = async () => {
      // 1) 내 open 요청 ID 조회
      const { data: openReqs, error: e1 } = await supabase
        .from("move_requests")
        .select("id")
        .eq("customer_id", user.id)
        .eq("status", "open");

      if (e1) {
        console.error("요청 조회 실패:", e1);
        return;
      }

      const reqIds = (openReqs || []).map((r) => r.id);
      if (reqIds.length === 0) {
        setBidReceivedCount(0);
        return;
      }

      // 2) 그 요청들에 들어온 pending 입찰의 request_id 목록 가져오기
      const { data: bids, error: e2 } = await supabase
        .from("bids")
        .select("request_id")
        .in("request_id", reqIds)
        .eq("status", "pending");

      if (e2) {
        console.error("입찰 조회 실패:", e2);
        return;
      }

      // 3) 입찰이 1개 이상 있는 요청 개수 (중복 제거)
      const uniqueReqs = new Set((bids || []).map((b) => b.request_id));
      setBidReceivedCount(uniqueReqs.size);
    };

    fetchBidReceivedCount();

    // Realtime: 내 요청에 입찰이 추가/삭제/변경되면 다시 조회
    const channel = supabase
      .channel(`header-customer-bids-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bids",
        },
        () => fetchBidReceivedCount()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "move_requests",
          filter: `customer_id=eq.${user.id}`,
        },
        () => fetchBidReceivedCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("로그아웃 실패");
      return;
    }
    toast.success("로그아웃 되었습니다");
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-white/80 px-5 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-mint-500 flex items-center justify-center text-white font-bold">
          잼
        </div>
        <span className="font-bold text-lg">이사잼</span>
      </Link>

      {loading ? (
        <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
      ) : profile ? (
        <div className="flex items-center gap-2">
          {/* 고객: 내 견적 버튼 — 입찰 받았으면 빨간 강조 */}
          {profile.role === "customer" && (
            <Link
              href="/my/requests"
              className={
                bidReceivedCount > 0
                  ? "flex items-center gap-1 rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-red-600 transition animate-wiggle"
                  : "flex items-center gap-1 rounded-full bg-mint-50 px-2.5 py-1 text-xs font-semibold text-mint-700 hover:bg-mint-100 transition"
              }
            >
              {bidReceivedCount > 0 ? (
                <>
                  <Inbox className="h-3.5 w-3.5" />
                  견적 {bidReceivedCount}건 도착!
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  내 견적
                </>
              )}
            </Link>
          )}

          {/* 기사: 요청 보기 버튼 — 매칭됐으면 빨간 강조 */}
          {profile.role === "driver" && (
            <Link
              href="/driver/requests"
              className={
                matchedCount > 0
                  ? "flex items-center gap-1 rounded-full bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-red-600 transition animate-wiggle"
                  : "flex items-center gap-1 rounded-full bg-mint-50 px-2.5 py-1 text-xs font-semibold text-mint-700 hover:bg-mint-100 transition"
              }
            >
              {matchedCount > 0 ? (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  🎉 매칭 {matchedCount}건!
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" />
                  요청 보기
                </>
              )}
            </Link>
          )}

          <Link
            href="/my/requests"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
          >
            <UserIcon className="h-4 w-4" />
            {profile.name}
            {profile.role === "driver" && (
              <span className="text-xs text-mint-600 font-bold ml-1">기사</span>
            )}
          </Link>

          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600"
            title="로그아웃"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="text-sm text-gray-600 hover:text-mint-600"
        >
          로그인
        </Link>
      )}
    </header>
  );
}
