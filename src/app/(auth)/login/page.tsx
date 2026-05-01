"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요");
      return;
    }

    setLoading(true);
    const { data, error } = await signIn({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message === "Invalid login credentials" 
        ? "이메일 또는 비밀번호가 올바르지 않습니다" 
        : error.message
      );
      return;
    }

    toast.success("로그인 되었습니다");
    router.push("/");
    router.refresh();
  };

  return (
    <div className="app-container">
      {/* 헤더 */}
      <header className="flex h-14 items-center px-3">
        <Link href="/" className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </header>

      {/* 본문 */}
      <div className="px-5 pt-4">
        <div className="mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-500 text-white font-bold text-xl mb-4">
            딱
          </div>
          <h1 className="text-2xl font-bold mb-2">다시 만나서 반가워요</h1>
          <p className="text-gray-600 text-sm">이메일로 로그인해주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-mint-500 hover:bg-mint-600 text-white font-bold mt-6"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "로그인"}
          </Button>
        </form>

        <div className="text-center mt-6 text-sm">
          <span className="text-gray-600">아직 회원이 아니신가요? </span>
          <Link href="/signup" className="text-mint-600 font-semibold">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
