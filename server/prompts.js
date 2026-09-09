const STYLE_LABELS = {
  'bien': 'biển', 'nui': 'núi', 'am-thuc': 'ẩm thực', 'lich-su': 'lịch sử',
  'nghi-duong': 'nghỉ dưỡng', 'soi-dong': 'sôi động', 'thien-nhien': 'thiên nhiên', 'chup-anh': 'chụp ảnh',
}
const BUDGET_LABELS = { 'tiet-kiem': 'tiết kiệm', 'vua': 'vừa phải', 'cao-cap': 'cao cấp' }
const COMPANION_LABELS = { 'mot-minh': 'một mình', 'cap-doi': 'cặp đôi', 'gia-dinh': 'gia đình', 'nhom-ban': 'nhóm bạn' }

function describeRequest(r) {
  const parts = []
  if (r.prompt?.trim()) parts.push(`Mong muốn: "${r.prompt.trim()}"`)
  if (r.area?.trim()) parts.push(`Khu vực mong muốn: ${r.area.trim()}`)
  parts.push(`Số ngày: ${r.days}`)
  parts.push(`Ngày đi: ${r.startDate}`)
  if (r.budget) parts.push(`Ngân sách: ${BUDGET_LABELS[r.budget] || r.budget}`)
  if (r.styles?.length) parts.push(`Phong cách: ${r.styles.map((s) => STYLE_LABELS[s] || s).join(', ')}`)
  if (r.companions) parts.push(`Đi cùng: ${COMPANION_LABELS[r.companions] || r.companions}`)
  return parts.join('\n')
}

export function buildSuggestPrompt(r) {
  const system = [
    'Bạn là chuyên gia du lịch Việt Nam.',
    'CHỈ gợi ý địa điểm nằm trong lãnh thổ Việt Nam.',
    'Trả về DUY NHẤT một JSON array, không văn bản kèm theo, không code fence.',
    'Mỗi phần tử: { "name": string, "province": string, "whyFit": string, "tags": string[3..4], "wikiTitle": string, "imageQuery": string }.',
    '"whyFit" (1-2 câu) phải tham chiếu CỤ THỂ vào mong muốn người dùng, không viết chung chung.',
    '"wikiTitle" là tiêu đề tra trên Wikipedia tiếng Việt (ví dụ "Đà Lạt").',
    '"imageQuery" là từ khoá ảnh dự phòng (ví dụ "Đà Lạt hồ Xuân Hương").',
    'Trả về 6 đến 8 phần tử.',
  ].join(' ')
  const user = `Gợi ý địa điểm phù hợp cho chuyến đi sau:\n${describeRequest(r)}`
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

export function buildItineraryPrompt({ destination, days, startDate, request }) {
  const system = [
    'Bạn là chuyên gia du lịch Việt Nam, lập lịch trình chi tiết.',
    'Trả về DUY NHẤT một JSON array, không văn bản kèm theo, không code fence.',
    `Array có đúng ${days} phần tử (mỗi phần tử là một ngày).`,
    'Mỗi ngày: { "dayIndex": number(1-based), "date": "YYYY-MM-DD", "slots": [...] }.',
    '"slots" có ĐÚNG 4 phần tử theo thứ tự period = "Sáng","Trưa","Chiều","Tối".',
    'Mỗi slot: { "period": string, "placeName": string, "description": string(1-2 câu), "duration": string, "icon": string, "wikiTitle": string, "imageQuery": string }.',
    '"placeName" là địa điểm CỤ THỂ có tên riêng (nhà hàng, chùa, hồ, chợ...), không viết chung chung.',
    '"icon" chọn trong: utensils, coffee, camera, bed, map-pin.',
    'Tất cả địa điểm phải nằm trong/quanh khu vực đã cho, thuộc Việt Nam.',
  ].join(' ')
  const user = [
    `Địa điểm: ${destination.name}${destination.province ? ' (' + destination.province + ')' : ''}.`,
    `Bắt đầu: ${startDate}, ${days} ngày.`,
    request?.prompt?.trim() ? `Mong muốn thêm: "${request.prompt.trim()}".` : '',
  ].filter(Boolean).join('\n')
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
