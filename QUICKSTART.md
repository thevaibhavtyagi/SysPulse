# SysPulse Quick Start Guide

## 🚀 Get Started in 2 Steps

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Start the Server
```bash
python backend/main.py
```

### Step 3: Open the Dashboard
Open `frontend/index.html` in your web browser.

---

## ✅ Verify Installation

When the server starts, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

When you open the dashboard, the connection status in the header should show "Connected" with a green indicator.

## 📊 What You'll See

- **Live CPU Usage**: Real-time percentage with animated bar
- **Live RAM Usage**: Memory consumption with used/total display
- **System Uptime**: How long your system has been running
- **Process Count**: Total number of running processes
- **Interactive Charts**: 60-second rolling history of CPU and memory
- **Process Table**: Searchable, sortable list of all running processes

## 🎨 Features

- **Search**: Type in the search box to filter processes
- **Sort**: Click any column header to sort
- **Theme**: Click the 🌙/☀️ button to toggle dark/light mode
- **Auto-refresh**: Everything updates every second automatically

## 🔧 Troubleshooting

**Connection Issues?**
- Make sure the backend is running on port 8000
- Check that no firewall is blocking the connection

**No Data?**
- Wait a few seconds for the first update
- Check the browser console for errors (F12)

**Performance Issues?**
- The dashboard handles 100 processes by default
- Charts show 60 seconds of history

---

Enjoy monitoring your system with SysPulse! 💓
