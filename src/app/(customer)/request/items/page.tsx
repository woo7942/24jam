"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useRequestStore,
  type MoveType,
  type ServiceType,
  type FurnitureItem,
} from "@/stores/requestStore";

const SERVICE_TYPES: {
  value: ServiceType;
  label: string;
  desc: string;
  highlight: string;
}[] = [
  {
    value: "general",
    label: "일반 이사",
    desc: "짐은 직접 싸시고, 기사님이 운반해드려요",
    highlight: "1인 가구·소형 사무실 추천",
  },
  {
    value: "half_packing",
    label: "반포장 이사",
    desc: "장롱·냉장고 등 큰 가구만 포장해드려요",
    highlight: "가성비 좋은 선택",
  },
  {
    value: "full_packing",
    label: "포장 이사",
    desc: "포장부터 정리까지 전부 도와드려요",
    highlight: "짐 많거나 시간 없을 때",
  },
];

const MOVE_TYPES: { value: MoveType; label: string; desc: string }[] = [
  { value: "one_room", label: "원룸", desc: "1인 가구 (5평 이하)" },
  { value: "one_half_room", label: "1.5룸", desc: "원룸 + 분리형 주방" },
  { value: "two_room", label: "투룸", desc: "방 2개 (10평 내외)" },
  { value: "small_office", label: "소형 사무실", desc: "10평 이하 사무실" },
];

const FURNITURE_LIST: { value: FurnitureItem; label: string; emoji: string }[] = [
  { value: "bed", label: "침대", emoji: "🛏️" },
  { value: "wardrobe", label: "옷장", emoji: "🚪" },
  { value: "desk", label: "책상", emoji: "🪑" },
  { value: "chair", label: "의자", emoji: "💺" },
  { value: "fridge", label: "냉장고", emoji: "🧊" },
  { value: "washer", label: "세탁기", emoji: "🧺" },
  { value: "tv", label: "TV", emoji: "📺" },
  { value: "sofa", label: "소파", emoji: "🛋️" },
  { value: "table", label: "식탁", emoji: "🍽️" },
  { value: "bookshelf", label: "책장", emoji: "📚" },
];

export default function Step2ItemsPage() {
  const router = useRouter();
  const store = useRequestStore();

  const [serviceType, setServiceType] = useState<ServiceType | null>(store.serviceType);
  const [moveType, setMoveType] = useState<MoveType | null>(store.moveType);
  const [furniture, setFurniture] = useState<FurnitureItem[]>(store.furnitureItems);
  const [boxCount, setBoxCount] = useState(store.boxCount);
  const [notes, setNotes] = useState(store.notes);

  const toggleFurniture = (item: FurnitureItem) => {
    setFurniture((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleNext = () => {
    if (!serviceType) {
      toast.error("이사 종류를 선택해주세요");
      return;
    }
    if (!moveType) {
      toast.error("이사 유형을 선택해주세요");
      return;
    }
    store.setStep2({
      serviceType,
      moveType,
      furnitureItems: furniture,
      boxCount,
      notes,
    });
    router.push("/request/schedule");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">어떤 짐이 있나요?</h1>
        <p className="text-sm text-gray-500">정확할수록 견적이 정확해져요</p>
      </div>

      {/* 이사 종류 (서비스 유형) */}
      <div className="space-y-3">
        <div>
          <Label>이사 종류</Label>
          <p className="mt-1 text-xs text-gray-400">
            차만 빌려드리지 않아요. 원하시는 서비스 범위를 선택하세요
          </p>
        </div>
        <div className="space-y-2">
          {SERVICE_TYPES.map((type) => {
            const selected = serviceType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setServiceType(type.value)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-mint-500 bg-mint-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{type.label}</div>
                    <div className="mt-1 text-xs text-gray-600">{type.desc}</div>
                    <div className="mt-2 inline-block rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-semibold text-mint-700">
                      {type.highlight}
                    </div>
                  </div>
                  <div
                    className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected
                        ? "border-mint-500 bg-mint-500"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {selected && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 이사 유형 (공간 크기) */}
      <div className="space-y-3">
        <Label>공간 크기</Label>
        <div className="grid grid-cols-2 gap-2">
          {MOVE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setMoveType(type.value)}
              className={`rounded-xl border p-4 text-left transition ${
                moveType === type.value
                  ? "border-mint-500 bg-mint-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="font-bold text-gray-900">{type.label}</div>
              <div className="mt-1 text-xs text-gray-500">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 가구 체크리스트 */}
      <div className="space-y-3">
        <Label>주요 가구 (해당되는 항목 선택)</Label>
        <div className="grid grid-cols-3 gap-2">
          {FURNITURE_LIST.map((item) => {
            const selected = furniture.includes(item.value);
            return (
              <button
                key={item.value}
                onClick={() => toggleFurniture(item.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition ${
                  selected
                    ? "border-mint-500 bg-mint-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 박스 개수 */}
      <div className="space-y-3">
        <Label htmlFor="boxCount">박스 개수 (대략): {boxCount}개</Label>
        <input
          id="boxCount"
          type="range"
          min={0}
          max={50}
          step={1}
          value={boxCount}
          onChange={(e) => setBoxCount(Number(e.target.value))}
          className="w-full accent-mint-500"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0개</span>
          <span>25개</span>
          <span>50개+</span>
        </div>
      </div>

      {/* 추가 메모 */}
      <div className="space-y-2">
        <Label htmlFor="notes">추가 메모 (선택)</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="예: 피아노 있음, 무거운 책 많음, 분해/조립 필요"
          className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm focus:border-mint-500 focus:outline-none"
          rows={4}
        />
      </div>

      <Button
        onClick={handleNext}
        className="w-full h-14 bg-mint-500 hover:bg-mint-600 text-white text-base font-bold rounded-xl"
      >
        다음
      </Button>
    </div>
  );
}
