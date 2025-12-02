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
        this.cpuData = [];
        this.memoryData = [];
        this.labels = [];
        this.currentProcesses = [];
        this.sortColumn = 'cpu_percent';
        this.sortDirection = 'desc';
        this.searchTerm = '';
        
        // Initialize Core Functions
        this.initializeTheme();
        this.initializeCharts();
        this.attachEventListeners();
        this.connectWebSocket();
    }

    initializeTheme() {
        // Check local storage or prefer dark mode
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
        
        // Important: Force charts to redraw with new text/grid colors
        this.updateChartTheme();
    }

    initializeCharts() {
        Chart.defaults.font.family = "'JetBrains Mono', monospace";
        
        const ctxCpu = document.getElementById('cpuChart').getContext('2d');
        const ctxMem = document.getElementById('memoryChart').getContext('2d');

        // Setup Gradients
        const gradientCpu = ctxCpu.createLinearGradient(0, 0, 0, 400);
        gradientCpu.addColorStop(0, 'rgba(14, 165, 233, 0.5)'); // Blue/Cyan
        gradientCpu.addColorStop(1, 'rgba(14, 165, 233, 0.0)');

        const gradientMem = ctxMem.createLinearGradient(0, 0, 0, 400);
        gradientMem.addColorStop(0, 'rgba(16, 185, 129, 0.5)'); // Green/Emerald
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
                    displayColors: false,
                    callbacks: {
                        label: (context) => ` ${context.parsed.y}%`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        drawBorder: false,
                    },
                    ticks: { callback: (val) => val + '%' }
                },
                x: {
                    grid: { display: false },
                    ticks: { maxTicksLimit: 8, maxRotation: 0 }
                }
            }
        };

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
                    pointHoverRadius: 6
                }]
            },
            options: JSON.parse(JSON.stringify(commonOptions))
        });

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
                    pointHoverRadius: 6
                }]
            },
            options: JSON.parse(JSON.stringify(commonOptions))
        });

        // Apply initial colors based on current theme
        this.updateChartTheme();
    }

    updateChartTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        
        // Define colors based on mode
        const textColor = isDark ? '#94a3b8' : '#64748b'; // Light text vs Dark text
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        
        [this.cpuChart, this.memoryChart].forEach(chart => {
            if (chart && chart.options) {
                chart.options.scales.y.grid.color = gridColor;
                chart.options.scales.y.ticks.color = textColor;
                chart.options.scales.x.ticks.color = textColor;
                chart.update('none'); // Update without animation for instant feel
            }
        });
    }

    attachEventListeners() {
        // Theme Toggle Listener
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Search Box Listener
        const searchInput = document.getElementById('processSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.renderProcessTable();
            });
        }

        // Sort Header Listeners
        document.querySelectorAll('.process-table th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.getAttribute('data-sort');
                this.handleSort(column);
            });
        });
    }

    connectWebSocket() {
        try {
            this.ws = new WebSocket(CONFIG.wsUrl);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.updateConnectionStatus(true);
                console.log('WebSocket connected');
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMetricsUpdate(data);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.ws.onclose = () => {
                this.isConnected = false;
                this.updateConnectionStatus(false);
                console.log('WebSocket disconnected, reconnecting...');
                setTimeout(() => this.connectWebSocket(), CONFIG.reconnectDelay);
            };
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
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
            text.classList.remove('text-gray-500', 'text-slate-400');
            text.classList.add('text-emerald-600', 'dark:text-emerald-500');
        } else {
            dot.classList.add('bg-red-500', 'shadow-[0_0_8px_rgba(239,68,68,0.6)]');
            dot.classList.remove('bg-emerald-500', 'shadow-[0_0_8px_rgba(16,185,129,0.6)]', 'animate-pulse');
            text.textContent = 'Disconnected';
            text.classList.add('text-gray-500', 'dark:text-slate-400');
            text.classList.remove('text-emerald-600', 'dark:text-emerald-500');
        }
    }

    handleMetricsUpdate(data) {
        this.updateSystemMetrics(data.system);
        this.updateProcessCount(data.process_count);
        this.updateCharts(data.system);
        this.currentProcesses = data.processes;
        this.renderProcessTable();
    }

    updateSystemMetrics(system) {
        // Update DOM elements strictly using original IDs
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

        this.labels.push(timeLabel);
        this.cpuData.push(system.cpu_percent);
        this.memoryData.push(system.memory_percent);

        if (this.labels.length > CONFIG.maxDataPoints) {
            this.labels.shift();
            this.cpuData.shift();
            this.memoryData.shift();
        }

        this.cpuChart.update('none');
        this.memoryChart.update('none');
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

            // Defensive coding: handle null/undefined values safely
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
            }
            if (typeof bVal === 'string') {
                bVal = bVal.toLowerCase();
            }

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
            // Defensive coding: Ensure properties exist before calling methods
            const name = (proc.name || '').toLowerCase();
            const pid = (proc.pid || '').toString();
            const username = (proc.username || '').toLowerCase();

            return (
                name.includes(this.searchTerm) ||
                pid.includes(this.searchTerm) ||
                username.includes(this.searchTerm)
            );
        });
    }

    renderProcessTable() {
        const tbody = document.getElementById('processTableBody');
        let processes = this.filterProcesses(this.currentProcesses);
        processes = this.sortProcesses(processes);

        if (processes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-slate-500">
                        ${this.searchTerm ? 'No processes found matching query.' : 'No data available (Check Connection).'}
                    </td>
                </tr>
            `;
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

            let statusBadge = proc.status === 'running' 
                ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' 
                : 'bg-gray-200 dark:bg-slate-700/50 text-gray-600 dark:text-slate-400';

            return `
                <tr class="border-b border-gray-200 dark:border-slate-800 ${rowBg} group transition-colors">
                    <td class="px-6 py-3 ${pidClass}">${proc.pid}</td>
                    <td class="px-6 py-3 ${nameClass}">${this.escapeHtml(proc.name)}</td>
                    <td class="px-6 py-3 ${cpuClass}">${proc.cpu_percent.toFixed(1)}%</td>
                    <td class="px-6 py-3 ${memClass}">${proc.memory_percent.toFixed(1)}%</td>
                    <td class="px-6 py-3">
                        <span class="px-2 py-1 rounded text-xs font-medium ${statusBadge}">
                            ${proc.status}
                        </span>
                    </td>
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