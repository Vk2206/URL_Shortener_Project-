# 🔗 VeloceLink - Premium URL Shortener & Analytics

VeloceLink is a high-performance, real-time URL shortening service featuring a beautiful glassmorphic dark-mode analytics dashboard. It auto-scrapes website titles, generates QR codes, and tracks detailed visitor statistics like operating systems, browsers, referral channels, and locations.

---

## 🚀 Key Features

* *⚡ Instant Redirection*: Fast base-62 generated short URL resolution.
* *🏷️ Custom Aliases*: Set custom names for promotions or campaigns (e.g., /promo-2026).
* *⏳ Expiration Control*: Schedule links to automatically expire after a set time (in minutes).
* *🕷️ Auto Title Scraping*: Scrapes HTML page titles in the background to automatically identify links in your dashboard.
* *📊 Analytics Dashboard*:
  * *📈 Click Timelines*: Live line charts detailing click frequency over time.
  * *🧭 Visitor Insights*: Distributions of browsers, OS platforms, referral sources, and countries.
  * *🔍 Directory Search*: Quickly search and filter through created links.
* *📱 QR Code Generation*: Downloadable QR codes generated live for every shortened link.
* *💅 High-Fidelity UI*: Premium Glassmorphism styling with cosmic glow elements, dark mode, smooth transitions, and responsive grid layouts.

---

## 🛠️ Tech Stack

* *☕ Backend*: Java 25, Spring Boot 3.4.1, Spring Data JPA (Hibernate), RESTful API
* *🗄️ Database*: MySQL 8+ (with automatic database creation support)
* *⚛️ Frontend*: React 19 (Vite), Vanilla CSS (Glassmorphism design system), Recharts, Lucide Icons

---

## 📁 Project Structure

text
URL-Shortener/
├── backend/                  # ☕ Spring Boot Application
│   ├── pom.xml               # Maven configuration
│   └── src/
│       ├── main/
│       │   ├── java/com/urlshortener/  # Services, Controllers, Entities, Repositories
│       │   └── resources/
│       │       └── application.properties # Database & JPA setup
└── frontend/                 # ⚛️ React Application (Vite)
    ├── index.html            # Entry HTML & SEO configurations
    ├── package.json          # Node dependencies (Recharts, Lucide, React-Is)
    └── src/
        ├── App.jsx           # Main React component & State dashboard
        ├── index.css         # Glassmorphism CSS design system
        └── main.jsx          # React renderer root


---

## ⚙️ Quick Start

### 1️⃣ Database Setup
Ensure you have MySQL running on localhost:3306.
* *Database Username*: root
* *Database Password*: Rajashree@123

> 💡 Note: The application will automatically create the database url_shortener and its tables on startup due to the createDatabaseIfNotExist=true parameter in the JDBC string.

### 2️⃣ Running the Backend
Navigate to the backend folder and run the Maven Spring Boot plugin:
bash
cd backend
mvn spring-boot:run

The server will start on port *8080*.

### 3️⃣ Running the Frontend
Navigate to the frontend folder, install any required packages, and start the Vite dev server:
bash
cd frontend
npm install
npm run dev

Open your browser to *http://localhost:5173* to access the dashboard.

---

## 🔬 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | /{shortKey} | Logs visitor analytics and redirects to the target destination URL. |
| POST | /api/urls/shorten | Shortens a URL. Accepts optional custom alias and expiration minutes. |
| GET | /api/urls | Lists all shortened URLs with basic click counts. |
| GET | /api/urls/analytics/{shortKey} | Returns detailed timeline, browser, OS, referrer, and region stats. |
| DELETE | /api/urls/{shortKey} | Deletes a short URL mapping and its analytics history. |

---

## 🔮 Custom Redirection Error Page
If a user attempts to access an expired, invalid, or deleted link, the backend serves a custom glassmorphic HTML 404 page pointing them back to the active client dashboard.
