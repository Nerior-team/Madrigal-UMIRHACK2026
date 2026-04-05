# Madrigal — UMIRHACK 2026

Madrigal — Агент внутренней диагностики инфраструктуры/

Агент устанавливается на устройство, подключается к серверу и позволяет отслеживать состояние, выполнять проверки и получать логи через веб-интерфейс.

🌐 Сервер: https://nerior.store

---

## 🚀 Быстрый старт

1. Перейдите на сайт:
   https://nerior.store

2. Зарегистрируйтесь или войдите

3. Установите агент (см. ниже)

---

## 💻 Установка агента

---

### 🪟 Windows

1. Скачайте установщик:
   https://nerior.store/downloads/windows/PredictMVDaemonSetup.exe

2. Запустите 

3. После установки выполните:

```powershell
predict pair --backend-url https://nerior.store
```

4. Подтвердите код на сайте

5. Проверка:

```powershell
predict status
```

---

### 🐧 Linux

#### Установка

```bash
curl -fsSL https://nerior.store/downloads/linux/install.sh -o install.sh
chmod +x install.sh
sudo bash install.sh
```

---

#### Проверка установки и привязка

```bash
predict version
predict pair --backend-url https://nerior.store
```

---

#### Проверка статуса агента

```bash
predict status
```

---

#### Отвязка устройства

```bash
predict unpair
```

---

## 🧠 Как это работает

1. Устанавливается агент
2. Агент регистрируется в системе
3. Сервер отправляет задачи
4. Агент выполняет проверки
5. Результаты отображаются в веб-интерфейсе

---

## 🏗️ Стек

Backend:

* FastAPI
* PostgreSQL
* Redis

Frontend:

* React
* TypeScript
* Vite

Инфраструктура:

* Nginx
* HTTPS (Let's Encrypt)
* Docker (только на сервере)

Агент:

* Desktop daemon
* CLI (`predict`)

Интеграции:

* Telegram бот

---

## ⚠️ Важно

* Пользователю нужен только агент
* Вся инфраструктура уже работает на https://nerior.store

---

## 📁 Основная структура проекта

```
Desktop/
  daemon/
  daemon-cli/
  UI/

server/
  Backend/
  Frontend/
  Tg_bot/
  nginx/
```
