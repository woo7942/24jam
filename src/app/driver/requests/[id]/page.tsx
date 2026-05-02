"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Package,
  Loader2,
  Building2,
  Truck,
  CheckCircle2,
  AlertCircle,
  Handshake,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface MoveRequest {
  id: string;
  customer_id: string;
  from_address: string;
  from_address_detail: string | null;
  from_floor: number;
  from_has_elevator: boolean;
  from_needs_ladder: boolean;
  to_address: string;
  to_address_detail: string | null;
  to_floor: number;
  to_has_elevator: boolean;
  to_needs_ladder: boolean;
  service_type: "general" | "half_packing" | "full_packing" | null;
  move_type: string;
  furniture_items: string[] | null;
  box_count: number;
  notes: string | null;
  preferred_date: string;
  time_slot: string;
  is_urgent: boolean;
  status: "open" | "matched" | "completed" | "cancelled";
  bid_deadline: string;
}

interface MyBid {
  id: string;
  price: number;
  message: string | null;
  estimated_duration_min: number | null;
  status: string;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  general: "일반 이사",
  half_packing: "반포장 이사",
  full_packing: "포장 이사",
};

const MOVE_TYPE_LABELS: Record<string, string> = {
  one_room: "원룸",
  one_half_room: "1.5룸",
  two_room: "투룸",
  small_office: "소형 사무실",
};

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "오전",
  afternoon: "오후",
  evening: "저녁",
  any: "시간 무관",
};

const FURNITURE_LABELS: Record<string, string> = {
  bed: "침대",
  wardrobe: "옷장",
  desk: "책상",
  chair: "의자",
  fridge: "냉장고",
  washer: "세탁기",
  tv: "TV",
  sofa: "소파",
  table: "식탁",
  bookshelf: "책장",
};

function getRemainingTime(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "마감";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}시간 ${m}분 남음` : `${m}분 남음`;
}

function formatPrice(value: string) {
  const num = value.replace(/[^0-9]/g, "");
  if (!num) return "";
  return parseInt(num).toLocaleString("ko-KR");
}

export default function DriverRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  const { user, profile, loading: authLoading } = useAuth();

  const [request, setRequest] = useState<MoveRequest | null>(null);
  const [myBid, setMyBid] = useState<MyBid | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 입찰 폼 상태
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState("");

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

    if (!profile) return;

    const loadData = async () => {
      const supabase = createClient();

      const { data: req, error: reqError } = await supabase
        .from("move_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (reqError || !req) {
        console.error(reqError);
        toast.error("요청을 찾을 수 없습니다");
        router.push("/driver/requests");
        return;
      }

      setRequest(req);

      // 내가 이미 입찰했는지 확인
      const { data: bid } = await supabase
        .from("bids")
        .select("*")
        .eq("request_id", requestId)
        .eq("driver_id", user.id)
        .maybeSingle();

      if (bid) {
        setMyBid(bid);
        setPrice(bid.price.toLocaleString("ko-KR"));
        setMessage(bid.message || "");
        setDuration(bid.estimated_duration_min?.toString() || "");
      }

      setLoading(false);
    };

    loadData();
  }, [user, profile, authLoading, requestId, router]);

  const handleSubmit = async () => {
    if (!user || !request) return;

    // 🔒 매칭/종료 상태 재확인 (서버에서도 RLS로 다시 체크되지만 UX용)
    if (request.status !== "open") {
      toast.error("이미 매칭이 완료되었거나 종료된 요청입니다");
      router.push("/driver/requests");
      return;
    }
    if (new Date(request.bid_deadline).getTime() < Date.now()) {
      toast.error("입찰 마감 시간이 지났습니다");
      return;
    }

    const priceNum = parseInt(price.replace(/,/g, ""));
    if (!priceNum || priceNum <= 0) {
      toast.error("입찰가를 입력해주세요");
      return;
    }
    if (priceNum < 10000) {
      toast.error("최소 입찰가는 10,000원입니다");
      return;
    }

    const durationNum = duration ? parseInt(duration) : null;
    if (duration && (!durationNum || durationNum <= 0)) {
      toast.error("올바른 작업 시간을 입력해주세요");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    if (myBid) {
      // 수정
      const { error } = await supabase
        .from("bids")
        .update({
          price: priceNum,
          message: message.trim() || null,
          estimated_duration_min: durationNum,
          updated_at: new Date().toISOString(),
        })
        .eq("id", myBid.id);

      setSubmitting(false);
      if (error) {
        console.error(error);
        toast.error("입찰 수정 실패: " + error.message);
        return;
      }
      toast.success("입찰이 수정되었습니다");
      router.push("/driver/requests");
    } else {
      // 신규 등록
      const { error } = await supabase.from("bids").insert({
        request_id: requestId,
        driver_id: user.id,
        price: priceNum,
        message: message.trim() || null,
        estimated_duration_min: durationNum,
        status: "pending",
      });

      setSubmitting(false);
      if (error) {
        console.error(error);
        toast.error("입찰 등록 실패: " + error.message);
        return;
      }
      toast.success("입찰이 등록되었습니다!");
      router.push("/driver/requests");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-mint-500" />
      </div>
    );
  }

  if (!request) return null;

  // 🔒 상태 분기
  const isMatched = request.status === "matched";
  const isCompleted = request.status === "completed";
  const isCancelled = request.status === "cancelled";
  const isDeadlinePassed =
    new Date(request.bid_deadline).getTime() < Date.now();
  const canBid = !isMatched && !isCompleted && !isCancelled && !isDeadlinePassed;

  // 내 입찰이 selected/rejected 인지
  const myBidSelected = myBid?.status === "selected";
  const myBidRejected = myBid?.status === "rejected";

  return (
    <div className="app-container pb-24">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3">
        <Link href="/driver/requests" className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold">요청 상세</h1>
      </header>

      <div className="px-5 pt-4">
        {/* 상태 + 마감 시간 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {myBidSelected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-mint-100 px-2.5 py-1 text-xs font-bold text-mint-700">
                <Handshake className="h-3.5 w-3.5" />
                내가 선택됨
              </span>
            )}
            {myBidRejected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                <XCircle className="h-3.5 w-3.5" />
                선택되지 않음
              </span>
            )}
            {myBid && !myBidSelected && !myBidRejected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2.5 py-1 text-xs font-bold text-mint-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                입찰 완료
              </span>
            )}
            {request.is_urgent && (
              <span className="inline-block rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
                긴급
              </span>
            )}
          </div>
          {!isMatched && !isCancelled && !isCompleted && (
            <span className="flex items-center gap-1 text-xs font-semibold text-orange-600">
              <Clock className="h-3.5 w-3.5" />
              {getRemainingTime(request.bid_deadline)}
            </span>
          )}
        </div>

        {/* 이사 종류 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-3">
          <div className="text-xs text-gray-500 mb-2">이사 정보</div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold">
              {request.service_type
                ? SERVICE_TYPE_LABELS[request.service_type]
                : "이사"}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-sm text-gray-700">
              {MOVE_TYPE_LABELS[request.move_type] ?? request.move_type}
            </span>
          </div>
        </div>

        {/* 출발지 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <MapPin className="h-3.5 w-3.5" />
            출발지
          </div>
          <div className="text-sm font-medium text-gray-900 mb-1">
            {request.from_address}
          </div>
          {request.from_address_detail && (
            <div className="text-xs text-gray-600 mb-2">
              {request.from_address_detail}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {request.from_floor}층
            </div>
            <span>
              엘리베이터 {request.from_has_elevator ? "있음" : "없음"}
            </span>
            {request.from_needs_ladder && (
              <span className="text-orange-600 font-semibold">사다리차</span>
            )}
          </div>
        </div>

        {/* 도착지 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <MapPin className="h-3.5 w-3.5" />
            도착지
          </div>
          <div className="text-sm font-medium text-gray-900 mb-1">
            {request.to_address}
          </div>
          {request.to_address_detail && (
            <div className="text-xs text-gray-600 mb-2">
              {request.to_address_detail}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {request.to_floor}층
            </div>
            <span>
              엘리베이터 {request.to_has_elevator ? "있음" : "없음"}
            </span>
            {request.to_needs_ladder && (
              <span className="text-orange-600 font-semibold">사다리차</span>
            )}
          </div>
        </div>

        {/* 일정 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Calendar className="h-3.5 w-3.5" />
            희망 일정
          </div>
          <div className="text-sm font-medium text-gray-900">
            {request.preferred_date} ·{" "}
            {TIME_SLOT_LABELS[request.time_slot] ?? request.time_slot}
          </div>
        </div>

        {/* 가구/짐 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Package className="h-3.5 w-3.5" />짐 정보
          </div>
          {request.furniture_items && request.furniture_items.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {request.furniture_items.map((item) => (
                <span
                  key={item}
                  className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
                >
                  {FURNITURE_LABELS[item] ?? item}
                </span>
              ))}
            </div>
          )}
          <div className="text-sm text-gray-700">
            박스 {request.box_count}개
          </div>
        </div>

        {/* 메모 */}
        {request.notes && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-3">
            <div className="text-xs text-gray-500 mb-2">고객 요청사항</div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {request.notes}
            </p>
          </div>
        )}

        {/* 🔒 상태별 분기 */}
        {isMatched && myBidSelected ? (
          // 내가 선택된 경우
          <div className="rounded-2xl border-2 border-mint-300 bg-mint-50 p-5 mt-5 text-center">
            <Handshake className="h-10 w-10 text-mint-600 mx-auto mb-2" />
            <h3 className="font-bold text-mint-900 mb-1">
              🎉 매칭에 성공했어요!
            </h3>
            <p className="text-sm text-mint-700 mb-4">
              고객님이 회원님을 선택했습니다. 매칭 목록에서 고객 연락처를 확인하세요.
            </p>
            <Link
              href="/driver/requests"
              className="inline-block rounded-full bg-mint-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-mint-700"
            >
              매칭 목록 보기
            </Link>
          </div>
        ) : isMatched ? (
          // 다른 기사가 선택된 경우
          <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-5 mt-5 text-center">
            <div className="text-3xl mb-2">🤝</div>
            <h3 className="font-bold text-gray-800 mb-1">
              이미 매칭이 완료된 요청입니다
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              다른 기사님이 선택되었어요. 다음 기회를 노려보세요!
            </p>
            <Link
              href="/driver/requests"
              className="inline-block rounded-full bg-mint-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-mint-700"
            >
              다른 요청 보기
            </Link>
          </div>
        ) : isCancelled ? (
          <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-5 mt-5 text-center">
            <div className="text-3xl mb-2">🚫</div>
            <h3 className="font-bold text-gray-800 mb-1">취소된 요청입니다</h3>
            <p className="text-sm text-gray-600">
              고객이 요청을 취소했습니다.
            </p>
          </div>
        ) : isCompleted ? (
          <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-5 mt-5 text-center">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="font-bold text-gray-800 mb-1">완료된 요청입니다</h3>
          </div>
        ) : isDeadlinePassed ? (
          <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-5 mt-5 text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">
              입찰 마감 시간이 지났어요
            </p>
            <p className="text-xs text-gray-500 mt-1">
              아쉽게도 더 이상 입찰할 수 없습니다.
            </p>
          </div>
        ) : canBid ? (
          // 입찰 폼
          <div className="rounded-2xl border-2 border-mint-200 bg-mint-50/50 p-4 mt-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5 text-mint-600" />
              <h2 className="font-bold text-mint-900">
                {myBid ? "내 입찰 수정" : "견적 제출"}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="price" className="text-sm">
                  입찰가 (원) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="text"
                  inputMode="numeric"
                  placeholder="예: 250,000"
                  value={price}
                  onChange={(e) => setPrice(formatPrice(e.target.value))}
                  className="h-12 mt-1.5 text-base font-semibold bg-white"
                />
              </div>

              <div>
                <Label htmlFor="duration" className="text-sm">
                  예상 작업 시간 (분, 선택)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  inputMode="numeric"
                  placeholder="예: 180"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-12 mt-1.5 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-sm">
                  고객에게 메시지 (선택)
                </Label>
                <textarea
                  id="message"
                  placeholder="안녕하세요! 안전하게 모셔드리겠습니다."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full mt-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint-400 resize-none"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 bg-mint-500 hover:bg-mint-600 text-white font-bold"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : myBid ? (
                  "입찰 수정하기"
                ) : (
                  "견적 제출하기"
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                고객이 선택하면 알림을 보내드릴게요
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
