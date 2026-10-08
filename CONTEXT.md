# Project context

IconSync — локальная Node.js CLI-утилита для синхронизации SVG из Figma. Основные требования и архитектура описаны в [README.md](README.md), процесс разработки — в [docs/WORKFLOW.md](docs/WORKFLOW.md), задачи — в [docs/BACKLOG.md](docs/BACKLOG.md).

## Подготовка

```bash
npm ci                       # установить зафиксированные зависимости
cp .env.example .env         # создать локальный env; токен не коммитить
```

## Разработка и запуск

```bash
npm run dev -- --help        # запустить CLI из TypeScript
npm run iconsync -- --help   # основной локальный запуск CLI
npm run build                # собрать JavaScript в dist/
node bin/iconsync.js --help  # запустить собранный CLI
```

## Проверки

```bash
npm run check          # format:check + lint + typecheck + test + build
npm run format         # исправить форматирование
npm run format:check   # только проверить форматирование
npm run lint           # проверить ESLint
npm run lint:fix       # исправить доступные ESLint-ошибки
npm run typecheck      # проверить типы без сборки
npm test               # один запуск тестов
npm run test:watch     # тесты в watch-режиме
```

Перед PR достаточно выполнить `npm run check`.

## Docker

```bash
npm run docker:build   # собрать образ
npm run docker:help    # проверить CLI без локального Node.js
```

Docker-команды требуют локальный `.env`, созданный из `.env.example`. Репозиторий монтируется в `/workspace`, поэтому будущий `sync` запишет результат на локальный диск.

## CI

GitHub Actions выполняет `npm ci` и `npm run check`:

- для каждого pull request;
- для каждого push в `main`.

Docker build в CI пока не запускается. Чтобы запретить merge с упавшей проверкой, job `check` должен быть обязательным в GitHub Ruleset для `main`.
