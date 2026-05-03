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
  CheckCircle2,
  Inbox,
  User as UserIcon,
  Phone,
  XCircle,
  AlertTriangle,
  Star,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface MoveRequest {
  id: string;
  customer_id: string;
  from_address: string;
  from_floor: number;
  to_address: string;
  to_floor: number;
  service_type: "general" | "half_packing" | "full_packing" | null;
  move_type: string;
  furniture_items: string[] | null;
  box_count: number;
  notes: string | null;
  preferred_date: string;
  time_slot: string;
  is_urgent: boolean;
  status:
    | "open"
    | "matched"
    | "pending_completion"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "expired";
  bid_deadline: string;
  selected_bid_id: string | null;
}

interface Bid {
  id: string;
  driver_id: string;
  price: number;
  message: string | null;
  estimated_duration_min: number | null;
  status: string;
  created_at: string;
  driver_name?: string;
  driver_phone?: string;
}

interface Review {
  id: string;
  request_id: string;
  customer_id: string;
  driver_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
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

function canCancelMatching(preferredDate: string): {
  ok: boolean;
  reason?: string;
} {
  const moveTime = new Date(preferredDate + "T00:00:00").getTime();
  const now = Date.now();
  const hoursLeft = (moveTime - now) / 3600000;
  if (hoursLeft < 24) {
    return {
      ok: false,
      reason: "이사 24시간 전부터는 매칭을 취소할 수 없습니다.",
    };
  }
  return { ok: true };
}

// 후기 수정 가능 여부 (작성 후 24시간 이내)
function canEditReview(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created < 24 * 3600 * 1000;
}

export default function CustomerRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [request, setRequest] = useState<MoveRequest | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmingComplete, setConfirmingComplete] = useState(false);

  // 후기 입력 상태
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const loadData = async () => {
    if (!user) return;
    const supabase = createClient();

    const { data: req, error: reqError } = await supabase
      .from("move_requests")
      .select("*")
      .eq("id", requestId)
      .eq("customer_id", user.id)
      .single();

    if (reqError || !req) {
      console.error(reqError);
      toast.error("요청을 찾을 수 없습니다");
      router.push("/my/requests");
      return;
    }

    setRequest(req);

    const { data: bidsData, error: bidsError } = await supabase.rpc(
      "get_bids_for_my_request",
      { p_request_id: requestId }
    );

    if (bidsError) {
      console.error("입찰 조회 실패:", bidsError);
      toast.error("입찰 목록을 불러오지 못했어요");
    } else {
      const enriched = (bidsData || []).map((b: Bid) => ({
        ...b,
        driver_name: b.driver_name || "기사님",
      }));
      setBids(enriched);
    }

    // 후기 조회
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();

    if (reviewData) {
      setReview(reviewData);
      setRating(reviewData.rating);
      setComment(reviewData.comment || "");
    }

    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error("로그인이 필요합니다");
      router.push("/login");
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, requestId, router]);

  const handleAccept = async (bid: Bid) => {
    if (!request) return;
    if (request.status !== "open") {
      toast.error("이미 매칭이 완료된 요청입니다");
      return;
    }
    if (
      !confirm(
        `${bid.driver_name} 기사님을 선택하시겠어요?\n선택 후에는 변경이 어렵습니다.`
      )
    ) {
      return;
    }

    setAccepting(bid.id);
    const supabase = createClient();

    const { error: e1 } = await supabase
      .from("bids")
      .update({ status: "selected" })
      .eq("id", bid.id);

    if (e1) {
      setAccepting(null);
      console.error(e1);
      toast.error("선택 실패: " + e1.message);
      return;
    }

    const { error: e2 } = await supabase
      .from("bids")
      .update({ status: "rejected" })
      .eq("request_id", request.id)
      .neq("id", bid.id)
      .eq("status", "pending");

    if (e2) {
      console.error("다른 입찰 rejected 처리 실패:", e2);
    }

    const { error: e3 } = await supabase
      .from("move_requests")
      .update({
        status: "matched",
        selected_bid_id: bid.id,
      })
      .eq("id", request.id);

    setAccepting(null);
    if (e3) {
      console.error(e3);
      toast.error("매칭 실패: " + e3.message);
      return;
    }

    toast.success(`${bid.driver_name} 기사님 선택 완료! 🎉`);
    setTimeout(() => window.location.reload(), 800);
  };

  const handleCancelRequest = async () => {
    if (!request) return;
    if (request.status !== "open") {
      toast.error("이미 매칭되었거나 종료된 요청입니다");
      return;
    }
    if (
      !confirm(
        "정말 이 견적 요청을 취소하시겠어요?\n입찰한 기사님들에게 자동으로 알림이 갑니다."
      )
    ) {
      return;
    }

    setCancelling(true);
    const supabase = createClient();

    const { error: e1 } = await supabase
      .from("bids")
      .update({ status: "cancelled" })
      .eq("request_id", request.id)
      .eq("status", "pending");

    if (e1) {
      console.error("입찰 취소 처리 실패:", e1);
    }

    const { error: e2 } = await supabase
      .from("move_requests")
      .update({ status: "cancelled" })
      .eq("id", request.id);

    setCancelling(false);
    if (e2) {
      console.error(e2);
      toast.error("요청 취소 실패: " + e2.message);
      return;
    }

    toast.success("견적 요청이 취소되었어요");
    setTimeout(() => router.push("/my/requests"), 600);
  };

  const handleCancelMatching = async () => {
    if (!request) return;
    if (request.status !== "matched") {
      toast.error("매칭된 요청만 취소할 수 있습니다");
      return;
    }
    const check = canCancelMatching(request.preferred_date);
    if (!check.ok) {
      toast.error(check.reason || "지금은 취소할 수 없습니다");
      return;
    }
    if (
      !confirm(
        "⚠️ 정말 매칭을 취소하시겠어요?\n선택한 기사님께 자동으로 알림이 가며,\n이 요청은 종료 처리됩니다.\n\n계속하시려면 확인을 누르세요."
      )
    ) {
      return;
    }

    setCancelling(true);
    const supabase = createClient();

    if (request.selected_bid_id) {
      const { error: e1 } = await supabase
        .from("bids")
        .update({ status: "cancelled" })
        .eq("id", request.selected_bid_id);

      if (e1) {
        console.error("선택된 입찰 cancelled 실패:", e1);
      }
    }

    const { error: e2 } = await supabase
      .from("move_requests")
      .update({ status: "cancelled" })
      .eq("id", request.id);

    setCancelling(false);
    if (e2) {
      console.error(e2);
      toast.error("매칭 취소 실패: " + e2.message);
      return;
    }

    toast.success("매칭이 취소되었어요");
    setTimeout(() => router.push("/my/requests"), 600);
  };

  // 이사 완료 확인 (pending_completion → completed)
  const handleConfirmCompletion = async () => {
    if (!request) return;
    if (request.status !== "pending_completion") {
      toast.error("완료 확인이 가능한 상태가 아닙니다");
      return;
    }
    if (
      !confirm(
        "이사를 잘 받으셨나요?\n\n확인을 누르면 정식 완료 처리되고,\n별점/후기를 작성할 수 있어요."
      )
    ) {
      return;
    }

    setConfirmingComplete(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("move_requests")
      .update({ status: "completed" })
      .eq("id", request.id);

    setConfirmingComplete(false);
    if (error) {
      console.error(error);
      toast.error("완료 처리 실패: " + error.message);
      return;
    }

    toast.success("이사 완료! 별점을 남겨주세요 ⭐");
    setRequest({ ...request, status: "completed" });
    setShowReviewForm(true);
  };

  // 아직 완료 안됨 → matched 로 되돌림
  const handleRejectCompletion = async () => {
    if (!request) return;
    if (
      !confirm(
        "아직 이사를 받지 않으셨나요?\n\n매칭 상태로 되돌립니다.\n기사님과 직접 연락해 확인해주세요."
      )
    ) {
      return;
    }

    setConfirmingComplete(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("move_requests")
      .update({ status: "matched" })
      .eq("id", request.id);

    setConfirmingComplete(false);
    if (error) {
      console.error(error);
      toast.error("처리 실패: " + error.message);
      return;
    }

    toast.success("매칭 상태로 되돌렸어요");
    setRequest({ ...request, status: "matched" });
  };

  // 후기 등록/수정
  const handleSubmitReview = async () => {
    if (!user || !request) return;
    if (request.status !== "completed") {
      toast.error("완료된 요청만 후기를 작성할 수 있습니다");
      return;
    }
    if (!request.selected_bid_id) {
      toast.error("매칭된 기사 정보가 없습니다");
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error("별점을 선택해주세요");
      return;
    }

    const acceptedBid = bids.find((b) => b.id === request.selected_bid_id);
    if (!acceptedBid) {
      toast.error("기사 정보를 찾을 수 없습니다");
      return;
    }

    setSubmittingReview(true);
    const supabase = createClient();

    if (review) {
      // 수정
      if (!canEditReview(review.created_at)) {
        toast.error("작성 후 24시간이 지나 수정할 수 없습니다");
        setSubmittingReview(false);
        return;
      }
      const { error } = await supabase
        .from("reviews")
        .update({
          rating,
          comment: comment.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", review.id);

      setSubmittingReview(false);
      if (error) {
        console.error(error);
        toast.error("후기 수정 실패: " + error.message);
        return;
      }
      toast.success("후기가 수정되었어요");
      setShowReviewForm(false);
      loadData();
    } else {
      // 신규
      const { error } = await supabase.from("reviews").insert({
        request_id: request.id,
        customer_id: user.id,
        driver_id: acceptedBid.driver_id,
        rating,
        comment: comment.trim() || null,
      });

      setSubmittingReview(false);
      if (error) {
        console.error(error);
        toast.error("후기 등록 실패: " + error.message);
        return;
      }
      toast.success("소중한 후기 감사합니다! ⭐");
      setShowReviewForm(false);
      loadData();
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

  const isOpen = request.status === "open";
  const isMatched = request.status === "matched";
  const isPendingCompletion = request.status === "pending_completion";
  const isCompleted = request.status === "completed";
  const isCancelled = request.status === "cancelled";
  const acceptedBid = bids.find((b) => b.id === request.selected_bid_id);
  const cancelMatchingCheck = canCancelMatching(request.preferred_date);
  const reviewEditable = review ? canEditReview(review.created_at) : true;

  return (
    <div className="app-container pb-10">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3">
        <Link href="/my/requests" className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold">견적 요청 상세</h1>
      </header>

      <div className="px-5 pt-4">
        {/* 상태 표시 */}
        <div className="flex items-center justify-between mb-4">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-mint-100 px-2.5 py-1 text-xs font-bold text-mint-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              완료됨
            </span>
          ) : isPendingCompletion ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700">
              <Clock className="h-3.5 w-3.5" />
              완료 확인 대기 중
            </span>
          ) : isMatched ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              매칭 완료
            </span>
          ) : isCancelled ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
              <XCircle className="h-3.5 w-3.5" />
              취소됨
            </span>
          ) : (
            <span className="inline-block rounded-full bg-mint-50 px-2.5 py-1 text-xs font-bold text-mint-700">
              입찰 받는 중
            </span>
          )}
          {isOpen && (
            <span className="flex items-center gap-1 text-xs font-semibold text-orange-600">
              <Clock className="h-3.5 w-3.5" />
              {getRemainingTime(request.bid_deadline)}
            </span>
          )}
        </div>

        {/* 요청 요약 */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold">
              {request.service_type
                ? SERVICE_TYPE_LABELS[request.service_type]
                : "이사"}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-sm text-gray-700">
              {MOVE_TYPE_LABELS[request.move_type] ?? request.move_type}
            </span>
            {request.is_urgent && (
              <span className="ml-auto inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                긴급
              </span>
            )}
          </div>
          <div className="flex items-start gap-1.5 text-sm text-gray-700 mb-2">
            <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-mint-600" />
            <div className="flex-1">
              <div>
                {request.from_address} ({request.from_floor}층)
              </div>
              <div className="text-gray-500 text-xs my-0.5">↓</div>
              <div>
                {request.to_address} ({request.to_floor}층)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
            <Calendar className="h-3.5 w-3.5 text-mint-600" />
            {request.preferred_date} ·{" "}
            {TIME_SLOT_LABELS[request.time_slot] ?? request.time_slot}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Package className="h-3.5 w-3.5 text-mint-600" />
            박스 {request.box_count}개
            {request.furniture_items && request.furniture_items.length > 0 && (
              <span className="ml-1 text-gray-500">
                ·{" "}
                {request.furniture_items
                  .map((f) => FURNITURE_LABELS[f] ?? f)
                  .join(", ")}
              </span>
            )}
          </div>
        </div>

        {/* 매칭된 기사 표시 (matched, pending_completion, completed 모두) */}
        {(isMatched || isPendingCompletion || isCompleted) && acceptedBid && (
          <div className="rounded-2xl border-2 border-blue-300 bg-blue-50/40 p-4 mb-4">
            <div className="text-xs text-blue-700 font-semibold mb-2">
              ✓ {isCompleted ? "이사를 함께한 기사님" : "선택한 기사님"}
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                  <UserIcon className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <div className="font-bold text-sm">
                    {acceptedBid.driver_name}
                  </div>
                  {acceptedBid.driver_phone && (
                    <div className="text-xs text-gray-600">
                      {acceptedBid.driver_phone}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-700">
                  {acceptedBid.price.toLocaleString("ko-KR")}원
                </div>
              </div>
            </div>
            {acceptedBid.driver_phone && !isCompleted && (
              <a
                href={`tel:${acceptedBid.driver_phone}`}
                className="flex items-center justify-center gap-1.5 w-full rounded-full bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                <Phone className="h-4 w-4" />
                기사님께 전화하기
              </a>
            )}
            {acceptedBid.message && (
              <p className="text-sm text-gray-700 mt-3 p-2 bg-white rounded-lg">
                {acceptedBid.message}
              </p>
            )}
          </div>
        )}

        {/* 완료 확인 박스 (pending_completion) */}
        {isPendingCompletion && (
          <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-5 mb-4">
            <div className="text-center mb-4">
              <PackageCheck className="h-10 w-10 text-orange-600 mx-auto mb-2" />
              <h3 className="font-bold text-orange-900 mb-1">
                기사님이 이사 완료를 알렸어요
              </h3>
              <p className="text-sm text-orange-700">
                이사를 잘 받으셨나요?
                <br />
                확인하시면 정식 완료 처리되고 후기 작성이 가능해요.
              </p>
            </div>

            <Button
              onClick={handleConfirmCompletion}
              disabled={confirmingComplete}
              className="w-full h-12 bg-mint-600 hover:bg-mint-700 text-white font-bold mb-2"
            >
              {confirmingComplete ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-1.5" />네, 잘 받았어요
                </>
              )}
            </Button>

            <button
              onClick={handleRejectCompletion}
              disabled={confirmingComplete}
              className="w-full h-11 rounded-xl border border-orange-300 text-orange-700 text-sm font-semibold hover:bg-orange-100 disabled:opacity-50"
            >
              아직 안 받았어요
            </button>
          </div>
        )}

        {/* 후기 입력/표시 (completed) */}
        {isCompleted && (
          <div className="rounded-2xl border-2 border-mint-200 bg-mint-50/50 p-5 mb-4">
            {!review && !showReviewForm ? (
              <div className="text-center">
                <Star className="h-10 w-10 text-mint-500 mx-auto mb-2" />
                <h3 className="font-bold text-mint-900 mb-1">
                  기사님은 어떠셨나요?
                </h3>
                <p className="text-sm text-mint-700 mb-4">
                  소중한 후기로 다른 고객님께 도움을 주세요.
                </p>
                <Button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full h-11 bg-mint-600 hover:bg-mint-700 text-white font-bold"
                >
                  별점/후기 작성하기
                </Button>
              </div>
            ) : showReviewForm ? (
              <>
                <h3 className="font-bold text-mint-900 mb-3 text-center">
                  {review ? "후기 수정" : "별점/후기 작성"}
                </h3>

                {/* 별점 */}
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const filled = (hoverRating || rating) >= n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(n)}
                        className="p-1"
                      >
                        <Star
                          className={`h-9 w-9 transition ${
                            filled
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-center text-xs text-gray-600 mb-4">
                  {rating === 0 && "별점을 선택해주세요"}
                  {rating === 1 && "별로예요"}
                  {rating === 2 && "그저 그래요"}
                  {rating === 3 && "보통이에요"}
                  {rating === 4 && "좋아요"}
                  {rating === 5 && "최고예요!"}
                </div>

                {/* 코멘트 */}
                <textarea
                  placeholder="기사님께 한 마디 남겨주세요 (선택)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint-400 resize-none mb-1"
                />
                <div className="text-right text-[11px] text-gray-400 mb-3">
                  {comment.length}/500
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowReviewForm(false);
                      if (review) {
                        setRating(review.rating);
                        setComment(review.comment || "");
                      } else {
                        setRating(0);
                        setComment("");
                      }
                    }}
                    disabled={submittingReview}
                    className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                  >
                    취소
                  </button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || rating < 1}
                    className="flex-1 h-11 bg-mint-600 hover:bg-mint-700 text-white font-bold"
                  >
                    {submittingReview ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : review ? (
                      "수정하기"
                    ) : (
                      "등록하기"
                    )}
                  </Button>
                </div>
              </>
            ) : review ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-mint-900">내가 남긴 후기</h3>
                  {reviewEditable && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="text-xs font-semibold text-mint-700 hover:text-mint-800 underline"
                    >
                      수정
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-5 w-5 ${
                        n <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-sm font-bold text-gray-700">
                    {review.rating}.0
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700 p-3 bg-white rounded-lg whitespace-pre-wrap">
                    {review.comment}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-gray-500">
                  {reviewEditable
                    ? "작성 후 24시간 내에만 수정할 수 있어요"
                    : "수정 가능 시간이 지났어요"}
                </p>
              </>
            ) : null}
          </div>
        )}

        {/* 취소 안내 (cancelled 상태) */}
        {isCancelled && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 mb-4 text-center">
            <XCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">
              이 요청은 취소되었습니다
            </p>
            <p className="text-xs text-gray-500 mt-1">
              새로 견적을 받으시려면 요청을 다시 등록해주세요
            </p>
            <Link
              href="/request"
              className="inline-block mt-3 rounded-full bg-mint-600 px-4 py-2 text-sm font-bold text-white hover:bg-mint-700"
            >
              새 견적 요청하기
            </Link>
          </div>
        )}

        {/* 입찰 목록 (open 상태일 때만) */}
        {isOpen && (
          <>
            <div className="mt-5 mb-3 flex items-center justify-between">
              <h2 className="font-bold text-base">
                받은 견적 <span className="text-mint-600">{bids.length}</span>건
              </h2>
              {bids.length > 0 && (
                <span className="text-xs text-gray-500">가격순 정렬</span>
              )}
            </div>

            {bids.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                  <Inbox className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">
                  아직 받은 견적이 없어요
                </p>
                <p className="text-xs text-gray-500">
                  평균 5~10명의 기사님이 입찰합니다
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bids.map((bid, idx) => {
                  const isLowest = idx === 0;
                  return (
                    <div
                      key={bid.id}
                      className="rounded-2xl border border-gray-100 bg-white p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-100">
                            <UserIcon className="h-4 w-4 text-mint-700" />
                          </div>
                          <div>
                            <div className="font-bold text-sm flex items-center gap-1.5">
                              {bid.driver_name}
                              {isLowest && (
                                <span className="inline-block rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                                  최저가
                                </span>
                              )}
                            </div>
                            {bid.estimated_duration_min && (
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                예상{" "}
                                {Math.floor(bid.estimated_duration_min / 60)}시간{" "}
                                {bid.estimated_duration_min % 60 > 0 &&
                                  `${bid.estimated_duration_min % 60}분`}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {bid.price.toLocaleString("ko-KR")}
                            <span className="text-xs font-medium text-gray-500 ml-0.5">
                              원
                            </span>
                          </div>
                        </div>
                      </div>

                      {bid.message && (
                        <p className="text-sm text-gray-700 mb-3 p-2.5 bg-gray-50 rounded-lg whitespace-pre-wrap">
                          {bid.message}
                        </p>
                      )}

                      <Button
                        onClick={() => handleAccept(bid)}
                        disabled={accepting !== null || cancelling}
                        className="w-full h-11 bg-mint-500 hover:bg-mint-600 text-white font-bold"
                      >
                        {accepting === bid.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "이 기사님 선택하기"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* 취소 버튼 영역 */}
        {isOpen && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <button
              onClick={handleCancelRequest}
              disabled={cancelling}
              className="flex items-center justify-center gap-1.5 w-full h-11 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  견적 요청 취소하기
                </>
              )}
            </button>
            <p className="mt-2 text-[11px] text-gray-500 text-center">
              입찰한 기사님들에게 자동으로 취소 알림이 갑니다
            </p>
          </div>
        )}

        {isMatched && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            {cancelMatchingCheck.ok ? (
              <>
                <button
                  onClick={handleCancelMatching}
                  disabled={cancelling}
                  className="flex items-center justify-center gap-1.5 w-full h-11 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
                >
                  {cancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      매칭 취소하기
                    </>
                  )}
                </button>
                <p className="mt-2 text-[11px] text-gray-500 text-center">
                  이사 24시간 전까지만 취소 가능합니다
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-600">
                  ⏰ 이사 24시간 전부터는 매칭을 취소할 수 없습니다
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  부득이한 사정이 있다면 기사님께 직접 연락해주세요
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
