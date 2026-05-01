"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: "customer" | "driver" | "admin";
  phone: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      console.log("🔍 [useAuth] 시작");
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log("🔍 [useAuth] user:", user);
        console.log("🔍 [useAuth] userError:", userError);

        if (!user) {
          console.log("🔍 [useAuth] 로그인 안됨, 로딩 종료");
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(user);

        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        console.log("🔍 [useAuth] profile:", profileData);
        console.log("🔍 [useAuth] profileError:", profileError);

        setProfile(profileData);
      } catch (e) {
        console.error("🔍 [useAuth] 예외 발생:", e);
      } finally {
        console.log("🔍 [useAuth] 로딩 종료");
        setLoading(false);
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔍 [useAuth] auth 변경:", event, session?.user?.email);
      if (session?.user) {
        setUser(session.user);
        loadUser();
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading };
}
