# FOUNDATION-01: каркас проекта

## Задача

Подготовить единое Node.js/TypeScript-окружение, чтобы разработчики начинали продуктовые задачи без самостоятельной настройки инструментов и структуры.

## Решение

Создать npm CLI-пакет, гибридную структуру `application/core/ports/adapters`, общие проверки ESLint/Prettier/TypeScript/Vitest, GitHub Actions и контейнерный запуск с примонтированным workspace.

## Приёмка

- `npm ci` устанавливает фиксированные зависимости;
- `npm run check` запускает все проверки;
- `npm run iconsync -- --help` показывает CLI help;
- `npm run docker:help` работает без локального Node.js;
- в репозитории есть только безопасный `.env.example`.
