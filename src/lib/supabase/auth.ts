import { createClient } from "./client";

export type UserRole = "customer" | "driver";

export type VerificationLevel =
  | "unverified"
  | "pending"
  | "verified"
  | "veteran";

// users 테이블 프로필 타입
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
  // 기사 전용 필드
  vehicle_type?: string | null;
  vehicle_number?: string | null;
  service_areas?: string[] | null;
  years_of_experience?: number | null;
  bio?: string | null;
  verification_level?: VerificationLevel | null;
  verification_documents?: Record<string, unknown> | null;
}

export interface SignUpParams {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  // 기사 전용 (선택)
  vehicleType?: string;
  vehicleNumber?: string;
  serviceAreas?: string[];
  yearsOfExperience?: number;
}

export interface SignInParams {
  email: string;
  password: string;
}

// 회원가입
export async function signUp(params: SignUpParams) {
  const {
    email,
    password,
    name,
    phone,
    role,
    vehicleType,
    vehicleNumber,
    serviceAreas,
    yearsOfExperience,
  } = params;

  const supabase = createClient();

  // 메타데이터 구성 (트리거에서 사용)
  const metaData: Record<string, unknown> = {
    name,
    phone,
    role,
  };

  if (role === "driver") {
    if (vehicleType) metaData.vehicle_type = vehicleType;
    if (vehicleNumber) metaData.vehicle_number = vehicleNumber;
    if (serviceAreas && serviceAreas.length > 0) {
      metaData.service_areas = serviceAreas;
    }
    if (yearsOfExperience !== undefined && yearsOfExperience !== null) {
      metaData.years_of_experience = yearsOfExperience;
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metaData,
    },
  });

  return { data, error };
}

// 로그인
export async function signIn({ email, password }: SignInParams) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

// 로그아웃
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

// 현재 사용자 정보 가져오기
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as UserProfile | null;
}

// 회원 탈퇴 ← 여기 새로 추가
export async function deleteMyAccount() {
  const supabase = createClient();

  const { error } = await supabase.rpc("delete_my_account");

  if (error) {
    return { error };
  }

  await supabase.auth.signOut();

  return { error: null };
}