import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController, BarElement, ArcElement, DoughnutController, Tooltip, Legend, Filler
} from 'chart.js';

import { DataService } from '../../core/services/data.service';
import { AuthService } from '../../core/services/auth.service';
import { ExportService } from '../../core/services/export.service';
import { DashboardStats, Venta } from '../../core/models';

Chart.register(
  LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController, BarElement, ArcElement, DoughnutController, Tooltip, Legend, Filler
);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  data  = inject(DataService);
  auth  = inject(AuthService);
  exp   = inject(ExportService);

  stats!: DashboardStats;
  recentVentas: Venta[] = [];
  topClientes   = this.data.getTopClientes();
  topProductos  = this.data.getProductosMasVendidos();
  vendedores    = this.data.getVentedores();

  lineData!: ChartData<'line'>;
  lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 11 } } }, tooltip: { enabled: true } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 11 } } },
    },
  };

  doughnutData: ChartData<'doughnut'> = {
    labels: ['PEN – Soles', 'USD – Dólares'],
    datasets: [{ data: [162650, 32480], backgroundColor: ['#FF5A00', '#1F2428'], borderWidth: 0, hoverOffset: 6 }]
  };
  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
  };

  barData!: ChartData<'bar'>;
  barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 11 } } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  ngOnInit() {
    this.stats = this.data.getDashboardStats();
    this.recentVentas = this.data.getVentas().slice(0, 5);

    const chartRaw = this.data.getVentasChart();
    this.lineData = {
      labels: chartRaw.labels,
      datasets: [
        {
          label: 'Litros vendidos',
          data: chartRaw.litros,
          borderColor: '#FF5A00',
          backgroundColor: 'rgba(255,90,0,.08)',
          tension: .4, fill: true, pointRadius: 4,
          pointBackgroundColor: '#FF5A00',
        },
        {
          label: 'Meta REPSOL',
          data: chartRaw.meta,
          borderColor: '#1F2428',
          backgroundColor: 'transparent',
          borderDash: [6, 3], tension: .4, pointRadius: 0,
        },
      ],
    };

    this.barData = {
      labels: this.topProductos.map(p => p.nombre),
      datasets: [{
        data: this.topProductos.map(p => p.litros),
        backgroundColor: '#FF5A00',
        borderRadius: 4,
      }]
    };
  }

  ventaStatusClass(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'warning', PAGADA: 'success', ANULADA: 'danger', PARCIAL: 'info'
    };
    return map[estado] ?? 'neutral';
  }

  formatCurrency(n: number, prefix = 'S/') {
    return `${prefix} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  }

  printDashboard() {
    window.print();
  }

  exportPDF() {
    const cols = ['Indicador', 'Valor'];
    const rows = [
      ['Litros vendidos (mes)', `${this.stats.litrosVendidosMes.toLocaleString()} L`],
      ['Meta REPSOL', `${this.stats.metaRepsol.toLocaleString()} L`],
      ['Cumplimiento meta', `${this.stats.cumplimientoMeta}%`],
      ['Total ventas (mes)', `S/ ${this.stats.totalVentasMes.toLocaleString()}`],
      ['Ventas USD (mes)', `US$ ${this.stats.totalVentasUSD.toLocaleString()}`],
      ['Saldo pendiente total', `S/ ${this.stats.saldoPendienteTotal.toLocaleString()}`],
      ['Productos stock bajo', `${this.stats.productosStockBajo} de ${this.stats.totalProductos}`],
      ['Ventas hoy', `${this.stats.ventasHoy}`],
      ['Recibos hoy', `${this.stats.recibosHoy}`],
    ];
    this.exp.toPDF('Dashboard — KPIs del mes', new Date().toLocaleDateString('es-PE'), cols, rows, 'Dashboard-INVENTIO');
  }
}
