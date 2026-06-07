"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Truck,
  Inbox,
  LogOut,
  ChevronRight,
  Loader2,
  Shield,
  CheckCircle2,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/supabase/auth";
import { DeleteAccountButton } from "@/components/auth/DeleteAccountButton";

const VERIFICATION_LABELS: Record<
  string,
  { label: string; color: string; bg: string; icon: typeof Shield }
> = {
  unverified: {
    label: "미인증",
    color: "text-gray-600",
    bg: "bg-gray-100",
    icon: Shield,
  },
  pending: {
    label: "심사 중",
    color: "text-orange-700",
    bg: "bg-orange-50",
    icon: Loader2,
  },
  verified: {
    label: "인증 기사",
    color: "text-mint-700",
    bg: "bg-mint-50",
    icon: CheckCircle2,
  },
  veteran: {
    label: "베테랑 기사",
    color: "text-purple-700",
    bg: "bg-purple-50",
    icon: Award,
  },
};

export default function MyPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (!confirm("로그아웃 하시겠어요?")) return;

    setSigningOut(true);
    const { error } = await signOut();
    setSigningOut(false);

    if (error) {
      toast.error("로그아웃 실패: " + error.message);
      return;
    }

    toast.success("로그아웃 되었어요");
    router.push("/");
    router.refresh();
  };

  if (authLoading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-mint-500" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="app-container">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3">
          <Link href="/" className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-bold">마이페이지</h1>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-5">
          <p className="text-sm text-gray-600 mb-4">로그인이 필요합니다</p>
          <Link
            href="/login"
            className="rounded-full bg-mint-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-mint-700"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  const isDriver = profile.role === "driver";
  const verificationLevel = profile.verification_level ?? "unverified";
  const verifyConfig =
    VERIFICATION_LABELS[verificationLevel] ?? VERIFICATION_LABELS.unverified;
  const VerifyIcon = verifyConfig.icon;

  return (
    <div className="app-container pb-10">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3">
        <Link href="/" className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold">마이페이지</h1>
      </header>

      <div className="px-5 pt-5">
        {/* 프로필 카드 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint-100">
              <UserIcon className="h-7 w-7 text-mint-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h2 className="text-base font-bold text-gray-900 truncate">
                  {profile.name}
                </h2>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isDriver
                      ? "bg-blue-50 text-blue-700"
                      : "bg-mint-50 text-mint-700"
                  }`}
                >
                  {isDriver ? "기사" : "고객"}
                </span>
              </div>
              {isDriver && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${verifyConfig.bg} ${verifyConfig.color}`}
                >
                  <VerifyIcon
                    className={`h-3 w-3 ${
                      verificationLevel === "pending" ? "animate-spin" : ""
                    }`}
                  />
                  {verifyConfig.label}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>{profile.phone}</span>
            </div>
            {isDriver && profile.vehicle_type && (
              <div className="flex items-center gap-2 text-gray-700">
                <Truck className="h-4 w-4 text-gray-400" />
                <span>
                  {profile.vehicle_type}
                  {profile.vehicle_number && ` · ${profile.vehicle_number}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 메뉴 */}
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden mb-4">
          {!isDriver ? (
            <Link
              href="/my/requests"
              className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <Inbox className="h-5 w-5 text-mint-600" />
                <span className="text-sm font-medium text-gray-800">
                  내 견적 요청
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          ) : (
            <>
              <Link
                href="/driver/requests"
                className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition border-b border-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Inbox className="h-5 w-5 text-mint-600" />
                  <span className="text-sm font-medium text-gray-800">
                    견적 요청 보기
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
              {verificationLevel === "unverified" && (
                <Link
                  href="/driver/verify"
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-mint-600" />
                    <span className="text-sm font-medium text-gray-800">
                      기사 인증 받기
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              )}
            </>
          )}
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center justify-center gap-1.5 w-full h-11 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 mb-3"
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              로그아웃
            </>
          )}
        </button>

        {/* 회원 탈퇴 */}
        <div className="pt-6 mt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-3 text-center">
            계정 관리
          </p>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
