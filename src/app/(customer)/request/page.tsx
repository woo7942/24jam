"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequestStore } from "@/stores/requestStore";

export default function Step1AddressPage() {
  const router = useRouter();
  const store = useRequestStore();

  const [fromAddress, setFromAddress] = useState(store.fromAddress);
  const [fromAddressDetail, setFromAddressDetail] = useState(store.fromAddressDetail);
  const [fromFloor, setFromFloor] = useState(store.fromFloor);
  const [fromHasElevator, setFromHasElevator] = useState(store.fromHasElevator);
  const [fromNeedsLadder, setFromNeedsLadder] = useState(store.fromNeedsLadder);

  const [toAddress, setToAddress] = useState(store.toAddress);
  const [toAddressDetail, setToAddressDetail] = useState(store.toAddressDetail);
  const [toFloor, setToFloor] = useState(store.toFloor);
  const [toHasElevator, setToHasElevator] = useState(store.toHasElevator);
  const [toNeedsLadder, setToNeedsLadder] = useState(store.toNeedsLadder);

  const handleNext = () => {
    if (!fromAddress.trim() || !toAddress.trim()) {
      toast.error("출발지와 도착지 주소를 모두 입력해주세요");
      return;
    }

    store.setStep1({
      fromAddress,
      fromAddressDetail,
      fromFloor,
      fromHasElevator,
      fromNeedsLadder,
      toAddress,
      toAddressDetail,
      toFloor,
      toHasElevator,
      toNeedsLadder,
    });

    router.push("/request/items");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">어디서 어디로 가나요?</h1>
        <p className="text-sm text-gray-500">출발지와 도착지를 알려주세요</p>
      </div>

      {/* 출발지 */}
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-mint-50/30 p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-mint-500 text-xs font-bold text-white">
            출
          </span>
          <h2 className="font-bold text-gray-900">출발지</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fromAddress">주소</Label>
          <Input
            id="fromAddress"
            placeholder="예: 서울시 강남구 역삼동 123-45"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fromAddressDetail">상세주소</Label>
          <Input
            id="fromAddressDetail"
            placeholder="예: 101호"
            value={fromAddressDetail}
            onChange={(e) => setFromAddressDetail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fromFloor">층수</Label>
          <Input
            id="fromFloor"
            type="number"
            min={-3}
            max={50}
            value={fromFloor}
            onChange={(e) => setFromFloor(Number(e.target.value))}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFromHasElevator(!fromHasElevator)}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              fromHasElevator
                ? "border-mint-500 bg-mint-500 text-white"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            엘리베이터 {fromHasElevator ? "✓" : ""}
          </button>
          <button
            onClick={() => setFromNeedsLadder(!fromNeedsLadder)}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              fromNeedsLadder
                ? "border-mint-500 bg-mint-500 text-white"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            사다리차 {fromNeedsLadder ? "✓" : ""}
          </button>
        </div>
      </div>

      {/* 도착지 */}
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-mint-50/30 p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-white">
            도
          </span>
          <h2 className="font-bold text-gray-900">도착지</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="toAddress">주소</Label>
          <Input
            id="toAddress"
            placeholder="예: 서울시 마포구 합정동 678-90"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toAddressDetail">상세주소</Label>
          <Input
            id="toAddressDetail"
            placeholder="예: 502호"
            value={toAddressDetail}
            onChange={(e) => setToAddressDetail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toFloor">층수</Label>
          <Input
            id="toFloor"
            type="number"
            min={-3}
            max={50}
            value={toFloor}
            onChange={(e) => setToFloor(Number(e.target.value))}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setToHasElevator(!toHasElevator)}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              toHasElevator
                ? "border-mint-500 bg-mint-500 text-white"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            엘리베이터 {toHasElevator ? "✓" : ""}
          </button>
          <button
            onClick={() => setToNeedsLadder(!toNeedsLadder)}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              toNeedsLadder
                ? "border-mint-500 bg-mint-500 text-white"
                : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            사다리차 {toNeedsLadder ? "✓" : ""}
          </button>
        </div>
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
