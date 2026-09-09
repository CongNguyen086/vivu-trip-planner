export const STYLES = [
  { value: 'bien', label: 'Biển' }, { value: 'nui', label: 'Núi' },
  { value: 'am-thuc', label: 'Ẩm thực' }, { value: 'lich-su', label: 'Lịch sử' },
  { value: 'nghi-duong', label: 'Nghỉ dưỡng' }, { value: 'soi-dong', label: 'Sôi động' },
  { value: 'thien-nhien', label: 'Thiên nhiên' }, { value: 'chup-anh', label: 'Chụp ảnh' },
]
export const BUDGETS = [
  { value: 'tiet-kiem', label: 'Tiết kiệm' }, { value: 'vua', label: 'Vừa' }, { value: 'cao-cap', label: 'Cao cấp' },
]
export const COMPANIONS = [
  { value: 'mot-minh', label: 'Một mình' }, { value: 'cap-doi', label: 'Cặp đôi' },
  { value: 'gia-dinh', label: 'Gia đình' }, { value: 'nhom-ban', label: 'Nhóm bạn' },
]

// Đếm số nhóm tuỳ chọn đã đổi khỏi mặc định (không tính prompt).
export function countChanged(r) {
  let n = 0
  if (r.area?.trim()) n++
  if (r.budget) n++
  if (r.styles?.length) n++
  if (r.companions) n++
  if (r.days !== 3) n++
  return n
}
