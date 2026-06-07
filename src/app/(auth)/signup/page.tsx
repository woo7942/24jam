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
import {
  VEHICLE_TYPES,
  SERVICE_AREAS,
} from "@/lib/constants/driver-options";

type Step = "role" | "basic" | "driver_info";

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") as UserRole | null;

  const [step, setStep] = useState<Step>(
    initialRole === "driver" || initialRole === "customer" ? "basic" : "role"
  );
  const [role, setRole] = useState<UserRole | null>(initialRole);
  const [loading, setLoading] = useState(false);

  // 기본 정보
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // 기사 정보
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState("");

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep("basic");
  };

  const toggleArea = (area: string) => {
    setServiceAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  // 기본 정보 검증 후 다음 단계
  const handleBasicNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("이름을 입력해주세요");
      return;
    }

    if (!/^010\d{8}$/.test(phone.replace(/-/g, ""))) {
      toast.error("올바른 휴대폰 번호를 입력해주세요 (예: 01012345678)");
      return;
    }

    if (!email.trim()) {
      toast.error("이메일을 입력해주세요");
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

    if (role === "driver") {
      // 기사는 다음 단계로
      setStep("driver_info");
    } else {
      // 고객은 바로 가입
      handleFinalSubmit();
    }
  };

  // 기사 정보 검증 후 가입
  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleType) {
      toast.error("차량 종류를 선택해주세요");
      return;
    }

    if (serviceAreas.length === 0) {
      toast.error("활동 지역을 1개 이상 선택해주세요");
      return;
    }

    handleFinalSubmit();
  };

  // 실제 가입 호출
  const handleFinalSubmit = async () => {
    if (!role) {
      toast.error("가입 유형을 선택해주세요");
      setStep("role");
      return;
    }

    setLoading(true);

    const params = {
      email,
      password,
      name,
      phone: phone.replace(/-/g, ""),
      role,
      ...(role === "driver" && {
        vehicleType: vehicleType || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        serviceAreas: serviceAreas.length > 0 ? serviceAreas : undefined,
        yearsOfExperience: yearsOfExperience
          ? parseInt(yearsOfExperience)
          : undefined,
      }),
    };

    const { error } = await signUp(params);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("가입이 완료되었습니다! 이메일을 확인해주세요");
    router.push("/login");
  };

  // ============== Step 1: 역할 선택 ==============
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

  // 진행률 표시 (기사만 2단계)
  const totalSteps = role === "driver" ? 2 : 1;
  const currentStep = step === "basic" ? 1 : 2;

  // ============== Step 2: 기본 정보 ==============
  if (step === "basic") {
    return (
      <div className="app-container">
        <header className="flex h-14 items-center px-3">
          <button onClick={() => setStep("role")} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </header>

        <div className="px-5 pt-4 pb-10">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="inline-block rounded-full bg-mint-50 px-3 py-1 text-xs font-semibold text-mint-700">
                {role === "customer" ? "👤 이사 고객" : "🚚 화물 기사"}
              </div>
              {role === "driver" && (
                <div className="inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  {currentStep}/{totalSteps} 단계
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">기본 정보</h1>
            <p className="text-gray-600 text-sm">
              {role === "driver"
                ? "다음 단계에서 차량 정보를 입력해요"
                : "회원가입을 위한 기본 정보를 입력해주세요"}
            </p>
          </div>

          <form onSubmit={handleBasicNext} className="space-y-4">
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
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : role === "driver" ? (
                "다음 단계로"
              ) : (
                "가입하기"
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-3 leading-relaxed">
              가입 시 <span className="underline">이용약관</span> 및{" "}
              <span className="underline">개인정보처리방침</span>에 동의하게 됩니다.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ============== Step 3: 기사 차량/지역 정보 ==============
  return (
    <div className="app-container">
      <header className="flex h-14 items-center px-3">
        <button onClick={() => setStep("basic")} className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>

      <div className="px-5 pt-4 pb-10">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="inline-block rounded-full bg-mint-50 px-3 py-1 text-xs font-semibold text-mint-700">
              🚚 화물 기사
            </div>
            <div className="inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
              2/2 단계
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">차량 & 활동 정보</h1>
          <p className="text-gray-600 text-sm">
            가입 후에도 마이페이지에서 수정할 수 있어요
          </p>
        </div>

        <form onSubmit={handleDriverSubmit} className="space-y-6">
          {/* 차량 종류 */}
          <div className="space-y-3">
            <Label>
              차량 종류 <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {VEHICLE_TYPES.map((vt) => {
                const selected = vehicleType === vt.value;
                return (
                  <button
                    key={vt.value}
                    type="button"
                    onClick={() => setVehicleType(vt.value)}
                    className={`rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-mint-500 bg-mint-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-base">{vt.emoji}</span>
                      <span className="font-bold text-sm text-gray-900">
                        {vt.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{vt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 차량 번호 */}
          <div className="space-y-2">
            <Label htmlFor="vehicleNumber">차량 번호 (선택)</Label>
            <Input
              id="vehicleNumber"
              placeholder="예: 12가1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="h-12"
              maxLength={10}
            />
            <p className="text-xs text-gray-500">
              나중에 인증 단계에서 활용돼요
            </p>
          </div>

          {/* 경력 */}
          <div className="space-y-2">
            <Label htmlFor="years">경력 (선택)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="years"
                type="number"
                inputMode="numeric"
                placeholder="3"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                className="h-12 flex-1"
                min={0}
                max={50}
              />
              <span className="text-sm text-gray-600">년</span>
            </div>
          </div>

          {/* 활동 지역 */}
          <div className="space-y-3">
            <div>
              <Label>
                활동 지역 <span className="text-red-500">*</span>
              </Label>
              <p className="mt-1 text-xs text-gray-500">
                여러 곳 선택 가능 ({serviceAreas.length}개 선택됨)
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SERVICE_AREAS.map((area) => {
                const selected = serviceAreas.includes(area.value);
                return (
                  <button
                    key={area.value}
                    type="button"
                    onClick={() => toggleArea(area.value)}
                    className={`rounded-lg border py-2.5 text-sm font-medium transition ${
                      selected
                        ? "border-mint-500 bg-mint-500 text-white"
                        : "border-gray-200 bg-white text-gray-700"
                    }`}
                  >
                    {area.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 안내 박스 */}
          <div className="rounded-xl bg-mint-50 border border-mint-200 p-4">
            <p className="text-xs font-bold text-mint-900 mb-1">
              💡 인증 배지를 받으면
            </p>
            <p className="text-xs text-mint-800 leading-relaxed">
              가입 후 마이페이지에서 차량등록증·면허증을 제출하면 "인증 기사"
              배지를 받을 수 있어요. 인증된 기사님은 고객에게 더 신뢰를 받고
              상위 노출됩니다.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-mint-500 hover:bg-mint-600 text-white font-bold mt-2"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "가입 완료"
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center leading-relaxed">
            가입 시 <span className="underline">이용약관</span> 및{" "}
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
