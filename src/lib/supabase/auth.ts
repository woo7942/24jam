import { createClient } from "./client";

export type UserRole = "customer" | "driver";

export interface SignUpParams {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface SignInParams {
  email: string;
  password: string;
}

// 회원가입
export async function signUp({ email, password, name, phone, role }: SignUpParams) {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone,
        role,
      },
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
export async function getCurrentUser() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}
