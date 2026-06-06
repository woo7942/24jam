// src/lib/constants/furniture-options.ts

export type FurnitureType =
  | "bed"
  | "wardrobe"
  | "desk"
  | "chair"
  | "fridge"
  | "washer"
  | "tv"
  | "sofa"
  | "table"
  | "bookshelf";

export interface FurnitureOptionGroup {
  key: string;        // 옵션 키 (예: "size", "type")
  label: string;      // 화면 표시 이름 (예: "사이즈")
  choices: string[];  // 선택지
}

export interface FurnitureConfig {
  label: string;
  emoji: string;
  options: FurnitureOptionGroup[];
}

export const FURNITURE_CONFIG: Record<FurnitureType, FurnitureConfig> = {
  bed: {
    label: "침대",
    emoji: "🛏️",
    options: [
      {
        key: "size",
        label: "사이즈",
        choices: ["S(싱글)", "SS(슈퍼싱글)", "D(더블)", "Q(퀸)", "K(킹)"],
      },
      {
        key: "frame",
        label: "프레임",
        choices: ["있음", "없음(매트리스만)"],
      },
      {
        key: "type",
        label: "형태",
        choices: ["일반형", "서랍형(수납)", "모션베드(전동)"],
      },
    ],
  },
  wardrobe: {
    label: "옷장",
    emoji: "🚪",
    options: [
      {
        key: "size",
        label: "크기",
        choices: ["3자(90cm)", "5자(150cm)", "8자(240cm)", "10자(300cm)", "12자(360cm)"],
      },
      {
        key: "type",
        label: "타입",
        choices: ["일반장", "붙박이장(분해필요)", "시스템옷장"],
      },
      {
        key: "doors",
        label: "문 개수",
        choices: ["2문", "3문", "4문 이상"],
      },
    ],
  },
  desk: {
    label: "책상",
    emoji: "🪑",
    options: [
      {
        key: "size",
        label: "크기",
        choices: ["소형(120cm 이하)", "중형(120-150cm)", "대형(150cm 이상)"],
      },
      {
        key: "type",
        label: "타입",
        choices: ["일반책상", "모션데스크(전동)", "L자형", "컴퓨터책상"],
      },
    ],
  },
  chair: {
    label: "의자",
    emoji: "💺",
    options: [
      {
        key: "type",
        label: "타입",
        choices: ["일반의자", "사무용 의자", "안마의자", "리클라이너"],
      },
      {
        key: "count",
        label: "개수",
        choices: ["1개", "2개", "3개", "4개 이상"],
      },
    ],
  },
  fridge: {
    label: "냉장고",
    emoji: "🧊",
    options: [
      {
        key: "type",
        label: "타입",
        choices: ["1도어(미니)", "2도어 일반", "양문형", "4도어(프렌치)", "김치냉장고(스탠드)", "김치냉장고(뚜껑)"],
      },
      {
        key: "capacity",
        label: "용량",
        choices: ["300L 이하", "300-500L", "500L 이상"],
      },
    ],
  },
  washer: {
    label: "세탁기",
    emoji: "🧺",
    options: [
      {
        key: "type",
        label: "타입",
        choices: ["통돌이", "드럼", "트윈워시(드럼+미니)"],
      },
      {
        key: "capacity",
        label: "용량",
        choices: ["10kg 이하", "10-17kg", "17kg 이상"],
      },
      {
        key: "dryer",
        label: "건조기",
        choices: ["없음", "있음(별도)"],
      },
    ],
  },
  tv: {
    label: "TV",
    emoji: "📺",
    options: [
      {
        key: "size",
        label: "사이즈",
        choices: ["32인치 이하", "40-55인치", "55-65인치", "65-75인치", "75인치 이상"],
      },
      {
        key: "mount",
        label: "거치",
        choices: ["스탠드형", "벽걸이(탈거 필요)"],
      },
    ],
  },
  sofa: {
    label: "소파",
    emoji: "🛋️",
    options: [
      {
        key: "seats",
        label: "인용",
        choices: ["1인용", "2인용", "3인용", "4인 이상"],
      },
      {
        key: "type",
        label: "타입",
        choices: ["일반", "코너형(L자)", "리클라이너", "소파베드"],
      },
      {
        key: "split",
        label: "분해 가능",
        choices: ["가능", "불가능"],
      },
    ],
  },
  table: {
    label: "식탁",
    emoji: "🍽️",
    options: [
      {
        key: "seats",
        label: "인용",
        choices: ["2인용", "4인용", "6인용", "8인 이상"],
      },
      {
        key: "material",
        label: "재질",
        choices: ["원목", "유리", "대리석", "일반"],
      },
      {
        key: "chairs",
        label: "의자 개수",
        choices: ["없음", "2개", "4개", "6개", "8개 이상"],
      },
    ],
  },
  bookshelf: {
    label: "책장",
    emoji: "📚",
    options: [
      {
        key: "size",
        label: "크기",
        choices: ["소형(120cm 이하)", "중형(120-180cm)", "대형(180cm 이상)"],
      },
      {
        key: "count",
        label: "개수",
        choices: ["1개", "2개", "3개 이상"],
      },
    ],
  },
};

// 가구 상세 정보 타입
export interface FurnitureDetail {
  type: FurnitureType;
  options: Record<string, string>; // 예: { size: "Q(퀸)", frame: "있음" }
}

// 가구 상세를 한 줄 요약 텍스트로 변환
export function summarizeFurniture(detail: FurnitureDetail): string {
  const config = FURNITURE_CONFIG[detail.type];
  const parts = config.options
    .map((opt) => detail.options[opt.key])
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "옵션 미선택";
}
