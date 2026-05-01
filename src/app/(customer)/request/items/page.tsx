"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRequestStore, type MoveType } from "@/stores/requestStore";

const MOVE_TYPES: { value: MoveType; label: string; desc: string }[] = [
  { value: "one_room", label: "원룸", desc: "5평 이하, 짐 적음" },
  { value: "one_half_room", label: "1.5룸", desc: "7평 내외" },
  { value: "two_room", label: "투룸", desc: "10평 내외" },
  { value: "small_office", label: "소형 사무실", desc: "책상 2~5개" },
];

const FURNITURE_LIST = [
  "침대", "옷장", "책상", "의자", "냉장고",
  "세탁기", "TV", "소파", "식탁", "책장",
];

export default function Step2ItemsPage() {
  const router = useRouter();
  const store = useRequestStore();

  const [moveType, setMoveType] = useState<MoveType | null>(store.moveType);
  const [selectedFurniture, setSelectedFurniture] = useState<string[]>(
    store.furnitureItems.map((f) => f.name)
  );
  const [boxCount, setBoxCount] = useState(store.boxCount);
  const [notes, setNotes] = useState(store.notes);

  const toggleFurniture = (name: string) => {
    setSelectedFurniture((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleNext = () => {
    if (!moveType) {
      toast.error("이사 유형을 선택해주세요");
      return;
    }

    store.setStep2({
      moveType,
      furnitureItems: selectedFurniture.map((name) => ({ name, count: 1 })),
      boxCount,
      notes,
    });

    router.push("/request/schedule");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">어떤 짐이 있나요?</h1>
        <p className="text-sm text-gray-500">이사 규모와 짐 정보를 알려주세요</p>
      </div>

      {/* 이사 유형 */}
      <div className="space-y-3">
        <Label>이사 유형</Label>
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
              <div className="text-xs text-gray-500 mt-0.5">{type.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 가구 선택 */}
      <div className="space-y-3">
        <Label>주요 가구 (복수 선택)</Label>
        <div className="flex flex-wrap gap-2">
          {FURNITURE_LIST.map((name) => (
            <button
              key={name}
              onClick={() => toggleFurniture(name)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                selectedFurniture.includes(name)
                  ? "border-mint-500 bg-mint-500 text-white"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 박스 개수 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>박스 개수</Label>
          <span className="text-sm font-bold text-mint-600">{boxCount}개</span>
        </div>
        <input
          type="range"
          min={0}
          max={30}
          value={boxCount}
          onChange={(e) => setBoxCount(Number(e.target.value))}
          className="w-full accent-mint-500"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0개</span>
          <span>15개</span>
          <span>30개+</span>
        </div>
      </div>

      {/* 메모 */}
      <div className="space-y-2">
        <Label htmlFor="notes">기사님께 전달할 내용 (선택)</Label>
        <Textarea
          id="notes"
          placeholder="예: 피아노 있어요, 계단 많아요"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
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
