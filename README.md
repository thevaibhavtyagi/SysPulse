# SysPulse

**The Real-Time Heartbeat of Your System**

SysPulse is a production-ready, real-time system and process monitoring dashboard built with a Python FastAPI backend and a modern vanilla JavaScript frontend. Monitor CPU usage, RAM consumption, system uptime, and detailed process information with smooth, real-time updates via WebSocket streaming.

## Features

- **Real-Time Monitoring**: Live system metrics updated every second via WebSocket
- **System Statistics**: CPU usage, RAM usage, total processes, and system uptime
- **Animated Charts**: Smooth Chart.js visualizations for CPU and memory history
- **Process Management**: Detailed process table with search, sort, and highlighting
- **Dual Theme**: Beautiful light and dark modes with smooth transitions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Production-Ready**: Clean, maintainable, well-commented code

## Architecture

### Backend
- **FastAPI**: Modern Python web framework with WebSocket support
- **psutil**: Cross-platform library for system and process monitoring
- **uvicorn**: ASGI server for production deployment

### Frontend
- **Vanilla JavaScript**: No frameworks, pure web standards
- **Chart.js**: Beautiful, responsive charts
- **CSS Variables**: Dynamic theming system
- **WebSocket API**: Real-time bi-directional communication

## Project Structure

```
SysPulse/
├── backend/
│   ├── main.py                 # FastAPI application and WebSocket endpoint
│   └── modules/
│       ├── system_stats.py     # System metrics collection
│       └── process_info.py     # Process information gathering
├── frontend/
│   ├── index.html             # Main dashboard interface
│   └── assets/
│       ├── css/
│       │   └── styles.css     # Dual-theme styles
│       └── js/
│           └── app.js         # WebSocket client and UI logic
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Setup

1. **Clone or download the project**
   ```bash
   cd SysPulse
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

### Start the Backend Server

```bash
python backend/main.py
```

The server will start on `http://localhost:8000`

You should see output similar to:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Open the Dashboard

Simply open `frontend/index.html` in your web browser:

- **Option 1**: Double-click the file in your file explorer
- **Option 2**: Right-click and select "Open with" → your browser
- **Option 3**: Use a local server (optional):
  ```bash
  cd frontend
  python -m http.server 3000
  ```
  Then visit `http://localhost:3000`

The dashboard will automatically connect to the WebSocket server and start displaying real-time metrics.

## Usage

### Dashboard Features

**Metric Cards**
- Live CPU usage percentage with visual bar
- RAM usage with total/used GB display
- Total running processes count
- System uptime in a readable format

**Charts**
- Real-time CPU usage history (60-second rolling window)
- Real-time memory usage history (60-second rolling window)
- Smooth animations and auto-scaling

**Process Table**
- View all running processes with detailed information
- Search by process name, PID, or username
- Sort by any column (PID, name, CPU %, memory %, status, user)
- Visual highlighting for high CPU (>50%) and memory (>50%) processes
- Auto-updates every second

**Theme Toggle**
- Click the theme button in the header to switch between light and dark modes
- Your preference is saved automatically
- Smooth transitions across all UI elements

### API Endpoints

The backend exposes several endpoints:

- `GET /` - API information
- `GET /api/health` - Health check endpoint
- `WS /ws/metrics` - WebSocket endpoint for real-time metrics

### WebSocket Data Format

The WebSocket sends JSON data every second:

```json
{
  "timestamp": 1234567890.123,
  "system": {
    "cpu_percent": 45.2,
    "memory_percent": 62.8,
    "memory_used_gb": 10.24,
    "memory_total_gb": 16.0,
    "uptime": "2d 5h 30m"
  },
  "process_count": 342,
  "processes": [
    {
      "pid": 1234,
      "name": "python",
      "cpu_percent": 12.5,
      "memory_percent": 3.2,
      "status": "running",
      "username": "user"
    }
  ]
}
```

## Customization

### Adjusting Update Frequency

Edit `backend/main.py` and change the sleep interval:

```python
await asyncio.sleep(1)  # Change to desired seconds
```

### Modifying Chart History Length

Edit `frontend/assets/js/app.js` and update the configuration:

```javascript
const CONFIG = {
    maxDataPoints: 60,  // Change to desired number of data points
    // ...
};
```

### Changing WebSocket URL

If running on a different host/port, update `frontend/assets/js/app.js`:

```javascript
const CONFIG = {
    wsUrl: 'ws://your-host:your-port/ws/metrics',
    // ...
};
```

### Theme Colors

Customize colors by editing CSS variables in `frontend/assets/css/styles.css`:

```css
:root {
    --accent-primary: #3182ce;  /* Your primary color */
    --accent-secondary: #2c5282;  /* Your secondary color */
    /* ... */
}
```

## Browser Compatibility

SysPulse works on all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Performance

- **Lightweight**: Minimal dependencies, efficient code
- **Scalable**: Handles hundreds of processes smoothly
- **Low Resource Usage**: Backend uses minimal CPU and memory
- **Optimized Updates**: Smart rendering prevents unnecessary repaints

## Troubleshooting

**WebSocket won't connect**
- Ensure the backend server is running on `http://localhost:8000`
- Check your firewall settings
- Verify the WebSocket URL in `app.js` matches your server

**No process data showing**
- The backend may not have permission to access process information
- Try running with elevated privileges (not recommended for production)

**Charts not displaying**
- Ensure you have an internet connection (Chart.js is loaded from CDN)
- Check browser console for JavaScript errors

**Theme not persisting**
- Check if your browser allows localStorage
- Ensure cookies/site data are not being cleared on exit

## Development

### Code Structure

**Backend Modules**
- `system_stats.py`: Pure functions for system metric collection
- `process_info.py`: Process enumeration and filtering
- `main.py`: FastAPI app, WebSocket handler, CORS configuration

**Frontend Components**
- `app.js`: Main application class with WebSocket client
- `styles.css`: Complete styling with CSS variables for theming
- `index.html`: Semantic HTML structure

### Extending Functionality

**Adding New Metrics**
1. Add collection function in `backend/modules/system_stats.py`
2. Include in `get_system_metrics()` return value
3. Update frontend to display the new metric

**Adding New Process Columns**
1. Add field to `process_info.py` process iteration
2. Add column to HTML table in `index.html`
3. Update `renderProcessTable()` in `app.js`

## License

This project is provided as-is for educational and production use.

## Contributing

Contributions are welcome! Please ensure:
- Code follows existing style and conventions
- Comments explain complex logic
- Changes are tested across browsers

## Support

For issues, questions, or suggestions, please review the code comments and documentation first.

---

**SysPulse** - Monitor your system's heartbeat in real-time 💓
