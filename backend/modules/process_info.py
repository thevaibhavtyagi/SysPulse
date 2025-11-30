import psutil
from typing import List, Dict, Any


def get_process_list() -> List[Dict[str, Any]]:
    processes = []

    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status', 'username']):
        try:
            process_info = proc.info

            processes.append({
                "pid": process_info.get("pid", 0),
                "name": process_info.get("name", "Unknown"),
                "cpu_percent": round(process_info.get("cpu_percent", 0.0) or 0.0, 1),
                "memory_percent": round(process_info.get("memory_percent", 0.0) or 0.0, 1),
                "status": process_info.get("status", "unknown"),
                "username": process_info.get("username", "N/A")
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    processes.sort(key=lambda x: x["cpu_percent"], reverse=True)

    return processes[:100]


def get_process_count() -> int:
    return len(psutil.pids())
