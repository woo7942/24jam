"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  Loader2,
  Shield,
  AlertCircle,
  X,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

type DocType = "vehicle_registration" | "driver_license" | "selfie";

interface DocConfig {
  key: DocType;
  label: string;
  desc: string;
  required: boolean;
}

const DOCUMENTS: DocConfig[] = [
  {
    key: "vehicle_registration",
    label: "차량등록증",
    desc: "차량 소유 확인용 (앞면)",
    required: true,
  },
  {
    key: "driver_license",
    label: "운전면허증",
    desc: "신원 확인용 (얼굴 가려도 OK)",
    required: true,
  },
  {
    key: "selfie",
    label: "본인 사진",
    desc: "얼굴이 잘 보이는 사진",
    required: true,
  },
];

const MAX_SIZE_MB = 5;

export default function DriverVerifyPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [files, setFiles] = useState<Record<DocType, File | null>>({
    vehicle_registration: null,
    driver_license: null,
    selfie: null,
  });
  const [previews, setPreviews] = useState<Record<DocType, string | null>>({
    vehicle_registration: null,
    driver_license: null,
    selfie: null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error("로그인이 필요합니다");
      router.push("/login");
      return;
    }

    if (profile && profile.role !== "driver") {
      toast.error("기사 전용 페이지입니다");
      router.push("/");
      return;
    }
  }, [user, profile, authLoading, router]);

  const handleFileChange = (
    docKey: DocType,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 검사
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다`);
      return;
    }

    // 이미지 형식 검사
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다");
      return;
    }

    setFiles((prev) => ({ ...prev, [docKey]: file }));

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews((prev) => ({
        ...prev,
        [docKey]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (docKey: DocType) => {
    setFiles((prev) => ({ ...prev, [docKey]: null }));
    setPreviews((prev) => ({ ...prev, [docKey]: null }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    // 필수 서류 모두 있는지 체크
    const missing = DOCUMENTS.filter(
      (d) => d.required && !files[d.key]
    );
    if (missing.length > 0) {
      toast.error(`${missing.map((m) => m.label).join(", ")}를 업로드해주세요`);
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      const uploadedDocs: Record<string, string> = {};

      // 각 파일 업로드
      for (const doc of DOCUMENTS) {
        const file = files[doc.key];
        if (!file) continue;

        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${doc.key}.${ext}`;

        // 기존 파일 덮어쓰기
        const { error: uploadError } = await supabase.storage
          .from("driver-documents")
          .upload(path, file, { upsert: true });

        if (uploadError) {
          throw new Error(`${doc.label} 업로드 실패: ${uploadError.message}`);
        }

        uploadedDocs[doc.key] = path;
      }

      // 인증 신청 함수 호출 (DB 업데이트)
      const { error: rpcError } = await supabase.rpc(
        "submit_driver_verification",
        { p_documents: uploadedDocs }
      );

      if (rpcError) {
        throw new Error(`인증 신청 실패: ${rpcError.message}`);
      }

      toast.success("인증 신청 완료! 관리자 승인을 기다려주세요");
      setTimeout(() => {
        router.push("/mypage");
        router.refresh();
      }, 1000);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      toast.error(msg);
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-mint-500" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const verificationLevel = profile.verification_level ?? "unverified";
  const isPending = verificationLevel === "pending";
  const isVerified =
    verificationLevel === "verified" || verificationLevel === "veteran";

  return (
    <div className="app-container pb-10">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3">
        <Link href="/mypage" className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold">기사 인증</h1>
      </header>

      <div className="px-5 pt-5">
        {/* 안내 카드 */}
        <div className="rounded-2xl border-2 border-mint-200 bg-mint-50/50 p-4 mb-5">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-mint-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-mint-900 mb-1">
                인증 기사가 되어보세요
              </h2>
              <p className="text-sm text-mint-800 leading-relaxed">
                서류 제출 후 관리자 승인을 받으면
                <br />
                인증 배지와 함께 입찰이 가능해집니다.
              </p>
            </div>
          </div>
        </div>

        {/* 이미 인증된 경우 */}
        {isVerified && (
          <div className="rounded-2xl border-2 border-mint-300 bg-mint-50 p-5 mb-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-mint-600 mx-auto mb-2" />
            <h3 className="font-bold text-mint-900 mb-1">
              이미 인증된 기사님입니다
            </h3>
            <p className="text-sm text-mint-700">
              서류를 다시 제출하면 재심사가 진행됩니다.
            </p>
          </div>
        )}

        {/* 심사중인 경우 */}
        {isPending && (
          <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-5 mb-4">
            <div className="flex items-start gap-3">
              <Loader2 className="h-6 w-6 text-orange-600 shrink-0 mt-0.5 animate-spin" />
              <div>
                <h3 className="font-bold text-orange-900 mb-1">
                  서류 심사 중입니다
                </h3>
                <p className="text-sm text-orange-800">
                  보통 1~2일 내에 결과를 알려드려요.
                  <br />
                  추가 서류가 필요하면 연락드립니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 서류 업로드 */}
        <div className="space-y-4 mb-5">
          {DOCUMENTS.map((doc) => {
            const file = files[doc.key];
            const preview = previews[doc.key];
            return (
              <div
                key={doc.key}
                className="rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-mint-600" />
                      <span className="font-bold text-sm">{doc.label}</span>
                      {doc.required && (
                        <span className="text-red-500 text-xs">*</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{doc.desc}</p>
                  </div>
                  {file && (
                    <CheckCircle2 className="h-5 w-5 text-mint-600" />
                  )}
                </div>

                {preview ? (
                  <div className="relative mt-3 rounded-xl overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={doc.label}
                      className="w-full h-48 object-contain"
                    />
                    <button
                      onClick={() => handleRemove(doc.key)}
                      disabled={submitting}
                      className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    className={`mt-3 flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed cursor-pointer transition ${
                      submitting
                        ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                        : "border-gray-300 hover:border-mint-400 hover:bg-mint-50/50"
                    }`}
                  >
                    <Upload className="h-6 w-6 text-gray-400 mb-1.5" />
                    <span className="text-sm text-gray-600 font-medium">
                      사진 업로드
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      JPG, PNG · 최대 {MAX_SIZE_MB}MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(doc.key, e)}
                      disabled={submitting}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>

        {/* 안내 사항 */}
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 mb-5">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 leading-relaxed">
              <p className="font-semibold mb-1">제출 전 확인해주세요</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>모든 정보가 잘 보이도록 촬영해주세요</li>
                <li>주민번호 뒷자리는 가려도 됩니다</li>
                <li>서류는 본인 확인용으로만 사용됩니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 제출 버튼 */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 bg-mint-600 hover:bg-mint-700 text-white font-bold"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPending ? (
            "서류 다시 제출하기"
          ) : (
            "인증 신청하기"
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center mt-3">
          제출 후 1~2일 내에 결과를 알려드려요
        </p>
      </div>
    </div>
  );
}
