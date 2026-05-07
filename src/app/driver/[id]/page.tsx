"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Star,
  User as UserIcon,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DriverInfo {
  id: string;
  name: string;
  role: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface RatingInfo {
  avg_rating: number;
  review_count: number;
}

export default function DriverProfilePage() {
  const params = useParams();
  const driverId = params.id as string;

  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [rating, setRating] = useState<RatingInfo>({
    avg_rating: 0,
    review_count: 0,
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      // 1. 기사 기본 정보
      const { data: driverData } = await supabase
        .from("users")
        .select("id, name, role")
        .eq("id", driverId)
        .eq("role", "driver")
        .maybeSingle();

      if (!driverData) {
        setLoading(false);
        return;
      }
      setDriver(driverData);

      // 2. 평균 별점 + 후기 수
      const { data: ratingData } = await supabase.rpc("get_driver_rating", {
        p_driver_id: driverId,
      });
      if (ratingData && ratingData.length > 0) {
        setRating({
          avg_rating: Number(ratingData[0].avg_rating) || 0,
          review_count: Number(ratingData[0].review_count) || 0,
        });
      }

      // 3. 후기 목록
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at")
        .eq("driver_id", driverId)
        .order("created_at", { ascending: false });

      setReviews(reviewsData || []);
      setLoading(false);
    };

    loadData();
  }, [driverId]);

  if (loading) {
    return (
      <div className="app-container flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-mint-500" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="app-container">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3">
          <Link href="/" className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-bold">기사님 프로필</h1>
        </header>
        <div className="px-5 py-20 text-center">
          <p className="text-gray-500">기사님 정보를 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container pb-10">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-gray-100 bg-white px-3">
        <Link href="/" className="p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-bold">기사님 프로필</h1>
      </header>

      <div className="px-5 pt-6">
        {/* 기사 기본 정보 */}
        <div className="rounded-2xl border-2 border-mint-200 bg-mint-50/40 p-5 mb-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mint-100 mx-auto mb-3">
            <UserIcon className="h-8 w-8 text-mint-700" />
          </div>
          <h2 className="font-bold text-lg text-gray-900 mb-1">
            {driver.name} 기사님
          </h2>

          {/* 평균 별점 */}
          {rating.review_count > 0 ? (
            <div className="flex items-center justify-center gap-1 mt-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-5 w-5 ${
                      n <= Math.round(rating.avg_rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="ml-1 text-base font-bold text-gray-900">
                {rating.avg_rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({rating.review_count}개 후기)
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-2">아직 후기가 없어요</p>
          )}
        </div>

        {/* 후기 목록 */}
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-mint-600" />
          <h3 className="font-bold text-base">
            후기 <span className="text-mint-600">{reviews.length}</span>건
          </h3>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
            <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              아직 작성된 후기가 없어요
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-gray-100 bg-white p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`h-4 w-4 ${
                          n <= r.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm font-bold text-gray-700">
                      {r.rating}.0
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {new Date(r.created_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {r.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
