# SysPulse

### **The Real-Time Heartbeat of Your System**

SysPulse is a high‑performance, real‑time system monitoring dashboard powered by a FastAPI backend and a modern, responsive frontend. It streams live CPU, memory, uptime, disk I/O, network speeds, and detailed process information through WebSockets — updating the UI every second with smooth charts and animations.

---

## 🚀 Features

### **Real‑Time Monitoring**

* Live CPU & RAM usage (per second)
* System uptime (formatted)
* Active process count
* Disk read/write speeds
* Network upload/download speeds

### **Interactive Dashboard**

* 60‑second CPU, Memory & Network history charts
* Sortable + searchable process table
* High‑CPU & high‑memory process indicators
* Beautiful light/dark theme (saved in localStorage)

### **Modern, Smooth UI**

* TailwindCSS design system
* Glassmorphism panels
* Animated transitions
* Auto WebSocket reconnection
* Fully responsive layout

---

## 🧠 Architecture Overview

### **Backend — FastAPI**

* Real‑time WebSocket at `/ws/metrics`
* CPU, RAM, uptime, disk I/O & network data aggregation
* Process list with CPU delta calculation & caching
* Safe handling of zombie/inaccessible processes

### **Frontend — HTML / CSS / JS**

* Live metric rendering
* Smooth charts (Chart.js)
* Real‑time analytics for I/O rates
* Tabbed navigation (Dashboard / Analytics)
* Theme toggle + persistent state

---

## 📁 Project Structure

```
SysPulse/
├── backend/
│   ├── main.py
│   └── modules/
│       ├── system_stats.py
│       └── process_info.py
│
├── frontend/
│   ├── index.html
│   └── assets/
│       ├── css/styles.css
│       └── js/app.js
│
├── requirements.txt
└── README.md
```

---

## ⚙️ Installation

### **1️⃣ Install Dependencies**

```bash
pip install -r requirements.txt
```

### **2️⃣ Start Backend Server**

```bash
uvicorn backend.main:app --reload
```

Default WebSocket endpoint:

```
ws://localhost:8000/ws/metrics
```

### **3️⃣ Open Dashboard**

Open `frontend/index.html` in your browser.

---

## 🔌 WebSocket Data Format

```json
{
  "timestamp": 1736501233.52,
  "system": {
    "cpu_percent": 35.1,
    "memory_percent": 62.3,
    "memory_used_gb": 7.89,
    "memory_total_gb": 16,
    "uptime": "1d 4h 12m",
    "disk": {
      "read_bytes": 123456789,
      "write_bytes": 987654321
    },
    "network": {
      "bytes_sent": 512340,
      "bytes_recv": 998120
    }
  },
  "process_count": 347,
  "processes": [
    {
      "pid": 1234,
      "name": "python",
      "cpu_percent": 12.5,
      "memory_percent": 1.8,
      "status": "running",
      "username": "user"
    }
  ]
}
```

---

## 🧩 How Metrics Are Calculated

### **CPU Usage**

`psutil.cpu_percent(interval=0.1)`

### **Memory Stats**

Converted into GB + percentage.

### **Uptime**

Formatted as:

```
Xd Yh Zm
```

### **Disk I/O Speeds**

Rate = delta of read/write bytes per second.

### **Network Speeds**

Rate = delta of bytes sent/received per second.

### **Process Monitoring**

* Persistent CPU-delta cache
* Normalized CPU usage per core
* Sorted top processes (up to 100)
* Handles access-denied, zombie & dead processes

---

## 🎨 UI / UX Overview

### **Dashboard**

* CPU card with usage bar
* RAM card with used/total display
* Process count card
* CPU & Memory charts (60‑second history)
* Real‑time searchable process table

### **Analytics View**

* Disk read/write speeds
* Upload/download speeds
* Network traffic history chart

### **Theme System**

* Dark/light mode toggle
* Chart theme auto‑updates
* Stored in localStorage

---

## 🛠 Troubleshooting

| Issue                  | Fix                                           |
| ---------------------- | --------------------------------------------- |
| Dashboard not updating | Ensure FastAPI server is running on port 8000 |
| WebSocket failing      | Check `CONFIG.wsUrl` in `app.js`              |
| High CPU shown as 0%   | Run backend with admin/root privileges        |
| Blank charts           | Check Chart.js CDN availability               |

---

## 👥 Team (K24DM)

* **Vaibhav Tyagi (12400485)**
* **Sujal Kumar (12405329)**
* **Amrutanshu Nayak (12406424)**

---

## ❤️ Final Note

SysPulse blends real‑time systems engineering with clean UI/UX to give you a powerful monitoring dashboard.