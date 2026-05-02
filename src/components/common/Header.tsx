"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [matchedCount, setMatchedCount] = useState(0);

  // 기사 계정: 매칭된 입찰(selected) 개수 카운트 + Realtime 구독
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

    // Realtime 구독: 내 입찰이 변경되면 카운트 다시 조회
    const channel = supabase
      .channel(`header-bids-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bids",
          filter: `driver_id=eq.${user.id}`,
        },
        () => {
          fetchMatchedCount();
        }
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
          {/* 고객: 내 견적 버튼 */}
          {profile.role === "customer" && (
            <Link
              href="/my/requests"
              className="flex items-center gap-1 rounded-full bg-mint-50 px-2.5 py-1 text-xs font-semibold text-mint-700 hover:bg-mint-100 transition"
            >
              <FileText className="h-3.5 w-3.5" />
              내 견적
            </Link>
          )}

          {/* 기사: 요청 보기 버튼 + 매칭 알림 뱃지 */}
          {profile.role === "driver" && (
            <Link
              href="/driver/requests"
              className="relative flex items-center gap-1 rounded-full bg-mint-50 px-2.5 py-1 text-xs font-semibold text-mint-700 hover:bg-mint-100 transition"
            >
              <FileText className="h-3.5 w-3.5" />
              요청 보기
              {matchedCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse"
                  aria-label={`매칭 ${matchedCount}건`}
                >
                  {matchedCount > 9 ? "9+" : matchedCount}
                </span>
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
