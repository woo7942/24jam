"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, User, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, type UserRole } from "@/lib/supabase/auth";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") as UserRole | null;

const [step, setStep] = useState<"role" | "form">(
  initialRole === "driver" || initialRole === "customer" ? "form" : "role"
);
const [role, setRole] = useState<UserRole | null>(initialRole);
const [loading, setLoading] = useState(false);


  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!role) {
    toast.error("가입 유형을 선택해주세요");
    setStep("role");
    return;
  }

    if (password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다");
      return;
    }

    if (password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }

    if (!/^010\d{8}$/.test(phone.replace(/-/g, ""))) {
      toast.error("올바른 휴대폰 번호를 입력해주세요 (예: 01012345678)");
      return;
    }

    setLoading(true);
    const { error } = await signUp({
      email,
      password,
      name,
      phone: phone.replace(/-/g, ""),
      role,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("가입이 완료되었습니다! 이메일을 확인해주세요");
    router.push("/login");
  };

  // Step 1: 역할 선택
  if (step === "role") {
    return (
      <div className="app-container">
        <header className="flex h-14 items-center px-3">
          <Link href="/" className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </header>

        <div className="px-5 pt-4">
          <h1 className="text-2xl font-bold mb-2">어떻게 가입하시나요?</h1>
          <p className="text-gray-600 text-sm mb-8">가입 유형을 선택해주세요</p>

          <button
            onClick={() => handleRoleSelect("customer")}
            className="w-full text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-mint-500 hover:bg-mint-50 transition mb-3"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint-100 text-mint-600">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-base mb-1">이사하는 고객</div>
                <div className="text-sm text-gray-600">
                  견적을 받고 기사님을 선택하고 싶어요
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("driver")}
            className="w-full text-left p-5 rounded-2xl border-2 border-gray-200 hover:border-mint-500 hover:bg-mint-50 transition"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint-100 text-mint-600">
                <Truck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-base mb-1">화물 기사</div>
                <div className="text-sm text-gray-600">
                  이사 의뢰를 받고 견적을 보내고 싶어요
                </div>
              </div>
            </div>
          </button>

          <div className="text-center mt-8 text-sm">
            <span className="text-gray-600">이미 회원이신가요? </span>
            <Link href="/login" className="text-mint-600 font-semibold">
              로그인
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: 가입 폼
  return (
    <div className="app-container">
      <header className="flex h-14 items-center px-3">
        <button onClick={() => setStep("role")} className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>

      <div className="px-5 pt-4 pb-10">
        <div className="mb-6">
          <div className="inline-block rounded-full bg-mint-50 px-3 py-1 text-xs font-semibold text-mint-700 mb-3">
            {role === "customer" ? "👤 이사 고객" : role === "driver" ? "🚚 화물 기사" : ""}

          </div>
          <h1 className="text-2xl font-bold mb-2">회원가입</h1>
          <p className="text-gray-600 text-sm">
            기본 정보를 입력해주세요
            {role === "driver" && " (차량 정보는 가입 후 등록)"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">휴대폰 번호</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="01012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12"
              maxLength={13}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="6자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <Input
              id="passwordConfirm"
              type="password"
              placeholder="비밀번호 다시 입력"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="h-12"
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-mint-500 hover:bg-mint-600 text-white font-bold mt-6"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "가입하기"}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-3 leading-relaxed">
            가입 시{" "}
            <span className="underline">이용약관</span> 및{" "}
            <span className="underline">개인정보처리방침</span>에 동의하게 됩니다.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="app-container flex items-center justify-center min-h-screen">
          <Loader2 className="h-6 w-6 animate-spin text-mint-500" />
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
