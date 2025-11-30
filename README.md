# SysPulse

**The Real-Time Heartbeat of Your System**

SysPulse is a lightweight real‑time system monitoring dashboard built with a FastAPI backend and a clean HTML/CSS/JS frontend. It streams CPU usage, memory usage, uptime, and process details through WebSockets and updates the UI every second.

---

## Features

* Real‑time CPU, RAM, uptime, and process count
* 60‑second CPU & Memory charts (Chart.js)
* Searchable & sortable process table
* Light/Dark theme toggle
* Responsive interface

---

## Architecture

**Backend**: FastAPI, Psutil, Uvicorn, WebSockets

**Frontend**: HTML, TailwindCSS, Vanilla JS, Chart.js

---

## Project Structure

```
SysPulse/
├── backend/
│   ├── main.py
│   └── modules/
│       ├── system_stats.py
│       └── process_info.py
├── frontend/
│   ├── index.html
│   └── assets/
│       ├── css/styles.css
│       └── js/app.js
├── requirements.txt
└── README.md
```

---

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start Backend

```bash
uvicorn backend.main:app --reload
```

### 3. Open Dashboard

Open `frontend/index.html` in any modern browser.

---

## WebSocket Data Format

```json
{
  "system": {
    "cpu_percent": 45.2,
    "memory_percent": 62.8,
    "uptime": "2d 5h 30m"
  },
  "process_count": 350
}
```

---

## Troubleshooting

* Ensure backend is running on port **8000**
* Check WebSocket URL in `app.js`
* Verify Chart.js CDN loads

---

## Team (K24DM)

* **Vaibhav Tyagi (12400485)**
* **Sujal Kumar (12405329)**
* **Amrutanshu Nayak (12406424)**

---

**SysPulse** - Monitor your system's heartbeat in real-time 💓
