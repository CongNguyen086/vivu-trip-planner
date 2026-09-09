export class AppError extends Error {
  constructor(code, httpStatus, userMessage) {
    super(userMessage)
    this.code = code
    this.httpStatus = httpStatus
    this.userMessage = userMessage
  }
}

const MESSAGES = {
  INVALID_KEY: 'API key chưa hợp lệ. Kiểm tra COACHIO_API_KEY trong .env.',
  NO_CREDIT: 'Tài khoản đã hết credit.',
  RATE_LIMIT: 'Hệ thống đang bận, thử lại sau ít giây.',
  BAD_REQUEST: 'Yêu cầu không hợp lệ. Thử mô tả ngắn gọn hơn.',
  UPSTREAM: 'Không kết nối được máy chủ AI. Thử lại.',
  TIMEOUT: 'Quá thời gian chờ. Thử lại.',
  PARSE_FAILED: 'AI trả về dữ liệu không đọc được. Thử lại.',
}

export function mapError(status) {
  if (status === 'TIMEOUT') return new AppError('TIMEOUT', 504, MESSAGES.TIMEOUT)
  if (status === 'PARSE_FAILED') return new AppError('PARSE_FAILED', 502, MESSAGES.PARSE_FAILED)
  if (status === 401) return new AppError('INVALID_KEY', 401, MESSAGES.INVALID_KEY)
  if (status === 402) return new AppError('NO_CREDIT', 402, MESSAGES.NO_CREDIT)
  if (status === 429) return new AppError('RATE_LIMIT', 429, MESSAGES.RATE_LIMIT)
  if (status === 400) return new AppError('BAD_REQUEST', 400, MESSAGES.BAD_REQUEST)
  return new AppError('UPSTREAM', 502, MESSAGES.UPSTREAM)
}

export function parseJson(text) {
  let s = String(text || '').trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  try {
    return JSON.parse(s)
  } catch {
    const first = s.search(/[[{]/)
    const last = Math.max(s.lastIndexOf(']'), s.lastIndexOf('}'))
    if (first !== -1 && last > first) {
      try { return JSON.parse(s.slice(first, last + 1)) } catch { /* rơi xuống */ }
    }
    throw mapError('PARSE_FAILED')
  }
}

const COACHIO_URL = 'https://api.coachio.ai/api/v1/llm/chat/completions'
const MODEL = 'google/gemini-3.1-flash-lite'

export async function chatCompletion(messages, { maxTokens = 4096, temperature = 0.7, timeoutMs = 45000 } = {}) {
  const key = process.env.COACHIO_API_KEY
  if (!key) throw mapError(401)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  let resp
  try {
    resp = await fetch(COACHIO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
      body: JSON.stringify({ model: MODEL, messages, stream: false, temperature, max_tokens: maxTokens }),
      signal: ctrl.signal,
    })
  } catch (e) {
    clearTimeout(timer)
    if (e.name === 'AbortError') throw mapError('TIMEOUT')
    throw mapError('UPSTREAM')
  }
  clearTimeout(timer)
  if (!resp.ok) throw mapError(resp.status)
  const data = await resp.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') throw mapError('PARSE_FAILED')
  return content
}

export async function generateJson(messages) {
  const raw = await chatCompletion(messages)
  try {
    return parseJson(raw)
  } catch (e) {
    if (e.code !== 'PARSE_FAILED') throw e
    const retry = [
      ...messages,
      { role: 'assistant', content: raw },
      { role: 'user', content: 'Câu trả lời trên không phải JSON hợp lệ. Chỉ trả JSON thuần, không giải thích, không code fence.' },
    ]
    const raw2 = await chatCompletion(retry)
    return parseJson(raw2)
  }
}
