// ──────────────────────────────────────────────────────────────────
// 쿠팡 링크 유틸리티
//
// [파트너스 계정 발급 후 설정 방법]
// 1. https://partners.coupang.com 에서 계정 발급
// 2. 파트너스 대시보드 > 링크 생성 > 검색 페이지 URL 입력
// 3. 생성된 추적 URL의 subId 부분을 .env에 저장
//    VITE_COUPANG_PARTNER_ID=여기에_파트너스_ID_입력
// ──────────────────────────────────────────────────────────────────

const PARTNER_ID = import.meta.env.VITE_COUPANG_PARTNER_ID

/**
 * 재료명으로 쿠팡 구매 링크 생성
 * - 파트너스 ID 없음: 일반 검색 링크 (로켓배송 우선)
 * - 파트너스 ID 있음: 수수료 추적 포함된 제휴 링크
 */
export function getCoupangUrl(name) {
  const query = encodeURIComponent(name)

  if (PARTNER_ID) {
    // 쿠팡 파트너스 제휴 링크 (수수료 발생)
    // 파트너스 대시보드에서 발급한 서브ID 포함
    return `https://www.coupang.com/np/search?q=${query}&affiliate_type=1&affiliate_id=${PARTNER_ID}`
  }

  // 일반 검색 링크 (로켓배송 필터로 최저가 우선 노출)
  return `https://www.coupang.com/np/search?q=${query}&rocketAll=true`
}

/** @deprecated S6Shopping에서 직접 import하던 함수 — getCoupangUrl 사용 */
export const getCoupangLink = getCoupangUrl
