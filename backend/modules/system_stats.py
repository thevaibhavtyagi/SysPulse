import psutil
import time
from datetime import timedelta
from typing import Dict, Any


def get_cpu_usage() -> float:
    return psutil.cpu_percent(interval=0.1)


def get_memory_info() -> Dict[str, Any]:
    memory = psutil.virtual_memory()
    return {
        "total": memory.total,
        "available": memory.available,
        "used": memory.used,
        "percent": memory.percent
    }


def get_system_uptime() -> str:
    boot_time = psutil.boot_time()
    uptime_seconds = time.time() - boot_time
    uptime_delta = timedelta(seconds=int(uptime_seconds))

    days = uptime_delta.days
    hours, remainder = divmod(uptime_delta.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    if days > 0:
        return f"{days}d {hours}h {minutes}m"
    elif hours > 0:
        return f"{hours}h {minutes}m {seconds}s"
    else:
        return f"{minutes}m {seconds}s"


def get_system_metrics() -> Dict[str, Any]:
    cpu_usage = get_cpu_usage()
    memory_info = get_memory_info()
    uptime = get_system_uptime()

    return {
        "cpu_percent": round(cpu_usage, 1),
        "memory_percent": round(memory_info["percent"], 1),
        "memory_used_gb": round(memory_info["used"] / (1024**3), 2),
        "memory_total_gb": round(memory_info["total"] / (1024**3), 2),
        "uptime": uptime
    }
