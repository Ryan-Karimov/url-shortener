# 🔗 LinkHub — URL Shortener

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-4.x-000000?style=for-the-badge&logo=fastify&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Профессиональный сервис сокращения ссылок с детальной аналитикой**

[Возможности](#-возможности) •
[Быстрый старт](#-быстрый-старт) •
[API](#-api-документация) •
[Технологии](#%EF%B8%8F-технологии)

</div>

---

## ✨ Возможности

- 🔐 **JWT-авторизация** — безопасная регистрация и вход
- 🚀 **Быстрый редирект** — кэширование горячих ссылок в Redis
- 📊 **Детальная аналитика**:
  - Переходы по дням (график)
  - География посетителей (страны)
  - Устройства (desktop/mobile/tablet)
  - Браузеры
- ⏱️ **Срок действия ссылок** — автоматическое истечение
- 🛡️ **Rate Limiting** — защита от спама и DDoS
- 🎨 **Современный UI** — адаптивный интерфейс на русском языке

---

## 🚀 Быстрый старт

### Требования

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker (опционально)

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/your-username/url-shortener.git
cd url-shortener

# Установить зависимости
npm install

# Скопировать конфигурацию
cp .env.example .env
# Отредактировать .env под свои настройки
```

### Настройка окружения

```env
# Server
PORT=3000

# PostgreSQL
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_NAME=url_shortener
DB_PORT=5432

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key
```

### Запуск

**Разработка:**
```bash
npm run migrate  # Создать таблицы в БД
npm run dev      # Запуск с hot-reload
```

**Продакшн:**
```bash
npm start
```

**Docker:**
```bash
docker-compose up -d
```

Приложение будет доступно по адресу: `http://localhost:3000`

---

## 📖 API Документация

### Аутентификация

#### Регистрация
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "123456"
}
```

#### Вход
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "123456"
}
```

**Ответ:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Ссылки

> 🔒 Требуется заголовок: `Authorization: Bearer <token>`

#### Создать короткую ссылку
```http
POST /api/urls
Content-Type: application/json

{
  "originalUrl": "https://example.com/very-long-url",
  "alias": "my-link",        // опционально
  "expiresAt": "2025-12-31"  // опционально
}
```

#### Получить список ссылок
```http
GET /api/urls?page=1&limit=10
```

#### Удалить ссылку
```http
DELETE /api/urls/:shortUrl
```

### Редирект (публичный)

```http
GET /:shortUrl
```
→ Редирект 301 на оригинальный URL

### Аналитика

> 🔒 Требуется авторизация

#### Полная аналитика
```http
GET /api/analytics/:shortUrl
```

**Ответ:**
```json
{
  "shortUrl": "abc123",
  "analytics": {
    "summary": {
      "total_clicks": 150,
      "unique_visitors": 89
    },
    "daily": [
      { "date": "2025-01-25", "clicks": 23 },
      { "date": "2025-01-26", "clicks": 45 }
    ],
    "countries": [
      { "country": "RU", "clicks": 80, "percentage": 53.33 },
      { "country": "US", "clicks": 40, "percentage": 26.67 }
    ],
    "devices": [
      { "device_type": "desktop", "clicks": 90, "percentage": 60 },
      { "device_type": "mobile", "clicks": 60, "percentage": 40 }
    ],
    "browsers": [
      { "browser": "Chrome", "clicks": 100, "percentage": 66.67 }
    ]
  }
}
```

#### Аналитика по дням
```http
GET /api/analytics/:shortUrl/daily?days=30
```

#### Географическая аналитика
```http
GET /api/analytics/:shortUrl/geo
```

#### Аналитика по устройствам
```http
GET /api/analytics/:shortUrl/devices
```

---

## 🏗️ Архитектура

```
url-shortener/
├── src/
│   ├── app.js                 # Точка входа Fastify
│   ├── config/
│   │   ├── db.js              # PostgreSQL подключение
│   │   └── redis.js           # Redis подключение
│   ├── plugins/
│   │   ├── auth.js            # JWT авторизация
│   │   └── rateLimit.js       # Rate limiting
│   ├── routes/
│   │   ├── auth.js            # /auth/*
│   │   ├── urls.js            # /api/urls/*
│   │   ├── analytics.js       # /api/analytics/*
│   │   └── redirect.js        # /:shortUrl
│   ├── services/
│   │   ├── urlService.js      # Бизнес-логика URL
│   │   ├── cacheService.js    # Redis кэширование
│   │   ├── analyticsService.js # Аналитика
│   │   └── geoService.js      # GeoIP
│   ├── models/
│   │   ├── userModel.js       # Пользователи
│   │   └── urlModel.js        # Ссылки
│   └── utils/
│       ├── deviceParser.js    # Парсинг User-Agent
│       └── helpers.js         # Утилиты
├── migrations/
│   └── 001_init.sql           # Схема БД
├── public/
│   └── index.html             # Фронтенд
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 🛠️ Технологии

| Категория | Технология |
|-----------|------------|
| **Runtime** | Node.js 20 |
| **Framework** | Fastify 4 |
| **База данных** | PostgreSQL 15 |
| **Кэш** | Redis 7 |
| **Аутентификация** | JWT (@fastify/jwt) |
| **Rate Limiting** | @fastify/rate-limit |
| **GeoIP** | geoip-lite |
| **User-Agent** | ua-parser-js |
| **Хэширование** | bcrypt |
| **Контейнеризация** | Docker |

---

## 📊 Схема базы данных

```sql
-- Пользователи
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ссылки
CREATE TABLE urls (
  id SERIAL PRIMARY KEY,
  short_url VARCHAR(20) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  alias VARCHAR(20),
  user_id INTEGER REFERENCES users(id),
  expires_at TIMESTAMP,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Клики (аналитика)
CREATE TABLE clicks (
  id SERIAL PRIMARY KEY,
  short_url VARCHAR(20) REFERENCES urls(short_url),
  ip_address VARCHAR(45),
  country VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  referrer TEXT,
  click_time TIMESTAMP DEFAULT NOW()
);
```

---

## 🐳 Docker

```bash
# Запуск всех сервисов
docker-compose up -d

# Логи
docker-compose logs -f app

# Остановка
docker-compose down

# Полная очистка (включая volumes)
docker-compose down -v
```

**Сервисы:**
- `app` — Node.js приложение (порт 3000)
- `db` — PostgreSQL (порт 5432)
- `redis` — Redis (порт 6379)

---

## 📈 Rate Limits

| Endpoint | Лимит | Окно |
|----------|-------|------|
| Редирект | 100 req | 1 мин |
| API | 200 req | 1 мин |
| Создание URL | 20 req | 1 мин |
| Авторизация | 10 req | 1 мин |

---

## 🔧 Скрипты

```bash
npm start      # Запуск продакшн
npm run dev    # Запуск с hot-reload
npm run migrate # Миграции БД
```

---

## 📝 Лицензия

MIT License — свободное использование в личных и коммерческих проектах.

---

<div align="center">

**Сделано с ❤️**

</div>
