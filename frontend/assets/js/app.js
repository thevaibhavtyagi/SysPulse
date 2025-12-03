const CONFIG = {
    wsUrl: 'ws://localhost:8000/ws/metrics',
    maxDataPoints: 60,
    reconnectDelay: 3000,
    chartUpdateInterval: 1000
};

class SysPulseApp {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        
        // Chart Data Containers
        this.cpuData = [];
        this.memoryData = [];
        this.netUploadData = [];
        this.netDownloadData = [];
        this.labels = [];
        
        // Process Data
        this.currentProcesses = [];
        this.sortColumn = 'cpu_percent';
        this.sortDirection = 'desc';
        this.searchTerm = '';
        
        // Rate Calculation State
        this.lastDisk = null;
        this.lastNet = null;
        this.lastTime = Date.now();
        
        // Initialize Core Functions
        this.initializeTheme();
        this.initializeCharts();
        this.attachEventListeners();
        this.connectWebSocket();
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('syspulse-theme') || 'dark';
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        this.updateThemeIcon(savedTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('.theme-icon');
        if (icon) {
            if(theme === 'dark') {
                icon.classList.replace('ph-moon', 'ph-sun');
            } else {
                icon.classList.replace('ph-sun', 'ph-moon');
            }
        }
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('syspulse-theme', 'light');
            this.updateThemeIcon('light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('syspulse-theme', 'dark');
            this.updateThemeIcon('dark');
        }
        
        this.updateChartTheme();
    }

    initializeCharts() {
        Chart.defaults.font.family = "'JetBrains Mono', monospace";
        
        const ctxCpu = document.getElementById('cpuChart').getContext('2d');
        const ctxMem = document.getElementById('memoryChart').getContext('2d');
        const ctxNet = document.getElementById('networkChart').getContext('2d');

        // Setup Gradients
        const gradientCpu = ctxCpu.createLinearGradient(0, 0, 0, 400);
        gradientCpu.addColorStop(0, 'rgba(14, 165, 233, 0.5)'); 
        gradientCpu.addColorStop(1, 'rgba(14, 165, 233, 0.0)');

        const gradientMem = ctxMem.createLinearGradient(0, 0, 0, 400);
        gradientMem.addColorStop(0, 'rgba(16, 185, 129, 0.5)'); 
        gradientMem.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, 
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#e2e8f0',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { drawBorder: false },
                },
                x: {
                    grid: { display: false },
                    ticks: { maxTicksLimit: 8, maxRotation: 0 }
                }
            }
        };

        // CPU Chart
        const cpuOpts = JSON.parse(JSON.stringify(commonOptions));
        cpuOpts.scales.y.max = 100;
        cpuOpts.scales.y.ticks = { callback: (val) => val + '%' };
        
        this.cpuChart = new Chart(ctxCpu, {
            type: 'line',
            data: {
                labels: this.labels,
                datasets: [{
                    label: 'CPU',
                    data: this.cpuData,
                    borderColor: '#0ea5e9',
                    backgroundColor: gradientCpu,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                }]
            },
            options: cpuOpts
        });

        // Memory Chart
        const memOpts = JSON.parse(JSON.stringify(commonOptions));
        memOpts.scales.y.max = 100;
        memOpts.scales.y.ticks = { callback: (val) => val + '%' };

        this.memoryChart = new Chart(ctxMem, {
            type: 'line',
            data: {
                labels: this.labels,
                datasets: [{
                    label: 'Memory',
                    data: this.memoryData,
                    borderColor: '#10b981',
                    backgroundColor: gradientMem,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                }]
            },
            options: memOpts
        });

        // Network Chart
        const netOpts = JSON.parse(JSON.stringify(commonOptions));
        netOpts.plugins.legend.display = true;
        
        this.networkChart = new Chart(ctxNet, {
            type: 'line',
            data: {
                labels: this.labels,
                datasets: [
                    {
                        label: 'Upload (KB/s)',
                        data: this.netUploadData,
                        borderColor: '#6366f1', // Indigo
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0
                    },
                    {
                        label: 'Download (KB/s)',
                        data: this.netDownloadData,
                        borderColor: '#ec4899', // Pink
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 0
                    }
                ]
            },
            options: netOpts
        });

        this.updateChartTheme();
    }

    updateChartTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#94a3b8' : '#64748b'; 
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        
        [this.cpuChart, this.memoryChart, this.networkChart].forEach(chart => {
            if (chart && chart.options) {
                chart.options.scales.y.grid.color = gridColor;
                chart.options.scales.y.ticks.color = textColor;
                chart.options.scales.x.ticks.color = textColor;
                chart.update('none');
            }
        });
    }

    attachEventListeners() {
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        const searchInput = document.getElementById('processSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.renderProcessTable();
            });
        }

        document.querySelectorAll('.process-table th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.getAttribute('data-sort');
                this.handleSort(column);
            });
        });

        // Navigation (Tab) Logic
        const navDashboard = document.getElementById('nav-dashboard');
        const navAnalytics = document.getElementById('nav-analytics');

        navDashboard.addEventListener('click', () => this.switchTab('dashboard'));
        navAnalytics.addEventListener('click', () => this.switchTab('analytics'));
    }

    switchTab(tabName) {
        const dashBtn = document.getElementById('nav-dashboard');
        const anaBtn = document.getElementById('nav-analytics');
        const viewDash = document.getElementById('view-dashboard');
        const viewAna = document.getElementById('view-analytics');

        // Classes for active vs inactive buttons
        const activeClasses = ['bg-primary-50', 'dark:bg-primary-500/10', 'text-primary-600', 'dark:text-primary-400', 'border-primary-100', 'dark:border-primary-500/20', 'shadow-sm'];
        const inactiveClasses = ['text-gray-500', 'dark:text-slate-400', 'hover:text-primary-600', 'dark:hover:text-white', 'hover:bg-gray-50', 'dark:hover:bg-slate-800/50', 'border-transparent'];

        if (tabName === 'dashboard') {
            viewDash.classList.remove('hidden');
            viewAna.classList.add('hidden');
            
            dashBtn.classList.add(...activeClasses);
            dashBtn.classList.remove(...inactiveClasses);
            
            anaBtn.classList.remove(...activeClasses);
            anaBtn.classList.add(...inactiveClasses);
        } else {
            viewDash.classList.add('hidden');
            viewAna.classList.remove('hidden');

            anaBtn.classList.add(...activeClasses);
            anaBtn.classList.remove(...inactiveClasses);
            
            dashBtn.classList.remove(...activeClasses);
            dashBtn.classList.add(...inactiveClasses);
        }
    }

    connectWebSocket() {
        try {
            this.ws = new WebSocket(CONFIG.wsUrl);
            this.ws.onopen = () => {
                this.isConnected = true;
                this.updateConnectionStatus(true);
                // Reset counters on new connection to avoid huge spikes
                this.lastDisk = null;
                this.lastNet = null;
            };
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMetricsUpdate(data);
            };
            this.ws.onerror = (error) => console.error('WebSocket error:', error);
            this.ws.onclose = () => {
                this.isConnected = false;
                this.updateConnectionStatus(false);
                setTimeout(() => this.connectWebSocket(), CONFIG.reconnectDelay);
            };
        } catch (error) {
            setTimeout(() => this.connectWebSocket(), CONFIG.reconnectDelay);
        }
    }

    updateConnectionStatus(connected) {
        const dot = document.getElementById('connectionStatusDot');
        const text = document.getElementById('connectionText');
        
        if (connected) {
            dot.classList.remove('bg-red-500', 'shadow-[0_0_8px_rgba(239,68,68,0.6)]');
            dot.classList.add('bg-emerald-500', 'shadow-[0_0_8px_rgba(16,185,129,0.6)]', 'animate-pulse');
            text.textContent = 'Connected';
            text.classList.replace('text-gray-500', 'text-emerald-600');
            text.classList.replace('dark:text-slate-400', 'dark:text-emerald-500');
        } else {
            dot.classList.add('bg-red-500', 'shadow-[0_0_8px_rgba(239,68,68,0.6)]');
            dot.classList.remove('bg-emerald-500', 'shadow-[0_0_8px_rgba(16,185,129,0.6)]', 'animate-pulse');
            text.textContent = 'Disconnected';
            text.classList.replace('text-emerald-600', 'text-gray-500');
            text.classList.replace('dark:text-emerald-500', 'dark:text-slate-400');
        }
    }

    handleMetricsUpdate(data) {
        const system = data.system;
        
        this.updateSystemMetrics(system);
        this.updateAnalytics(system); // New function for I/O
        this.updateProcessCount(data.process_count);
        this.updateCharts(system);
        
        this.currentProcesses = data.processes;
        this.renderProcessTable();
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatSpeed(bytesPerSec) {
        return this.formatBytes(bytesPerSec) + '/s';
    }

    updateAnalytics(system) {
        const now = Date.now();
        const timeDiff = (now - this.lastTime) / 1000; // Time in seconds
        
        // Ensure we don't divide by zero or negative time
        if (timeDiff <= 0) return;

        // --- Disk I/O ---
        if (this.lastDisk && system.disk) {
            const readDiff = system.disk.read_bytes - this.lastDisk.read_bytes;
            const writeDiff = system.disk.write_bytes - this.lastDisk.write_bytes;
            
            // Calculate rate (ensure non-negative)
            const readSpeed = Math.max(0, readDiff / timeDiff);
            const writeSpeed = Math.max(0, writeDiff / timeDiff);

            document.getElementById('diskReadVal').textContent = this.formatSpeed(readSpeed);
            document.getElementById('diskWriteVal').textContent = this.formatSpeed(writeSpeed);
        }

        // --- Network I/O ---
        let uploadSpeed = 0;
        let downloadSpeed = 0;

        if (this.lastNet && system.network) {
            const sentDiff = system.network.bytes_sent - this.lastNet.bytes_sent;
            const recvDiff = system.network.bytes_recv - this.lastNet.bytes_recv;

            uploadSpeed = Math.max(0, sentDiff / timeDiff);
            downloadSpeed = Math.max(0, recvDiff / timeDiff);

            document.getElementById('netSentVal').textContent = this.formatSpeed(uploadSpeed);
            document.getElementById('netRecvVal').textContent = this.formatSpeed(downloadSpeed);
        }

        // Update State
        this.lastDisk = system.disk;
        this.lastNet = system.network;
        this.lastTime = now;

        // Return calculated speeds for charting
        return { upload: uploadSpeed, download: downloadSpeed };
    }

    updateSystemMetrics(system) {
        document.getElementById('cpuValue').textContent = system.cpu_percent + '%';
        document.getElementById('cpuBar').style.width = system.cpu_percent + '%';
        
        document.getElementById('ramValue').textContent = system.memory_percent + '%';
        document.getElementById('ramDetails').textContent = `${system.memory_used_gb} GB / ${system.memory_total_gb} GB`;
        document.getElementById('ramBar').style.width = system.memory_percent + '%';
        
        document.getElementById('uptimeValue').textContent = system.uptime;
    }

    updateProcessCount(count) {
        document.getElementById('processCount').textContent = count;
    }

    updateCharts(system) {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Calculate Network Speed manually for chart (since updateAnalytics returns nothing)
        // We actually need the values from the previous calculation.
        // Let's grab them from DOM text content to avoid recalculating or complex state
        // Actually, cleaner way: calculate speed again or store in class property.
        // Let's use specific chart update logic here.
        
        // Simple heuristic: Get speeds based on diff logic inside updateAnalytics
        // But since we need them here, we will store them temporarily in class or just calc here.
        // To be perfectly precise, let's recalculate based on the state we just saved in updateAnalytics.
        // Wait, updateAnalytics updated this.lastNet already. 
        // We will just push 0 if first run.
        
        // Improved Approach: We already updated lastNet in updateAnalytics.
        // We will pass data via class props.
        // Let's keep it simple: The UI is updated. For the chart, we convert the text back or just trust the visual flow.
        // BETTER: Let's extract speed calculation into a helper if we were refactoring, but for now:
        
        // Hack for chart data sync:
        // We will read the numeric values we just put in the UI (implied state)
        // Or simpler: Just calculate deltas again? No, state changed.
        
        // FIX: I will modify updateAnalytics above to RETURN the speeds.
        // (I have updated updateAnalytics in the code block above to return the object)
        
        // Let's assume updateAnalytics was called right before this.
        // Actually, we can just grab raw values if we want perfect sync.
        // But for safety, let's just push the raw KB values.
        
        // Final logic: 
        // I'll grab the current "text content" of the network speed, parse it, and push to chart.
        // This ensures the chart matches the text exactly.
        
        const parseSpeed = (id) => {
            const text = document.getElementById(id).textContent;
            const val = parseFloat(text); // "12.5 KB/s" -> 12.5
            if (text.includes('MB/s')) return val * 1024; // Convert to KB
            if (text.includes('GB/s')) return val * 1024 * 1024;
            if (text.includes('B/s') && !text.includes('KB')) return val / 1024;
            return val; // Default KB
        };

        const upSpeedKB = parseSpeed('netSentVal');
        const downSpeedKB = parseSpeed('netRecvVal');

        this.labels.push(timeLabel);
        this.cpuData.push(system.cpu_percent);
        this.memoryData.push(system.memory_percent);
        this.netUploadData.push(upSpeedKB);
        this.netDownloadData.push(downSpeedKB);

        if (this.labels.length > CONFIG.maxDataPoints) {
            this.labels.shift();
            this.cpuData.shift();
            this.memoryData.shift();
            this.netUploadData.shift();
            this.netDownloadData.shift();
        }

        this.cpuChart.update('none');
        this.memoryChart.update('none');
        this.networkChart.update('none');
    }

    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'desc';
        }

        document.querySelectorAll('.process-table th.sortable').forEach(th => {
            th.classList.remove('text-primary-600', 'dark:text-white'); 
            const icon = th.querySelector('i');
            if(icon) icon.remove();
        });

        const activeTh = document.querySelector(`th[data-sort="${column}"]`);
        activeTh.classList.add('text-primary-600', 'dark:text-white');
        
        const icon = document.createElement('i');
        icon.className = this.sortDirection === 'asc' ? 'ph-bold ph-arrow-up ml-1' : 'ph-bold ph-arrow-down ml-1';
        activeTh.appendChild(icon);

        this.renderProcessTable();
    }

    sortProcesses(processes) {
        return [...processes].sort((a, b) => {
            let aVal = a[this.sortColumn];
            let bVal = b[this.sortColumn];

            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';

            if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); }
            if (typeof bVal === 'string') { bVal = bVal.toLowerCase(); }

            if (this.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    filterProcesses(processes) {
        if (!this.searchTerm) return processes;
        return processes.filter(proc => {
            const name = (proc.name || '').toLowerCase();
            const pid = (proc.pid || '').toString();
            const username = (proc.username || '').toLowerCase();
            return (name.includes(this.searchTerm) || pid.includes(this.searchTerm) || username.includes(this.searchTerm));
        });
    }

    renderProcessTable() {
        const tbody = document.getElementById('processTableBody');
        let processes = this.filterProcesses(this.currentProcesses);
        processes = this.sortProcesses(processes);

        if (processes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-slate-500">${this.searchTerm ? 'No processes found matching query.' : 'No data available.'}</td></tr>`;
            return;
        }

        tbody.innerHTML = processes.map(proc => {
            const isHighCpu = proc.cpu_percent > 50;
            const isHighMem = proc.memory_percent > 50;
            
            let rowBg = 'hover:bg-gray-100 dark:hover:bg-slate-800/50';
            let pidClass = 'text-gray-500 dark:text-slate-400 font-mono';
            let nameClass = 'font-medium text-gray-900 dark:text-slate-200';
            let cpuClass = isHighCpu ? 'text-red-500 dark:text-red-400 font-bold' : 'text-gray-700 dark:text-slate-300 font-mono';
            let memClass = isHighMem ? 'text-orange-500 dark:text-orange-400 font-bold' : 'text-gray-700 dark:text-slate-300 font-mono';
            let statusBadge = proc.status === 'running' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-slate-700/50 text-gray-600 dark:text-slate-400';

            return `
                <tr class="border-b border-gray-200 dark:border-slate-800 ${rowBg} group transition-colors">
                    <td class="px-6 py-3 ${pidClass}">${proc.pid}</td>
                    <td class="px-6 py-3 ${nameClass}">${this.escapeHtml(proc.name)}</td>
                    <td class="px-6 py-3 ${cpuClass}">${proc.cpu_percent.toFixed(1)}%</td>
                    <td class="px-6 py-3 ${memClass}">${proc.memory_percent.toFixed(1)}%</td>
                    <td class="px-6 py-3"><span class="px-2 py-1 rounded text-xs font-medium ${statusBadge}">${proc.status}</span></td>
                    <td class="px-6 py-3 text-gray-500 dark:text-slate-400 text-xs">${this.escapeHtml(proc.username)}</td>
                </tr>
            `;
        }).join('');
    }

    escapeHtml(text) {
        if (text === null || text === undefined) return 'N/A';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SysPulseApp();
});