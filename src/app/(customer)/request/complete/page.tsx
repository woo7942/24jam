"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Users, Bell, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function CompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("id");

  // 입찰 마감까지 남은 시간 (2시간 = 7200초)
  const [secondsLeft, setSecondsLeft] = useState(2 * 60 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;
  const timeText = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="app-container">
      <div className="px-5 pt-12 pb-8">
        {/* 성공 아이콘 */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-mint-200 animate-ping opacity-30" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-mint-500">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">
          견적 요청이 등록됐어요!
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          기사님들이 입찰을 시작합니다
        </p>

        {/* 카운트다운 */}
        <div className="rounded-2xl bg-gradient-to-br from-mint-500 to-mint-600 p-6 text-white mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold opacity-90">입찰 마감까지</span>
          </div>
          <div className="text-4xl font-bold tabular-nums tracking-tight">
            {timeText}
          </div>
          <div className="mt-3 text-xs opacity-90">
            마감 후 들어온 견적을 비교해 선택할 수 있어요
          </div>
        </div>

        {/* 안내 카드 */}
        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-50 text-mint-600">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-900 mb-0.5">
                기사님들이 견적을 보내드려요
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                평균 5~10명의 기사님이 입찰합니다.
                <br />
                들어온 견적은 실시간으로 확인할 수 있어요.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-gray-100 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-50 text-mint-600">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-900 mb-0.5">
                새 견적이 오면 알려드려요
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                기사님이 입찰할 때마다 알림이 옵니다.
                <br />
                마음에 드는 견적을 골라 결제만 하면 끝!
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-2">
          <Link href={requestId ? `/my/requests/${requestId}` : "/my/requests"}>
            <Button className="w-full h-14 bg-mint-500 hover:bg-mint-600 text-white text-base font-bold rounded-xl">
              내 견적 보러가기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="w-full h-12 border-gray-200 text-gray-600 font-semibold rounded-xl"
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RequestCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="app-container flex items-center justify-center min-h-screen">
          <Loader2 className="h-6 w-6 animate-spin text-mint-500" />
        </div>
      }
    >
      <CompleteContent />
    </Suspense>
  );
}
