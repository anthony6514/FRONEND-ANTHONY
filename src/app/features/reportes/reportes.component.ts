import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController, BarElement, ArcElement, DoughnutController, Tooltip, Legend, Filler
} from 'chart.js';
import { DataService } from '../../core/services/data.service';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController, BarElement, ArcElement, DoughnutController, Tooltip, Legend, Filler);

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent implements OnInit {
  ds = inject(DataService);
  activeTab = 'resumen';

  lineData!: ChartData<'line'>;
  doughnutData: ChartData<'doughnut'> = {
    labels: ['PEN – Soles','USD – Dólares'],
    datasets: [{ data:[162650,32480], backgroundColor:['#FF5A00','#1F2428'], borderWidth:0, hoverOffset:6 }]
  };
  barVendedoresData!: ChartData<'bar'>;

  lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive:true, maintainAspectRatio:false,
    interaction:{ mode:'index', intersect:false },
    plugins:{ legend:{ display:true, position:'top', labels:{ boxWidth:12, font:{ size:11 } } } },
    scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:'rgba(0,0,0,.05)' } } }
  };
  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive:true, maintainAspectRatio:false, cutout:'68%',
    plugins:{ legend:{ position:'bottom', labels:{ boxWidth:12, font:{ size:11 } } } }
  };
  barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{ display:false } },
    scales:{ x:{ grid:{ display:false } }, y:{ grid:{ color:'rgba(0,0,0,.05)' } } }
  };

  topClientes  = this.ds.getTopClientes();
  topProductos = this.ds.getProductosMasVendidos();

  ngOnInit() {
    const raw = this.ds.getVentasChart();
    this.lineData = {
      labels: raw.labels,
      datasets: [
        { label:'Litros vendidos', data:raw.litros, borderColor:'#FF5A00', backgroundColor:'rgba(255,90,0,.08)', tension:.4, fill:true, pointRadius:4, pointBackgroundColor:'#FF5A00' },
        { label:'Meta REPSOL',    data:raw.meta,   borderColor:'#1F2428', backgroundColor:'transparent', borderDash:[6,3], tension:.4, pointRadius:0 },
      ]
    };
    this.barVendedoresData = {
      labels: ['Barón','Jaime'],
      datasets: [
        { label:'Litros',  data:[28460,20190], backgroundColor:'#FF5A00', borderRadius:4 },
        { label:'Ventas',  data:[28,19],       backgroundColor:'#1F2428', borderRadius:4 },
      ]
    };
  }

  setTab(tab: string) { this.activeTab = tab; }
}
