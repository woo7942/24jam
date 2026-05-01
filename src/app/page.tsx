import Link from "next/link";
import { ArrowRight, Check, Star, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/common/Header";

export default function LandingPage() {
  return (
    <div className="app-container">
      <Header />

      {/* 히어로 섹션 */}
<section className="px-5 pt-8 pb-12">
  <div className="inline-block rounded-full bg-mint-50 px-3 py-1 text-xs font-semibold text-mint-700 mb-4">
    🎉 원룸·소형 사무실 이사 전문
  </div>
  <h1 className="text-3xl font-bold leading-tight mb-3">
    이사도 <span className="text-mint-600">잼있게</span>,
    <br />
    이사잼
  </h1>
  <p className="text-gray-600 text-base leading-relaxed mb-6">
    이사 정보만 입력하면 검증된 기사님들이
    <br />
    직접 견적을 보내드려요. 비교하고 선택만 하세요.
  </p>


        <Link href="/request">
          <Button
            size="lg"
            className="w-full h-14 text-base bg-mint-500 hover:bg-mint-600 text-white font-bold shadow-lg shadow-mint-500/30"
          >
            지금 견적 받기 (무료)
            <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
        </Link>

        <p className="text-xs text-gray-500 text-center mt-3">
          평균 5명의 기사님이 입찰 · 2시간 내 견적 도착
        </p>
      </section>

      {/* 강점 3가지 */}
      <section className="px-5 py-8 bg-mint-50/50">
        <h2 className="text-2xl font-bold mb-2">왜 이사잼일까요?</h2>
        <div className="space-y-4">
          {[
            {
              icon: <Users className="h-5 w-5" />,
              title: "여러 견적 한번에 비교",
              desc: "기사님들이 직접 입찰해서 가장 저렴한 가격을 찾아드려요.",
            },
            {
              icon: <Check className="h-5 w-5" />,
              title: "검증된 기사님만",
              desc: "사업자등록·차량·보험 모두 확인된 기사님만 활동해요.",
            },
            {
              icon: <Star className="h-5 w-5" />,
              title: "실시간 후기 시스템",
              desc: "이전 고객 후기를 보고 안심하고 선택할 수 있어요.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 bg-white rounded-2xl p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint-100 text-mint-600">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-base mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 진행 과정 */}
      <section className="px-5 py-10">
        <h2 className="text-xl font-bold mb-6">이렇게 진행돼요</h2>
        <div className="space-y-5">
          {[
            { step: "01", title: "이사 정보 입력", desc: "출발지·도착지·짐 정보를 4단계로 간단히 입력" },
            { step: "02", title: "기사님 입찰 대기", desc: "최대 2시간 동안 기사님들이 견적을 보내요" },
            { step: "03", title: "비교하고 선택", desc: "가격·평점·후기를 보고 마음에 드는 기사 선택" },
            { step: "04", title: "이사 완료 후 결제", desc: "안전하게 이사 끝나면 결제하고 후기 작성" },
          ].map((item, idx, arr) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-500 text-white font-bold text-sm">
                  {item.step}
                </div>
                {idx < arr.length - 1 && <div className="w-0.5 flex-1 bg-mint-100 my-1" />}
              </div>
              <div className="pb-4">
                <h3 className="font-bold text-base mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 기사 모집 배너 */}
      <section className="mx-5 mb-8 rounded-2xl bg-gradient-to-br from-mint-600 to-mint-700 p-6 text-white">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-sm font-semibold opacity-90 mb-1">화물 기사님이신가요?</div>
            <h3 className="text-2xl font-bold mb-2">이사잼 기사로 등록하세요</h3>
<p className="opacity-90 mb-6">
  검증된 1인 가구 이사 매칭, 안정적인 수익을 만들어보세요
</p>

          </div>
          <Truck className="h-8 w-8 shrink-0 opacity-80" />
        </div>
        <Link href="/signup?role=driver">
          <Button
            variant="secondary"
            size="lg"
            className="w-full bg-white text-mint-700 hover:bg-mint-50 font-bold mt-3"
          >
            기사로 가입하기
          </Button>
        </Link>
      </section>

      {/* 푸터 */}
      <footer className="px-6 py-8 border-t border-gray-100">
  <p className="text-center text-sm text-gray-400">
    © 2026 이사잼(ISAJAM). All rights reserved.
  </p>
</footer>

    </div>
  );
}
