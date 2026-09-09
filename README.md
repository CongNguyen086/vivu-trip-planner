# Vivu — AI Trip Planner (Phase 1)

Web app demo lên kế hoạch du lịch bằng AI. Mô tả chuyến đi → AI gợi ý địa điểm (ảnh thật
Wikipedia) → xem chi tiết + thời tiết → tạo lịch trình chia Sáng/Trưa/Chiều/Tối.

## Chạy

1. `npm install`
2. Sao chép `.env.example` → `.env`, điền `COACHIO_API_KEY`
3. `npm run dev` → mở http://localhost:5173

## Kiến trúc

- Client: Vite + React 18 (JSX). Design System "Vivu" trong `src/design-system/`.
- Server: Vite plugin middleware (`server/`), mount `/api/*`. Key chỉ ở server.
- AI: Coachio LLM `google/gemini-3.1-flash-lite`. Ảnh: Wikipedia REST. Thời tiết: Open-Meteo.

## Test

`npm run test` (Vitest — các hàm thuần phía server).
