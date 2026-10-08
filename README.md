# IconSync

CLI для синхронизации SVG-иконок из Figma с папкой проекта. Исходное ТЗ: [`task1-figma-final (1).docx`](<docs/source/task1-figma-final%20(1).docx>).

## Use cases

В MVP две команды: `fetch` и `sync`. `--dry-run` — режим `sync`, а не третья команда.

| Сценарий                           | Команда                                               | Что происходит                                                                                                    |
| ---------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Проверить, какие иконки найдены    | `iconsync fetch --file-key KEY`                       | Читает Figma, показывает node id, имя, страницу и будущий путь. Файлы не скачивает                                |
| Взять часть файла по ссылке        | `iconsync fetch --url "FIGMA_URL"`                    | Извлекает из ссылки file key и `node-id`, ищет иконки только внутри выбранного узла                               |
| Взять опубликованный library asset | `iconsync fetch --library-key KEY`                    | Определяет component/component set, получает его file key и node id                                               |
| Посмотреть полный diff             | `iconsync sync --file-key KEY --dry-run`              | Экспортирует SVG в память, сравнивает с локальными файлами, показывает add/change/delete/conflict. Диск не меняет |
| Синхронизировать всё               | `iconsync sync --file-key KEY`                        | Выполняет тот же план: записывает новые/изменённые SVG, удаляет устаревшие управляемые файлы, пишет отчёт         |
| Синхронизировать по имени          | `iconsync sync --file-key KEY --filter-name arrow`    | Меняет только иконки, попавшие в фильтр                                                                           |
| Синхронизировать страницу          | `iconsync sync --file-key KEY --filter-page Icons`    | Меняет только выбранную страницу                                                                                  |
| Выбрать папку                      | `iconsync sync --file-key KEY --output-dir src/icons` | Сохраняет результат в указанную папку                                                                             |
| Работать через конфиг              | `iconsync sync --config iconsync.config.json`         | Берёт source, output и правила из файла                                                                           |

Отдельный `validate` можно добавить позже. Для требований ТЗ он не нужен: проверка источника и правил уже покрывается `fetch`.

За один запуск передаётся ровно один источник: `--file-key`, `--url` или `--library-key`. В конфиге используются те же три варианта.

## Стек

- Node.js 24 LTS, TypeScript strict, ESM, npm.
- Commander — CLI, Zod — валидация конфига и ответов Figma.
- Встроенные `fetch`, `fs/promises`, `crypto`.
- Vitest, ESLint, Prettier, GitHub Actions.
- `iconsync.config.json` — настройки; `.env` — секреты.

`.env` **используем** и добавляем в `.gitignore`. В нём лежит `FIGMA_ACCESS_TOKEN`. Отдельный пакет `dotenv` не обязателен: Node 24 умеет загрузить файл сам. Если команде привычнее `dotenv`, его можно добавить без изменения архитектуры.

## Запуск проекта

Локально:

```bash
npm ci
cp .env.example .env
npm run check
npm run iconsync -- --help
```

Через Docker, без локальной установки Node.js:

```bash
cp .env.example .env
npm run docker:build
npm run docker:help
```

Репозиторий примонтирован в `/workspace`, поэтому будущая команда `sync` запишет SVG и manifest на локальный диск разработчика. Если UID/GID пользователя отличаются от `1000`, их нужно изменить в `.env`.

## Где хранится состояние и почему без БД

Это локальный CLI, а не сервер:

```text
Figma                 — источник актуальных иконок
iconsync.config.json  — настройки
.env                   — токен
*.svg                  — результат
.iconsync/manifest.json — список созданных файлов и их hash
```

Manifest нужен, чтобы понимать, какие SVG принадлежат утилите, что изменилось и что можно удалить. БД не даёт пользы, пока нет пользователей, сервера, истории запусков и сложных запросов.

SVG и manifest коммитим в Git. Поэтому Git хранит историю и служит бэкапом, а Figma остаётся исходным источником. Требование «повторный запуск не создаёт Git diff» означает: если в Figma ничего не изменилось, утилита не должна перезаписывать те же файлы.

Варианты:

- **JSON manifest — рекомендую:** просто, читаемо, можно коммитить, достаточно для 500 иконок.
- SQLite: имеет смысл, если нужна история запусков или десятки тысяч записей.
- PostgreSQL: нужен только при появлении общего сервера и нескольких пользователей.

## Примерная архитектура

Это примерная архитектура, которую тимлид хотел бы видеть. Её смысл — разделить слои ответственности между модулями. Конкретные классы, функции и внутренние файлы разработчики определяют при реализации, сохраняя это разделение.

```text
bin/
└── iconsync.js          # исполняемый файл CLI
config/                  # пример пользовательского конфига
docs/                    # backlog, workflow, Spec, ADR и исходное ТЗ
infra/docker/            # Dockerfile и Compose
tooling/                 # TypeScript, ESLint и Prettier
src/
├── cli/                 # команды, аргументы, вывод и exit code
├── application/         # сценарии fetch и sync, orchestration
├── core/                # discovery, naming, фильтры, SyncPlan
├── ports/               # интерфейсы FigmaGateway и Workspace
├── adapters/
│   ├── figma/           # REST API, source resolver, batch, retry
│   ├── workspace/       # SVG, manifest и безопасные операции
│   └── reporting/       # console и JSON-лог
├── config/              # чтение и валидация config/.env
└── composition-root.ts  # сборка зависимостей
test/
├── unit/
├── integration/
└── fixtures/
```

Поток остаётся pipeline, но реализуется в гибридном стиле:

- `application` координирует сценарий и работает через интерфейсы из `ports`;
- `core` содержит чистые правила без HTTP и файловой системы;
- `adapters` подключают Figma, локальные файлы и способы отчётности;
- классы удобны для use cases и adapters, а вычисления в `core` могут оставаться обычными функциями.

Утилита живёт внутри репозитория проекта. Один запуск работает с одним разрешённым Figma-файлом или его поддеревом.

В официальном API нет отдельного `library_key`. Мы трактуем термин из ТЗ как key опубликованного `COMPONENT` или `COMPONENT_SET`:

```text
GET /v1/components/:key       ┐
GET /v1/component_sets/:key   ┴─> file_key + node_id
```

Для component set экспортируются дочерние варианты `COMPONENT`, а не общая рамка набора.

Основной интерфейс `core`:

```text
remote icons + local state + rules -> SyncPlan
```

`SyncPlan` содержит не только записи и удаления, но и список ошибок по конкретным иконкам.

Правило частичного успеха:

- если не загрузилось дерево Figma — ничего не меняем;
- если не экспортировались отдельные иконки — сохраняем остальные;
- старые версии проблемных иконок оставляем;
- удаления в частично успешном запуске не выполняем;
- команда возвращает code `1`, печатает ошибки и пишет JSON-лог в игнорируемую Git папку `.iconsync/logs/`.

## Критерии готовности

- [ ] `fetch`, `sync` и `sync --dry-run` работают из терминала.
- [ ] Источник принимается как file key, Figma URL или key опубликованного library asset.
- [ ] Имена соответствуют утверждённым правилам.
- [ ] `dry-run` не меняет файловую систему.
- [ ] Повторный запуск без изменений не создаёт diff.
- [ ] Удаляются только файлы из `.iconsync/manifest.json`.
- [ ] Коллизии отображаются и ничего не перезаписывают молча.
- [ ] Частичный export сохраняет успешные SVG, но не удаляет файлы и возвращает code `1`.
- [ ] Отчёт содержит new/changed/deleted/conflicts/errors.
- [ ] Консоль выделяет новые, изменённые и удалённые иконки цветом.
- [ ] Фильтры имени и страницы не затрагивают остальное.
- [ ] Токен не попадает в Git и логи.
- [ ] Ошибки возвращают code `1` или `2`.
- [ ] Есть unit-тесты, пример конфига, MIT License, публичный GitHub и демо.

## Документация Figma

[File endpoints](https://developers.figma.com/docs/rest-api/file-endpoints/), [component endpoints](https://developers.figma.com/docs/rest-api/component-endpoints/), [component types](https://developers.figma.com/docs/rest-api/component-types/), [scopes](https://developers.figma.com/docs/rest-api/scopes/), [rate limits](https://developers.figma.com/docs/rest-api/rate-limits/).
