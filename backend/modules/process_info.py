import psutil
from typing import List, Dict, Any

# Cache to persist Process objects for proper CPU delta calculation
_process_cache: Dict[int, psutil.Process] = {}

def get_process_list() -> List[Dict[str, Any]]:
    global _process_cache
    processes = []
    cpu_count = psutil.cpu_count() or 1

    current_pids = set()

    for proc in psutil.process_iter(['pid', 'name', 'username', 'status', 'memory_percent']):
        pid = proc.pid
        current_pids.add(pid)

        try:
            if pid not in _process_cache:
                _process_cache[pid] = proc
                _process_cache[pid].cpu_percent()
                cpu_usage_raw = 0.0
            else:
                cpu_usage_raw = _process_cache[pid].cpu_percent(interval=None)

            normalized_cpu = cpu_usage_raw / cpu_count
            proc_info = proc.info

            processes.append({
                "pid": pid,
                "name": proc_info.get("name") or "Unknown",
                "cpu_percent": round(normalized_cpu, 1),
                "memory_percent": round(proc_info.get("memory_percent", 0.0) or 0.0, 1),
                "status": proc_info.get("status", "unknown"),
                "username": proc_info.get("username", "N/A")
            })

        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            if pid in _process_cache:
                del _process_cache[pid]
            continue

    for pid in list(_process_cache.keys()):
        if pid not in current_pids:
            del _process_cache[pid]

    processes.sort(key=lambda x: x["cpu_percent"], reverse=True)

    return processes[:100]


def get_process_count() -> int:
    return len(psutil.pids())
