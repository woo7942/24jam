// src/lib/constants/driver-options.ts

export interface VehicleType {
  value: string;
  label: string;
  desc: string;
  emoji: string;
}

export const VEHICLE_TYPES: VehicleType[] = [
  { value: "damas", label: "다마스", desc: "원룸 소량 짐", emoji: "🚐" },
  { value: "labo", label: "라보", desc: "1인 가구 미니 이사", emoji: "🚐" },
  { value: "1ton", label: "1톤", desc: "원룸·소형 이사", emoji: "🚚" },
  { value: "1.4ton", label: "1.4톤", desc: "투룸·소형 사무실", emoji: "🚚" },
  { value: "2.5ton", label: "2.5톤", desc: "중형 이사", emoji: "🚛" },
  { value: "5ton", label: "5톤", desc: "대형 이사", emoji: "🚛" },
  { value: "other", label: "기타", desc: "다른 차량 보유", emoji: "🚗" },
];

export const SERVICE_AREAS: { value: string; label: string }[] = [
  { value: "seoul", label: "서울" },
  { value: "gyeonggi", label: "경기" },
  { value: "incheon", label: "인천" },
  { value: "busan", label: "부산" },
  { value: "daegu", label: "대구" },
  { value: "gwangju", label: "광주" },
  { value: "daejeon", label: "대전" },
  { value: "ulsan", label: "울산" },
  { value: "sejong", label: "세종" },
  { value: "gangwon", label: "강원" },
  { value: "chungbuk", label: "충북" },
  { value: "chungnam", label: "충남" },
  { value: "jeonbuk", label: "전북" },
  { value: "jeonnam", label: "전남" },
  { value: "gyeongbuk", label: "경북" },
  { value: "gyeongnam", label: "경남" },
  { value: "jeju", label: "제주" },
];

// 인증 단계
export type VerificationLevel = "unverified" | "pending" | "verified" | "veteran";

export const VERIFICATION_BADGES: Record<
  VerificationLevel,
  { label: string; emoji: string; color: string; desc: string }
> = {
  unverified: {
    label: "미인증",
    emoji: "⚪",
    color: "bg-gray-100 text-gray-600",
    desc: "기본 정보만 등록됨",
  },
  pending: {
    label: "심사중",
    emoji: "🟡",
    color: "bg-yellow-100 text-yellow-700",
    desc: "서류 검토 중입니다",
  },
  verified: {
    label: "인증 기사",
    emoji: "✅",
    color: "bg-mint-100 text-mint-700",
    desc: "신분·차량 인증 완료",
  },
  veteran: {
    label: "베테랑 기사",
    emoji: "⭐",
    color: "bg-amber-100 text-amber-700",
    desc: "운송허가·보험·경력 인증",
  },
};

// 헬퍼: 라벨 가져오기
export function getVehicleLabel(value: string | null): string {
  if (!value) return "-";
  return VEHICLE_TYPES.find((v) => v.value === value)?.label ?? value;
}

export function getAreaLabel(value: string): string {
  return SERVICE_AREAS.find((a) => a.value === value)?.label ?? value;
}
