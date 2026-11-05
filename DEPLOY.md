# 🚀 راهنمای استقرار پروژه روی دامنه دانشگاه (Deployment Guide)

این راهنما مراحل کامل راه‌اندازی و انتشار سامانه رویداد «شب علم» بر روی سرور و اتصال به دامنه دانشگاه نوشیروانی بابل (`*.nit.ac.ir`) را با پشتیبانی از پروتکل امن **HTTPS (TLS/SSL)** و وب‌سرور **Nginx** تشریح می‌کند.

---

## 🏛️ معماری استقرار (Architecture Flow)

در این ساختار، سرویس‌ها به صورت ایزوله و امن در قالب Docker Compose اجرا می‌شوند:

```
[ کاربر / مرورگر اینترنت ]
           │
           │  پورت 80 (HTTP) ──> ریدایرکت خودکار 301 به HTTPS
           │  پورت 443 (HTTPS)
           ▼
┌────────────────────────────────────────────────────────┐
│  کانتینر Nginx (elm-web)                              │
│  - ختم TLS / SSL (Wildcard *.nit.ac.ir)               │
│  - فشرده‌سازی خودکار Gzip (JS, CSS, JSON, SVG)        │
│  - هدرهای امنیتی (HSTS, CSP, X-Frame-Options)         │
│  - محدودکننده نرخ درخواست (Rate Limiting)             │
│  - بارگذاری فایل تا 25 مگابایت (client_max_body_size) │
└───────────────────────┬────────────────────────────────┘
                        │
                        │ پورت داخلی 4567 (شبکه داخلی elm-network)
                        ▼
┌────────────────────────────────────────────────────────┐
│  کانتینر برنامه (NestJS 11 - app)                      │
│  - ارائه فرانت‌اند (HTML/CSS/JS) و پنل مدیریت        │
│  - سرویس مدیا و تصاویر آپلودشده (/assets/)            │
│  - وب‌سرویس‌ها (/auth, /news, /workshop, /export)      │
│  - مستندات سوئیگر (/admin-dash/docs) با Basic Auth     │
└───────────────────────┬────────────────────────────────┘
                        │
                        │ پورت 3306 (elm-network)
                        ▼
┌────────────────────────────────────────────────────────┐
│  کانتینر دیتابیس (MariaDB 11 - elm-db)                 │
│  - پایگاه داده اطلاعات کاربران و رویدادها              │
│  - ذخیره‌سازی داده در Volume مستقل (db_data)          │
└────────────────────────────────────────────────────────┘
```

---

## 🌐 ۱. تنظیمات دامنه و DNS

گواهی SSL ارائه‌شده از نوع **Wildcard** برای دامنه `*.nit.ac.ir` و `nit.ac.ir` (صادر شده توسط مرجع معتبر بین‌المللی Certum و معتبر تا اردیبهشت ۱۴۰۶ / May 2027) است.

### اقدامات مورد نیاز در واحد فناوری اطلاعات (IT) دانشگاه:
1. انتخاب ساب‌دامنه مورد نظر برای رویداد، مانند:
   - `sciencenight.nit.ac.ir`
   - یا `shabeelm.nit.ac.ir`
   - یا `science.nit.ac.ir`
2. ثبت رکورد **DNS A** در سرور DNS دانشگاه:
   ```
   sciencenight.nit.ac.ir.   IN   A   <آدرس_IP_عمومی_سرور>
   ```
> [!NOTE]
> گواهی وایلدکارد یک سطحی (`*.nit.ac.ir`) است، بنابراین نام ساب‌دامنه باید مستقیماً زیرمجموعه `nit.ac.ir` باشد (از ساب‌دامنه‌های چندسطحی مانند `sub.events.nit.ac.ir` استفاده نکنید).

---

## 🔐 ۲. استقرار گواهی‌های SSL

فایل‌های گواهی استخراج شده و دقیقاً در پوشه `certs/` پروژه آماده شده‌اند:
- `certs/fullchain.pem`: زنجیره کامل گواهی (شامل گواهی دامنه + گواهی‌های میانی Intermediate و Root).
- `certs/privkey.pem`: کلید خصوصی RSA.

پوشه `certs/` در فایل `.gitignore` قرار داده شده است تا اطلاعات حساس و کلیدها وارد گیت نشوند.

### تنظیم دسترسی فایل‌ها در لینوکس:
```bash
chmod 700 certs
chmod 600 certs/privkey.pem
chmod 644 certs/fullchain.pem
```

---

## ⚙️ ۳. پیکربندی فایل محیطی (`.env`)

بر روی سرور، فایل `.env` را در کنار `docker-compose.yml` تنظیم کنید:

```env
# ۱. فعال‌سازی حالت HTTPS از طریق Overlay
COMPOSE_FILE=docker-compose.yml:docker-compose.tls.yml

# ۲. اطلاعات اتصال پایگاه داده MariaDB
DB_USER=basebot
DB_PASSWORD=یک_رمز_عبور_قوی_و_مطمئن
DB_NAME=nit_knowledge
DB_PORT=3307

# ۳. پورت برنامه داخلی (پیش‌فرض ۴۵۶۷)
PORT=4567

# ۴. کلید رمزنگاری توکن‌های ورود (JWT)
JWT_SECRET=یک_رشته_تصادفی_بسیار_طولانی_و_پیچیده

# ۵. حساب کاربری ادمین اولیه
ADMIN_USER=admin
ADMIN_PASS=رمز_عبور_حساب_ادمین

# ۶. حساب دسترسی به مستندات Swagger (/admin-dash/docs)
SWAGG_USER=swag
SWAGG_PASS=رمز_عبور_مستندات

# ۷. دامنه‌های مجاز CORS (همراه با https)
CORS_ORIGIN="https://sciencenight.nit.ac.ir,https://nit.ac.ir"
```

---

## 🚢 ۴. اجرای سرویس‌ها با Docker Compose

پس از تنظیم دامنه، گواهی‌ها و فایل `.env`، با دستور زیر سرویس‌ها را اجرا کنید:

```bash
# ساخت ایمیج‌ها و اجرای سرویس‌ها در پس‌زمینه
docker compose up -d --build
```

### بررسی وضعیت سلامت سرویس‌ها:
```bash
# مشاهده وضعیت کانتینرها
docker compose ps

# مشاهده لاگ وب‌سرور Nginx
docker compose logs -f web

# مشاهده لاگ سرویس اصلی برنامه
docker compose logs -f app
```

باید خروجی شبیه به زیر را در وضعیت کانتینرها مشاهده کنید:
```
NAME      IMAGE          COMMAND                  SERVICE   CREATED         STATUS                   PORTS
elm-db    mariadb:11     "docker-entrypoint.s…"   db        1 minute ago    Up 1 minute (healthy)    127.0.0.1:3307->3306/tcp
app       nit-app        "./docker-entrypoint…"   app       1 minute ago    Up 1 minute (healthy)    127.0.0.1:4567->4567/tcp
elm-web   nginx:alpine   "/docker-entrypoint.…"   web       1 minute ago    Up 1 minute              0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

---

## 🧪 ۵. تست و راستی‌آزمایی پس از استقرار

1. **تست ریدایرکت خودکار HTTP به HTTPS**:
   ```bash
   curl -I http://sciencenight.nit.ac.ir
   ```
   *باید کد `HTTP/1.1 301 Moved Permanently` و هدر `Location: https://sciencenight.nit.ac.ir/` را بازگرداند.*

2. **تست صحت گواهی SSL و اتصال امن HTTPS**:
   ```bash
   curl -I https://sciencenight.nit.ac.ir
   ```
   *باید کد `HTTP/2 200` همراه با هدرهای امنیتی (`Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options: DENY`) دریافت شود.*

3. **بررسی در مرورگر**:
   - باز کردن آدرس `https://sciencenight.nit.ac.ir/` (آیکون قفل سبز/امن باید بدون هشدار نمایش داده شود).
   - بررسی آرشیو اخبار در `https://sciencenight.nit.ac.ir/news.html`.
   - ورود به پنل مدیریت از فوتر و آزمایش بارگذاری پوستر کارگاه یا خبر (تا ۲۵ مگابایت).
   - دسترسی به مستندات API سوئیگر در `https://sciencenight.nit.ac.ir/admin-dash/docs`.

---

## 🔄 ۶. به‌روزرسانی‌های آتی و پشتیبان‌گیری

### به‌روزرسانی کد برنامه بر روی سرور:
```bash
git pull
docker compose up -d --build
```

### تهیه نسخه پشتیبان از دیتابیس (Backup):
```bash
docker compose exec db mariadb-dump -u root -p<رمز_دیتابیس> nit_knowledge > backup_$(date +%F).sql
```

### تمدید یا تعویض گواهی SSL در آینده:
در صورت دریافت گواهی جدید، کافیست فایل‌های جدید را جایگزین `certs/fullchain.pem` و `certs/privkey.pem` کرده و وب‌سرور را بدون داون‌تایم ریلود کنید:
```bash
docker compose exec web nginx -s reload
```
