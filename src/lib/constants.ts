// 이사 유형
export const MOVE_TYPES = {
  one_room: { label: "원룸", icon: "🛏️", basePrice: 100000 },
  one_half_room: { label: "1.5룸", icon: "🏠", basePrice: 130000 },
  two_room: { label: "투룸", icon: "🏡", basePrice: 170000 },
  small_office: { label: "소형 사무실", icon: "🏢", basePrice: 150000 },
} as const;

// 시간대
export const TIME_SLOTS = {
  morning: { label: "오전 (08-12시)", value: "morning" },
  afternoon: { label: "오후 (12-17시)", value: "afternoon" },
  evening: { label: "저녁 (17-21시)", value: "evening" },
  any: { label: "시간 무관", value: "any" },
} as const;

// 가구 항목
export const FURNITURE_ITEMS = [
  { key: "bed", label: "침대", icon: "🛏️" },
  { key: "fridge", label: "냉장고", icon: "🧊" },
  { key: "washer", label: "세탁기", icon: "🫧" },
  { key: "wardrobe", label: "옷장", icon: "👔" },
  { key: "desk", label: "책상", icon: "💻" },
  { key: "sofa", label: "소파", icon: "🛋️" },
  { key: "tv", label: "TV", icon: "📺" },
  { key: "dining_table", label: "식탁", icon: "🍽️" },
  { key: "bookshelf", label: "책장", icon: "📚" },
  { key: "drawer", label: "서랍장", icon: "🗄️" },
] as const;

// 차량 유형
export const VEHICLE_TYPES = {
  damas: { label: "다마스", capacity: "0.5톤" },
  labo: { label: "라보", capacity: "0.5톤" },
  truck_1ton: { label: "1톤 트럭", capacity: "1톤" },
  truck_1_4ton: { label: "1.4톤 트럭", capacity: "1.4톤" },
  truck_2_5ton: { label: "2.5톤 트럭", capacity: "2.5톤" },
  truck_3_5ton: { label: "3.5톤 트럭", capacity: "3.5톤" },
} as const;

// 플랫폼 수수료율
export const PLATFORM_FEE_RATE = 0.12;

// 입찰 마감 시간 (시간 단위)
export const BID_DEADLINE_HOURS = 2;
export const MAX_BIDS_PER_REQUEST = 5;
