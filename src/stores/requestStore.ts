import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MoveType = "one_room" | "one_half_room" | "two_room" | "small_office";
export type TimeSlot = "morning" | "afternoon" | "evening" | "any";

export interface FurnitureItem {
  name: string;
  count: number;
}

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
  furnitureItems: FurnitureItem[];
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
  furnitureItems: [] as FurnitureItem[],
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
    }
  )
);
