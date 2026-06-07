"use client";

import Link from "next/link";
import { ShieldCheck, ShieldAlert, Clock, Star } from "lucide-react";

interface VerificationBannerProps {
  level: "unverified" | "pending" | "verified" | "veteran" | null;
  className?: string;
}

export function VerificationBanner({ level, className = "" }: VerificationBannerProps) {
  if (!level || level === "verified" || level === "veteran") {
    return null; // 인증 완료된 경우 배너 안 보여줌
  }

  if (level === "pending") {
    return (
      <div
        className={`rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm mb-1">
              심사 진행 중이에요
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              제출하신 서류를 검토 중입니다. 보통 1~2일 안에 인증이 완료돼요.
              인증 후 입찰이 가능해집니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // unverified
  return (
    <div
      className={`rounded-2xl border-2 border-mint-200 bg-mint-50 p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 shrink-0 text-mint-600 mt-0.5" />
        <div className="flex-1">
          <div className="font-bold text-mint-900 text-sm mb-1">
            기사 인증을 완료해주세요
          </div>
          <p className="text-xs text-mint-800 leading-relaxed mb-3">
            서류를 제출하면 "인증 기사" 배지를 받고 입찰을 시작할 수 있어요.
          </p>
          <Link
            href="/driver/verify"
            className="inline-flex items-center gap-1.5 rounded-full bg-mint-600 px-4 py-2 text-xs font-bold text-white hover:bg-mint-700"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            서류 제출하러 가기
          </Link>
        </div>
      </div>
    </div>
  );
}

// 인증 배지 (목록에 작게 표시용)
export function VerificationBadge({
  level,
}: {
  level: "unverified" | "pending" | "verified" | "veteran" | null;
}) {
  if (!level || level === "unverified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
        미인증
      </span>
    );
  }

  if (level === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
        <Clock className="h-2.5 w-2.5" />
        심사중
      </span>
    );
  }

  if (level === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-mint-100 px-2 py-0.5 text-[10px] font-bold text-mint-700">
        <ShieldCheck className="h-2.5 w-2.5" />
        인증
      </span>
    );
  }

  // veteran
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
      <Star className="h-2.5 w-2.5" />
      베테랑
    </span>
  );
}
