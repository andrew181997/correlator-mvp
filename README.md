# Correlator MVP

MVP веб-страницы для задачи **5.2.18 Рефакторинг коррелятора сервисов**.

Проект реализует:
- экран коррелятора сервисов;
- создание/редактирование группы корреляции через 3-шаговый мастер;
- удаление группы с подтверждением;
- демонстрационное отображение показателей и индикатора готовности.

## Технологии

- React 19
- TypeScript
- Vite
- React Router

## Быстрый старт

```bash
npm install
npm run dev
```

Приложение по умолчанию запускается через Vite (обычно `http://localhost:5173`).

## Доступные команды

```bash
npm run dev      # локальная разработка
npm run lint     # проверка ESLint
npm run build    # production-сборка
npm run preview  # локальный просмотр production-сборки
```

## Реализованный MVP функционал

### 1) Экран коррелятора

- Кнопка `Создать группу корреляции` в правом верхнем углу.
- Список групп корреляции.
- Для каждой группы доступны действия:
  - `Ред.` (редактирование)
  - `Удал.` (удаление)
- Удаление подтверждается модальным окном с текстом:
  - `Пожалуйста, подтвердите Ваше действие`

### 2) Мастер создания/редактирования группы (3 шага)

#### Шаг 1: Выбор сервисов
- Фильтр по типу сервиса: `Канал`, `Доступность`, `Узел`.
- Текстовый поиск.
- Мастер-чекбокс `Выбрать все в текущем фильтре`.
- Кнопка `Далее` доступна только при выборе минимум одного сервиса.

#### Шаг 2: Выбор показателей
- Показатели строятся на основе выбранных сервисов.
- Показатели уникализируются по названию.
- Доступен мастер-чекбокс `Выбрать все показатели`.

#### Шаг 3: Настройки группы
- Обязательное поле `Название группы корреляции`.
- Чекбокс `Показывать индикатор готовности сервиса` (по умолчанию включен).
- Чекбокс `Открывать группу по умолчанию` (по умолчанию выключен).

### 3) Отображение коррелятора

- Легенда с цветовым различением одинаковых показателей в разрезе сервисов.
- Отображение состояния индикатора готовности по настройке группы.

## Маршруты

- `/` — основной экран коррелятора.
- `/groups/new` — создание группы корреляции.
- `/groups/:groupId/edit` — редактирование существующей группы.

## Структура проекта (текущая)

```text
src/
  App.tsx       # роуты, экран коррелятора, мастер, модалка удаления
  App.css       # стили страниц и компонентов
  main.tsx      # bootstrap + BrowserRouter
  index.css     # глобальные стили
```

## Демонстрационные данные

В проект добавлены тестовые группы, сервисы и показатели, чтобы сразу можно было пройти сценарии:
- создание группы;
- редактирование группы;
- удаление группы;
- переключение активной группы;
- проверка отображения настроек.

## Что планируется после MVP

- Выделить API-слой и подключить backend-контракты.
- Разделить код на feature-модули (`pages/features/shared`).
- Добавить тесты (unit + e2e smoke).
- Расширить фильтры до полного набора из ТЗ.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
