# Календарь звонков

Учебный проект курса Hexlet AI for Developers: упрощённый сервис бронирования временных слотов по мотивам Cal.com.

Проект собран по подходу Design First: сначала контракт в TypeSpec/OpenAPI, затем backend, frontend, e2e, CI, Docker и публичный deploy.

## Демо

- Приложение: [ai-for-developers-project-387-dn6e.onrender.com](https://ai-for-developers-project-387-dn6e.onrender.com)
- Health-check ✚: [ai-for-developers-project-387-dn6e.onrender.com/health](https://ai-for-developers-project-387-dn6e.onrender.com/health)

## Основной сценарий

1. Владелец открывает `/admin` и создаёт тип встречи.
2. Гость открывает `/`, выбирает тип встречи и свободный слот.
3. Гость подтверждает бронирование.
4. Владелец возвращается в `/admin` и видит новую запись в списке предстоящих встреч.

## Что есть в текущей версии

- один заранее заданный владелец календаря;
- публичная страница записи со списком типов встреч;
- выбор свободных слотов на ближайшие 14 дней;
- создание бронирования на свободное время;
- защита от двойного бронирования одного и того же слота;
- owner-панель с созданием event type и просмотром upcoming bookings;
- Playwright e2e, CI, Docker и deploy в Render.

## Стек

- backend: Go, in-memory store;
- frontend: React 19, TypeScript, Vite, React Router;
- контракт: TypeSpec + OpenAPI;
- проверки: Go tests, Playwright e2e, GitHub Actions CI;
- доставка: Docker + Render.

## Локальный запуск

Требования:

- Go `1.26`;
- Node.js и npm;

Установка зависимостей:

```bash
npm install
npm --prefix frontend install
```

Запуск backend:

```bash
cd backend
go run ./cmd/api
```

По умолчанию backend доступен на `http://localhost:8080`.

Запуск frontend:

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

После старта:

- публичный интерфейс: `http://127.0.0.1:5173/`
- owner-панель: `http://127.0.0.1:5173/admin`
- локальный health-check backend: `http://localhost:8080/health`

В dev-режиме frontend ходит в backend через Vite proxy `/api`, поэтому backend должен быть запущен отдельно на `http://localhost:8080`.

## Docker

Проект можно поднять одним контейнером:

```bash
docker build -t calendar-booking .
docker run --rm -e PORT=8080 -p 8080:8080 calendar-booking
```

После старта контейнера:

- приложение: `http://localhost:8080/`
- health-check: `http://localhost:8080/health`
- backend через frontend proxy: `http://localhost:8080/api/health`

## Проверки

Контракт, backend, frontend и e2e проверяются отдельными командами:

```bash
npm run check:contracts
npm run check:backend
npm run check:frontend
npm run test:e2e
```

`npm run test:e2e:setup` нужен только для одноразовой локальной установки Chromium для Playwright.

## Ограничения текущей версии

- нет авторизации и защиты `/admin`;
- нет multi-owner режима;
- нет интеграций с внешними календарями;
- нет редактирования и удаления event type;
- данные хранятся только in-memory и сбрасываются после рестарта;
- окно записи ограничено ближайшими 14 днями;
- все расчёты времени выполняются в `UTC`.

## Структура репозитория

- `backend/` — backend на Go;
- `frontend/` — пользовательский интерфейс на React + TypeScript;
- `contracts/typespec/` — контракт API в TypeSpec;
- `contracts/openapi/` — сгенерированная OpenAPI-спека;
- `docs/` — зафиксированные решения по MVP, домену и этапам проекта.

---

### Hexlet tests and linter status:
[![Actions Status](https://github.com/xhrobj-hex/ai-for-developers-project-387/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/xhrobj-hex/ai-for-developers-project-387/actions)

