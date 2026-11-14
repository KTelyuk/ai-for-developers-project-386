# Часовой пояс Алматы в Node.js 24 и @date-fns/tz

Type: research
Status: open

## Question

Какое смещение даёт `Asia/Almaty` в Node.js 24 (встроенные ICU/tzdata) и в `@date-fns/tz` на даты 2026 года — UTC+5, как в README, или старое UTC+6 (Казахстан перешёл на единое время 1 марта 2024)? Совпадает ли поведение в `node:24-alpine` (образ для Docker) и в браузере? Что нужно, чтобы расчёт слотов не зависел от версии tzdata: полагаться на `Asia/Almaty`, взять `Asia/Qyzylorda` или фиксированное смещение `+05:00`?
