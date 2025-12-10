import psutil
import time
from datetime import timedelta
from typing import Dict, Any

# Constant for unit conversion
BYTES_TO_GB = 1024 ** 3


def get_cpu_usage() -> float:
    """Returns the current system-wide CPU utilization as a percentage."""
    return psutil.cpu_percent(interval=0.1)


def get_memory_info() -> Dict[str, Any]:
    """Retrieves statistics about system memory usage."""
    memory = psutil.virtual_memory()
    return {
        "total": memory.total,
        "available": memory.available,
        "used": memory.used,
        "percent": memory.percent
    }


def get_disk_io() -> Dict[str, int]:
    """Fetches total disk I/O statistics across all disks."""
    try:
        # perdisk=False returns total IO across all disks
        disk = psutil.disk_io_counters(perdisk=False)
        return {
            "read_bytes": disk.read_bytes,
            "write_bytes": disk.write_bytes
        }
    except Exception:
        return {"read_bytes": 0, "write_bytes": 0}


def get_network_io() -> Dict[str, int]:
    """Fetches total network I/O statistics across all interfaces."""
    try:
        # pernic=False returns total IO across all interfaces
        net = psutil.net_io_counters(pernic=False)
        return {
            "bytes_sent": net.bytes_sent,
            "bytes_recv": net.bytes_recv
        }
    except Exception:
        return {"bytes_sent": 0, "bytes_recv": 0}


def get_system_uptime() -> str:
    """Calculates the system uptime and formats it as a readable string."""
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
    """Aggregates all system metrics into a single dictionary."""
    cpu_usage = get_cpu_usage()
    memory_info = get_memory_info()
    uptime = get_system_uptime()
    
    # I/O Metrics
    disk_io = get_disk_io()
    net_io = get_network_io()

    return {
        "cpu_percent": round(cpu_usage, 1),
        "memory_percent": round(memory_info["percent"], 1),
        "memory_used_gb": round(memory_info["used"] / BYTES_TO_GB, 2),
        "memory_total_gb": round(memory_info["total"] / BYTES_TO_GB, 2),
        "uptime": uptime,
        "disk": disk_io,
        "network": net_io
    }