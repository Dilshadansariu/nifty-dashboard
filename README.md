# 📊 Nifty 50 Live Dashboard

A real-time Nifty 50 dashboard built using Next.js that fetches live market data from Yahoo Finance API and displays it in a clean, responsive UI.

---

## 🚀 Features
- 📈 Live Nifty 50 data
- 🔄 Auto refresh every 20 seconds
- 🟢 Market open / closed detection
- 🧠 Cached fallback using last successful real data (no fake data)
- 📱 Fully responsive design
- ⚡ Clean UI with proper data hierarchy

---

## 🛠 Tech Stack
- Next.js
- TypeScript
- Tailwind CSS
- Yahoo Finance API

---

## 🌐 Live Demo
👉 https://nifty-dashboard-self.vercel.app

---

## ⚡ Note
If the API fails, the dashboard shows the last successful real response instead of generating fake data.

---

## 📂 Project Structure
- `/pages` → Frontend pages
- `/pages/api` → API routes (Nifty data fetch)
- `/components` → UI components

---

## 🧠 Key Highlights
- Implemented real-time data fetching with error handling
- Avoided fake/mock data to maintain data authenticity
- Designed UI with focus on readability and user experience
