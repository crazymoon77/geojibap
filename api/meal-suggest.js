/**
 * 식단 AI 에이전트 — Vercel 서버리스 함수
 *
 * POST /api/meal-suggest
 * Body: { settings: { budget, mealsCount, difficulty, calories, caloriesOn, protein, proteinOn } }
 *
 * Claude가 예산·난이도·영양 목표를 고려해 최적의 끼니 조합을 추천한다.
 * API 키 미설정 시 → 400 반환 (클라이언트가 기존 랜덤 로직으로 폴백)
 */

import Anthropic from '@anthropic-ai/sdk'

const MEAL_CANDIDATES = [
  { name: '계란후라이 + 즉석밥', emoji: '🍳', diff: '초간단', cost: 2200, kcal: 510, protein: 18 },
  { name: '신라면 + 계란',       emoji: '🍜', diff: '초간단', cost: 1400, kcal: 580, protein: 16 },
  { name: '콩나물국밥',          emoji: '🍲', diff: '초간단', cost: 2000, kcal: 420, protein: 14 },
  { name: '두부된장찌개',        emoji: '🫕', diff: '보통',   cost: 2800, kcal: 480, protein: 22 },
  { name: '참치김치찌개',        emoji: '🍲', diff: '보통',   cost: 3200, kcal: 520, protein: 28 },
  { name: '계란볶음밥',          emoji: '🍳', diff: '보통',   cost: 2200, kcal: 560, protein: 20 },
  { name: '닭가슴살볶음밥',      emoji: '🍚', diff: '도전',   cost: 4200, kcal: 580, protein: 45 },
  { name: '고등어구이',          emoji: '🐟', diff: '도전',   cost: 3800, kcal: 490, protein: 38 },
  { name: '제육볶음',            emoji: '🥩', diff: '도전',   cost: 4500, kcal: 620, protein: 35 },
]

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(400).json({ error: 'ANTHROPIC_API_KEY 미설정 — 기본 모드 사용' })
  }

  const { settings = {} } = req.body ?? {}
  const { budget = 10000, mealsCount = 3, difficulty = '보통', caloriesOn, calories = 2000, proteinOn, protein = 60 } = settings

  const diffLabel = difficulty.replace(/^[^\s]+\s/, '') // "🟡 보통" → "보통"
  const budgetPerMeal = Math.floor(budget / mealsCount)

  const candidateList = MEAL_CANDIDATES
    .map(m => `- ${m.name} (${m.diff}, ${m.cost}원, ${m.kcal}kcal, 단백질 ${m.protein}g)`)
    .join('\n')

  const constraints = [
    `끼니 수: ${mealsCount}개`,
    `끼니당 예산: 약 ${budgetPerMeal.toLocaleString()}원 이하`,
    `선호 난이도: ${diffLabel}`,
    caloriesOn ? `끼니당 목표 칼로리: ${Math.floor(calories / mealsCount)}kcal 이하` : null,
    proteinOn  ? `하루 단백질 목표: ${protein}g 이상` : null,
  ].filter(Boolean).join('\n')

  try {
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `아래 조건에 맞게 오늘 식단 ${mealsCount}개를 골라줘.

[조건]
${constraints}

[후보 메뉴 목록]
${candidateList}

[응답 형식]
조건에 가장 잘 맞는 메뉴 이름만 쉼표로 구분해서 딱 한 줄로 답해. 다른 말 붙이지 마.
예시: 계란후라이 + 즉석밥, 두부된장찌개, 고등어구이`,
      }],
    })

    const raw = message.content[0]?.text?.trim() ?? ''
    const names = raw.split(',').map(s => s.trim()).filter(Boolean)

    // 후보 목록에 실제 있는 이름만 수락
    const picked = names
      .map(name => MEAL_CANDIDATES.find(m => m.name === name))
      .filter(Boolean)
      .slice(0, mealsCount)

    if (picked.length < mealsCount) {
      return res.status(422).json({ error: '추천 결과 파싱 실패 — 기본 모드 사용' })
    }

    return res.status(200).json({ meals: picked.map(m => m.name) })
  } catch (err) {
    console.error('[meal-suggest]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
