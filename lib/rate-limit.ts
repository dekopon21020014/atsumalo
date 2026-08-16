import { NextRequest } from "next/server";
import { db } from "@/lib/firebase";

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfter: number } // retryAfter: 残り秒数

/**
 * 簡易的なFirestoreベースのレートリミット
 * @param req NextRequest
 * @param limit 制限回数 (例: 10回)
 * @param windowMs 制限ウィンドウ (ミリ秒, 例: 60000 = 1分)
 * @returns RateLimitResult - 許可される場合は { allowed: true }、制限超過の場合は { allowed: false, retryAfter: 残り秒数 }
 */
export async function checkRateLimit(
  req: NextRequest,
  limit: number = 10,
  windowMs: number = 60000,
): Promise<RateLimitResult> {
  // IPアドレスの取得 (Vercel等のプロキシ経由を想定; req.ip は Next.js 新バージョンで廃止)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || "unknown-ip";

  if (ip === "unknown-ip") {
    // IPが特定できない場合はスルー
    return { allowed: true };
  }

  // Firestoreのキーとして使えるようにサニタイズ（ピリオドやコロンはそのまま使える）
  const ipKey = ip.replace(/[^a-zA-Z0-9.:-]/g, "");
  if (!ipKey) return { allowed: true };

  const rateLimitRef = db.collection("rate_limits").doc(ipKey);

  try {
    return await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      const now = Date.now();

      if (doc.exists) {
        const data = doc.data();
        const expiresAtData = data?.expiresAt;
        // Firestore Timestamp / Date のミリ秒取得、または既存の数値型に対応
        const expiresAt =
          expiresAtData?.toMillis?.() ??
          expiresAtData?.getTime?.() ??
          (typeof expiresAtData === "number" ? expiresAtData : 0);
        const count = data?.count || 0;

        if (now < expiresAt) {
          // 有効期限内
          if (count >= limit) {
            // 制限オーバー: 残り秒数を返す
            const retryAfter = Math.ceil((expiresAt - now) / 1000);
            return { allowed: false, retryAfter } as RateLimitResult;
          }
          // カウントアップ
          transaction.update(rateLimitRef, { count: count + 1 });
          return { allowed: true };
        }
      }

      // ドキュメントが存在しない、または有効期限切れの場合
      // 新規作成（リセット）
      transaction.set(rateLimitRef, {
        count: 1,
        expiresAt: new Date(now + windowMs),
      });

      return { allowed: true };
    });
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // データベースエラー等でアプリを止めないために許可する
    return { allowed: true };
  }
}
