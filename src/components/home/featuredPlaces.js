// Gợi ý cố định cho mục "Gợi ý cho bạn" ở trang chủ (không gọi AI).
// Shape khớp với destination mà DetailModal / apiItinerary đang dùng.
const mk = (id, name, province, category, whyFit, tags, reasons, alt) => ({
  id, name, province, category, whyFit, tags, reasons, alt,
  wikiTitle: name, imageQuery: `${name} ${province}`, fallbackImage: `/images/${id}.svg`,
})

export const FEATURED_PLACES = {
  dalat: mk('dalat', 'Đà Lạt', 'Lâm Đồng', 'Núi',
    'Se lạnh, sương sớm và cà phê view đồi thông, hợp để đi chậm cùng nhau.',
    ['Cà phê', 'Săn mây', 'Lãng mạn'], ['Khí hậu mát mẻ', 'Cà phê view đồi thông', 'Nhiều góc lãng mạn'],
    'Rừng thông và đồi núi phủ sương lúc bình minh'),
  sapa: mk('sapa', 'Sa Pa', 'Lào Cai', 'Núi',
    'Biển mây trên ruộng bậc thang, dậy sớm một chút là có view đẹp.',
    ['Săn mây', 'Ruộng bậc thang', 'Thiên nhiên'], ['Biển mây buổi sáng', 'Ruộng bậc thang', 'Không khí mát'],
    'Ruộng bậc thang dưới những dãy núi và mây'),
  mocchau: mk('mocchau', 'Mộc Châu', 'Sơn La', 'Thiên nhiên',
    'Đồi chè xanh mướt, cà phê và sữa chua ngồi cả buổi sáng.',
    ['Đồi chè', 'Yên tĩnh', 'Ẩm thực'], ['Đồi chè xanh mướt', 'Sữa chua và cà phê', 'Đi chậm thoải mái'],
    'Những đồi chè xanh dưới bầu trời trong'),
  mangden: mk('mangden', 'Măng Đen', 'Kon Tum', 'Nghỉ dưỡng',
    'Rừng thông, hồ phẳng lặng và ít người, hợp để nghỉ thật chậm.',
    ['Yên tĩnh', 'Rừng thông'], ['Rừng thông và hồ yên', 'Thưa người', 'Hợp nghỉ dưỡng'],
    'Hồ phẳng lặng soi bóng rừng thông'),
  taxua: mk('taxua', 'Tà Xùa', 'Sơn La', 'Săn mây',
    'Đứng trên sống lưng khủng long đón bình minh giữa biển mây.',
    ['Bình minh', 'Trekking nhẹ'], ['Săn mây lúc bình minh', 'Trekking nhẹ', 'Cảnh sống lưng khủng long'],
    'Bình minh trên biển mây và dãy núi'),
  baoloc: mk('baoloc', 'Bảo Lộc', 'Lâm Đồng', 'Thiên nhiên',
    'Đồi chè, thác nước và quán cà phê ven đồi, đi gần mà thưa người.',
    ['Thác nước', 'Đồi chè', 'Cà phê'], ['Thác nước và đồi chè', 'Quán cà phê ven đồi', 'Thưa người'],
    'Thác nước chảy giữa đồi chè'),
}

export const FEATURED_TABS = [
  { key: 'foryou', label: 'Dành cho bạn', meta: 'Chọn lọc từ những chuyến đi được nhiều người yêu thích', ids: ['dalat', 'taxua', 'sapa', 'mangden', 'mocchau'] },
  { key: 'popular', label: 'Phổ biến', meta: 'Những điểm đến quen thuộc, dễ lên kế hoạch', ids: ['dalat', 'sapa', 'mocchau', 'baoloc', 'taxua'] },
  { key: 'season', label: 'Mùa này nên đi', meta: 'Hợp để đi vào lúc này trong năm', ids: ['taxua', 'sapa', 'dalat', 'baoloc', 'mocchau'] },
  { key: 'quiet', label: 'Ít đông đúc', meta: 'Nơi thưa người, hợp đi chậm', ids: ['mangden', 'baoloc', 'taxua', 'mocchau', 'sapa'] },
]
