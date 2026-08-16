import { NextRequest } from "next/server";
import { db } from "@/lib/firebase";

/**
 * 簡易的なFirestoreベースのレートリミット
 * @param req NextRequest
 * @param limit 制限回数 (例: 10回)
 * @param windowMs 制限ウィンドウ (ミリ秒, 例: 60000 = 1分)
 * @returns boolean 許可される場合はtrue、制限に引っかかった場合はfalse
 */
export async function checkRateLimit(req: NextRequest, limit: number = 10, windowMs: number = 60000): Promise<boolean> {
  // IPアドレスの取得 (Vercel等のプロキシ経由を想定; req.ip は Next.js 新バージョンで廃止)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || "unknown-ip";
  
  if (ip === "unknown-ip") {
    // IPが特定できない場合はスルー（または厳格にする場合はfalseを返す）
    return true;
  }

  // Firestoreのキーとして使えるようにサニタイズ（ピリオドやコロンはそのまま使える）
  const ipKey = ip.replace(/[^a-zA-Z0-9.:-]/g, "");
  if (!ipKey) return true;

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
            // 制限オーバー
            return false;
          }
          // カウントアップ
          transaction.update(rateLimitRef, { count: count + 1 });
          return true;
        }
      }

      // ドキュメントが存在しない、または有効期限切れの場合
      // 新規作成（リセット）
      transaction.set(rateLimitRef, {
        count: 1,
        expiresAt: new Date(now + windowMs),
      });

      return true;
    });
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // データベースエラー等でアプリを止めないために true を返す
    return true;
  }
}
