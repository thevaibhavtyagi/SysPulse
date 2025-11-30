import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from modules.system_stats import get_system_metrics
from modules.process_info import get_process_list, get_process_count

app = FastAPI(title="SysPulse API", description="Real-Time System Monitoring Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "app": "SysPulse",
        "tagline": "The Real-Time Heartbeat of Your System",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.websocket("/ws/metrics")
async def websocket_metrics(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            system_metrics = get_system_metrics()
            process_count = get_process_count()
            process_list = get_process_list()

            data = {
                "timestamp": asyncio.get_event_loop().time(),
                "system": system_metrics,
                "process_count": process_count,
                "processes": process_list
            }

            await websocket.send_text(json.dumps(data))

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
