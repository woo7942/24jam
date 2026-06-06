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
} from "@/stores/requestStore";
import {
  FURNITURE_CONFIG,
  type FurnitureType,
  type FurnitureDetail,
  summarizeFurniture,
} from "@/lib/constants/furniture-options";

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

const FURNITURE_ORDER: FurnitureType[] = [
  "bed", "wardrobe", "desk", "chair", "fridge",
  "washer", "tv", "sofa", "table", "bookshelf",
];

export default function Step2ItemsPage() {
  const router = useRouter();
  const store = useRequestStore();

  const [serviceType, setServiceType] = useState<ServiceType | null>(store.serviceType);
  const [moveType, setMoveType] = useState<MoveType | null>(store.moveType);
  const [details, setDetails] = useState<FurnitureDetail[]>(store.furnitureDetails ?? []);
  const [boxCount, setBoxCount] = useState(store.boxCount);
  const [notes, setNotes] = useState(store.notes);

  // 옵션 모달 상태
  const [editingType, setEditingType] = useState<FurnitureType | null>(null);
  const [editingOptions, setEditingOptions] = useState<Record<string, string>>({});

  const isSelected = (type: FurnitureType) =>
    details.some((d) => d.type === type);

  const openOptions = (type: FurnitureType) => {
    const existing = details.find((d) => d.type === type);
    setEditingType(type);
    setEditingOptions(existing?.options ?? {});
  };

  const saveOptions = () => {
    if (!editingType) return;
    setDetails((prev) => {
      const without = prev.filter((d) => d.type !== editingType);
      return [...without, { type: editingType, options: editingOptions }];
    });
    setEditingType(null);
    setEditingOptions({});
  };

  const removeFurniture = (type: FurnitureType) => {
    setDetails((prev) => prev.filter((d) => d.type !== type));
    setEditingType(null);
    setEditingOptions({});
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
      furnitureItems: details.map((d) => d.type), // 기존 호환
      furnitureDetails: details,
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

      {/* 이사 종류 */}
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
                  selected ? "border-mint-500 bg-mint-50" : "border-gray-200 bg-white"
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
                      selected ? "border-mint-500 bg-mint-500" : "border-gray-300 bg-white"
                    }`}
                  >
                    {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 공간 크기 */}
      <div className="space-y-3">
        <Label>공간 크기</Label>
        <div className="grid grid-cols-2 gap-2">
          {MOVE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setMoveType(type.value)}
              className={`rounded-xl border p-4 text-left transition ${
                moveType === type.value ? "border-mint-500 bg-mint-50" : "border-gray-200 bg-white"
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
        <div>
          <Label>주요 가구</Label>
          <p className="mt-1 text-xs text-gray-400">
            가구를 선택하면 사이즈·종류 등 상세 정보를 입력할 수 있어요
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {FURNITURE_ORDER.map((type) => {
            const config = FURNITURE_CONFIG[type];
            const selected = isSelected(type);
            const detail = details.find((d) => d.type === type);
            return (
              <button
                key={type}
                onClick={() => openOptions(type)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition ${
                  selected ? "border-mint-500 bg-mint-50" : "border-gray-200 bg-white"
                }`}
              >
                <span className="text-2xl">{config.emoji}</span>
                <span className="text-xs font-medium text-gray-700">{config.label}</span>
                {selected && detail && (
                  <span className="line-clamp-2 text-[10px] leading-tight text-mint-700">
                    {summarizeFurniture(detail)}
                  </span>
                )}
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

      {/* 가구 옵션 모달 */}
      {editingType && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setEditingType(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {FURNITURE_CONFIG[editingType].emoji}{" "}
                {FURNITURE_CONFIG[editingType].label} 정보
              </h3>
              <button
                onClick={() => setEditingType(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] space-y-5 overflow-y-auto">
              {FURNITURE_CONFIG[editingType].options.map((opt) => (
                <div key={opt.key} className="space-y-2">
                  <Label className="text-sm">{opt.label}</Label>
                  <div className="flex flex-wrap gap-2">
                    {opt.choices.map((choice) => {
                      const selected = editingOptions[opt.key] === choice;
                      return (
                        <button
                          key={choice}
                          onClick={() =>
                            setEditingOptions((prev) => ({
                              ...prev,
                              [opt.key]: choice,
                            }))
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            selected
                              ? "border-mint-500 bg-mint-500 text-white"
                              : "border-gray-200 bg-white text-gray-700"
                          }`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              {isSelected(editingType) && (
                <Button
                  onClick={() => removeFurniture(editingType)}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                >
                  삭제
                </Button>
              )}
              <Button
                onClick={saveOptions}
                className="flex-1 bg-mint-500 hover:bg-mint-600 text-white"
              >
                {isSelected(editingType) ? "수정 완료" : "추가"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
