"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserX } from "lucide-react";
import { toast } from "sonner";
import { deleteMyAccount } from "@/lib/supabase/auth";

export function DeleteAccountButton() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "탈퇴") {
      toast.error("'탈퇴'를 정확히 입력해주세요");
      return;
    }

    setDeleting(true);
    const { error } = await deleteMyAccount();
    setDeleting(false);

    if (error) {
      console.error(error);
      toast.error("탈퇴 처리 실패: " + error.message);
      return;
    }

    toast.success("회원 탈퇴가 완료되었습니다");
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 800);
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center justify-center gap-1.5 w-full h-11 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50"
      >
        <UserX className="h-4 w-4" />
        회원 탈퇴
      </button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
      <h3 className="font-bold text-red-900 mb-2">정말 탈퇴하시겠어요?</h3>
      <ul className="text-xs text-red-800 space-y-1 mb-4 list-disc list-inside">
        <li>모든 견적 요청과 입찰 내역이 삭제됩니다</li>
        <li>삭제된 데이터는 복구할 수 없습니다</li>
        <li>같은 이메일로 재가입할 수 있습니다</li>
      </ul>

      <div className="mb-3">
        <label className="text-xs font-semibold text-red-900 mb-1.5 block">
          확인을 위해 <strong>&apos;탈퇴&apos;</strong>를 입력해주세요
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="탈퇴"
          className="w-full h-10 rounded-lg border border-red-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          disabled={deleting}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setShowConfirm(false);
            setConfirmText("");
          }}
          disabled={deleting}
          className="flex-1 h-10 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting || confirmText !== "탈퇴"}
          className="flex-1 h-10 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "탈퇴하기"
          )}
        </button>
      </div>
    </div>
  );
}
