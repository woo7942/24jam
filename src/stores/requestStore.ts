import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FurnitureDetail, FurnitureType } from "@/lib/constants/furniture-options";

export type MoveType = "one_room" | "one_half_room" | "two_room" | "small_office";
export type ServiceType = "general" | "half_packing" | "full_packing";
export type TimeSlot = "morning" | "afternoon" | "evening" | "any";

// 기존 호환용 (다른 페이지에서 import 할 수도 있어 유지)
export type FurnitureItem = FurnitureType;

interface RequestState {
  // Step 1: 주소 정보
  fromAddress: string;
  fromAddressDetail: string;
  fromFloor: number;
  fromHasElevator: boolean;
  fromNeedsLadder: boolean;
  toAddress: string;
  toAddressDetail: string;
  toFloor: number;
  toHasElevator: boolean;
  toNeedsLadder: boolean;

  // Step 2: 짐 정보
  moveType: MoveType | null;
  serviceType: ServiceType | null;
  furnitureItems: FurnitureItem[];          // 기존 (선택된 가구 종류만)
  furnitureDetails: FurnitureDetail[];      // 신규 (가구별 상세 옵션)
  boxCount: number;
  notes: string;

  // Step 3: 날짜/시간
  preferredDate: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  isUrgent: boolean;

  // Actions
  setStep1: (data: Partial<RequestState>) => void;
  setStep2: (data: Partial<RequestState>) => void;
  setStep3: (data: Partial<RequestState>) => void;
  reset: () => void;
}

const initialState = {
  fromAddress: "",
  fromAddressDetail: "",
  fromFloor: 1,
  fromHasElevator: false,
  fromNeedsLadder: false,
  toAddress: "",
  toAddressDetail: "",
  toFloor: 1,
  toHasElevator: false,
  toNeedsLadder: false,

  moveType: null as MoveType | null,
  serviceType: null as ServiceType | null,
  furnitureItems: [] as FurnitureItem[],
  furnitureDetails: [] as FurnitureDetail[],
  boxCount: 0,
  notes: "",

  preferredDate: "",
  timeSlot: "any" as TimeSlot,
  isUrgent: false,
};

export const useRequestStore = create<RequestState>()(
  persist(
    (set) => ({
      ...initialState,
      setStep1: (data) => set(data),
      setStep2: (data) => set(data),
      setStep3: (data) => set(data),
      reset: () => set(initialState),
    }),
    {
      name: "isajam-request",
      version: 2, // 스키마 변경: 버전 올림 (이전 저장 데이터 자동 마이그레이션)
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<RequestState>;
        // v1 → v2: furnitureDetails 필드 없으면 빈 배열로
        if (version < 2) {
          return {
            ...state,
            furnitureDetails: [],
          };
        }
        return state;
      },
    }
  )
);
