// hooks/use-mobile.ts
'use client'

import { useState, useEffect } from 'react'

/**
 * クライアント側でのみ実行されるメディアクエリ用カスタムフック
 * @param query CSS メディアクエリ文字列 (例: '(max-width: 768px)')
 * @returns マッチしていれば true
 */
export default function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // window が存在しない SSR 時は何もしない
    if (typeof window === 'undefined') return

    const mediaQueryList = window.matchMedia(query)
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    // 初回チェック
    setMatches(mediaQueryList.matches)
    // イベント登録
    mediaQueryList.addEventListener('change', listener)
    return () => {
      mediaQueryList.removeEventListener('change', listener)
    }
  }, [query])

  return matches
}
