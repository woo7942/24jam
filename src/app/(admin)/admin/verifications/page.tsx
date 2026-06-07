"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  Phone,
  Mail,
  Truck,
  MapPin,
  Award,
  Inbox,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface PendingDriver {
  id: string;
  email: string;
  name: string;
  phone: string;
  vehicle_type: string | null;
  vehicle_number: string | null;
  service_areas: string[] | null;
  years_of_experience: number | null;
  bio: string | null;
  verification_level: string;
  verification_documents: Record<string, string> | null;
  updated_at: string;
}

const DOC_LABELS: Record<string, string> = {
  vehicle_registration: "차량등록증",
  driver_license: "운전면허증",
  selfie: "본인 사진",
};

export default function AdminVerificationsPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const [drivers, setDrivers] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [docUrls, setDocUrls] = useState<Record<string, Record<string, string>>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "admin_get_pending_verifications"
    );

    if (error) {
      console.error(error);
      toast.error("목록 조회 실패: " + error.message);
      setLoading(false);
      return;
    }

    const list = (data || []) as PendingDriver[];
    setDrivers(list);

    // 각 기사의 서류에 대한 signed URL 생성
    const urlsByDriver: Record<string, Record<string, string>> = {};
    for (const d of list) {
      if (!d.verification_documents) continue;
      const driverUrls: Record<string, string> = {};

      for (const [docKey, path] of Object.entries(d.verification_documents)) {
        const { data: signed } = await supabase.storage
          .from("driver-documents")
          .createSignedUrl(path, 60 * 30); // 30분 유효
        if (signed?.signedUrl) {
          driverUrls[docKey] = signed.signedUrl;
        }
      }
      urlsByDriver[d.id] = driverUrls;
    }
    setDocUrls(urlsByDriver);

    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error("로그인이 필요합니다");
      router.push("/login");
      return;
    }

    if (profile && profile.role !== "admin") {
      toast.error("관리자 전용 페이지입니다");
      router.push("/");
      return;
    }

    if (profile?.role === "admin") {
      loadData();
    }
  }, [user, profile, authLoading, router, loadData]);

  const handleReview = async (driverId: string, approve: boolean) => {
    const action = approve ? "승인" : "반려";
    if (!confirm(`이 기사님의 인증을 ${action}하시겠어요?`)) return;

    setReviewingId(driverId);
    const supabase = createClient();

    const { error } = await supabase.rpc("admin_review_verification", {
      p_user_id: driverId,
      p_approve: approve,
    });

    setReviewingId(null);

    if (error) {
      console.error(error);
      toast.error(`${action} 처리 실패: ` + error.message);
      return;
    }

    toast.success(`${action} 처리되었습니다`);
    setDrivers((prev) => prev.filter((d) => d.id !== driverId));
  };

  if (authLoading || loading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-mint-500" />
      </div>
    );
  }

  if (!user || !profile || profile.role !== "admin") return null;

  return (
    <div className="app-container pb-10">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3">
        <Link href="/" className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-mint-600" />
          기사 인증 심사
        </h1>
      </header>

      <div className="px-5 pt-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            대기 중 <strong className="text-mint-600">{drivers.length}</strong>건
          </p>
          <button
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            className="text-xs text-mint-600 font-semibold hover:underline"
          >
            새로고침
          </button>
        </div>

        {drivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">
              심사 대기 중인 기사가 없어요
            </h2>
            <p className="text-sm text-gray-500">
              새로운 신청이 오면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {drivers.map((d) => {
              const urls = docUrls[d.id] || {};
              return (
                <div
                  key={d.id}
                  className="rounded-2xl border-2 border-orange-200 bg-orange-50/30 p-4"
                >
                  {/* 기사 기본 정보 */}
                  <div className="mb-3 pb-3 border-b border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100">
                        <Award className="h-4 w-4 text-orange-700" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">{d.name}</h3>
                        <p className="text-[11px] text-orange-700">
                          신청일:{" "}
                          {new Date(d.updated_at).toLocaleString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs">{d.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs">{d.phone}</span>
                      </div>
                      {d.vehicle_type && (
                        <div className="flex items-center gap-2">
                          <Truck className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs">
                            {d.vehicle_type}
                            {d.vehicle_number && ` · ${d.vehicle_number}`}
                          </span>
                        </div>
                      )}
                      {d.service_areas && d.service_areas.length > 0 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                          <span className="text-xs">
                            {d.service_areas.join(", ")}
                          </span>
                        </div>
                      )}
                      {d.years_of_experience !== null && (
                        <div className="text-xs text-gray-600 ml-5">
                          경력 {d.years_of_experience}년
                        </div>
                      )}
                      {d.bio && (
                        <p className="text-xs text-gray-600 mt-2 p-2 bg-white rounded-lg">
                          {d.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 서류 미리보기 */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-700 mb-2">
                      제출 서류
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {["vehicle_registration", "driver_license", "selfie"].map(
                        (docKey) => {
                          const url = urls[docKey];
                          return (
                            <div key={docKey} className="text-center">
                              {url ? (
                                <button
                                  onClick={() => setPreviewUrl(url)}
                                  className="block w-full rounded-lg overflow-hidden border border-gray-200 hover:border-mint-400 transition"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt={DOC_LABELS[docKey]}
                                    className="w-full h-20 object-cover"
                                  />
                                </button>
                              ) : (
                                <div className="w-full h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <span className="text-[10px] text-gray-400">
                                    없음
                                  </span>
                                </div>
                              )}
                              <p className="text-[10px] text-gray-600 mt-1">
                                {DOC_LABELS[docKey]}
                              </p>
                            </div>
                          );
                        }
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-center">
                      이미지 클릭 시 크게 보기
                    </p>
                  </div>

                  {/* 승인/반려 버튼 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(d.id, false)}
                      disabled={reviewingId === d.id}
                      className="flex-1 h-11 rounded-xl border-2 border-red-200 bg-white text-red-600 text-sm font-bold hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {reviewingId === d.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          반려
                        </>
                      )}
                    </button>
                    <Button
                      onClick={() => handleReview(d.id, true)}
                      disabled={reviewingId === d.id}
                      className="flex-1 h-11 bg-mint-600 hover:bg-mint-700 text-white font-bold"
                    >
                      {reviewingId === d.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          승인
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 이미지 크게 보기 모달 */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="서류 미리보기"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
