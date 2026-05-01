"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const STEPS = [
  { path: "/request", label: "주소" },
  { path: "/request/items", label: "짐 정보" },
  { path: "/request/schedule", label: "날짜" },
  { path: "/request/confirm", label: "확인" },
];

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const currentStepIndex = STEPS.findIndex((s) => s.path === pathname);
  const currentStep = currentStepIndex === -1 ? 0 : currentStepIndex;

  const handleBack = () => {
    if (currentStep === 0) {
      router.push("/");
    } else {
      router.back();
    }
  };

  return (
    <div className="app-container flex flex-col min-h-screen bg-white">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="flex h-14 items-center justify-between px-5">
          <button
            onClick={handleBack}
            className="text-gray-700 hover:text-mint-600"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-gray-700">
            {currentStep + 1} / {STEPS.length}
          </span>
          <div className="w-5" />
        </div>

        {/* 진행바 */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-mint-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* 단계 라벨 */}
        <div className="flex justify-between px-5 py-3">
          {STEPS.map((step, idx) => (
            <div
              key={step.path}
              className={`text-xs font-medium ${
                idx === currentStep
                  ? "text-mint-600 font-bold"
                  : idx < currentStep
                  ? "text-gray-400"
                  : "text-gray-300"
              }`}
            >
              {idx + 1}. {step.label}
            </div>
          ))}
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1 px-5 py-6">{children}</main>
    </div>
  );
}
