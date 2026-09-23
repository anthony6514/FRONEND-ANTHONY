import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-salidas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="salidas animate-fade">
  <div class="page-header">
    <div><h1>Salidas de Inventario (Kárdex)</h1><p class="breadcrumb">Inventario / Salidas &amp; Kárdex</p></div>
    <div class="header-actions">
      <a routerLink="/inventario" class="btn btn--outline">
        <span class="material-icons-round">arrow_back</span> Volver al stock
      </a>
      <button class="btn btn--primary">
        <span class="material-icons-round">download</span> Exportar kárdex
      </button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon stat-icon--danger"><span class="material-icons-round">remove_circle</span></div>
      <div class="stat-body"><span class="stat-label">Salidas este mes</span><span class="stat-value">3</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon--warning"><span class="material-icons-round">tune</span></div>
      <div class="stat-body"><span class="stat-label">Ajustes realizados</span><span class="stat-value">1</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon--info"><span class="material-icons-round">history</span></div>
      <div class="stat-body"><span class="stat-label">Total movimientos</span><span class="stat-value">{{ movimientos.length }}</span></div>
    </div>
  </div>

  <div class="card table-card">
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th><th>Producto</th><th>Tipo</th><th>Cantidad</th>
            <th>Fecha</th><th>Usuario</th><th>Documento Origen</th>
            <th>Observación</th><th>Stock Resultante</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let m of movimientos">
            <td class="mono">#{{ m.id }}</td>
            <td>{{ m.productoNombre }}</td>
            <td>
              <span class="badge"
                [ngClass]="m.tipoMovimiento==='ENTRADA' ? 'badge--success' : m.tipoMovimiento==='SALIDA' ? 'badge--danger' : 'badge--warning'">
                {{ m.tipoMovimiento }}
              </span>
            </td>
            <td class="fw-600">{{ m.cantidad | number:'1.0-0' }}</td>
            <td>{{ m.fecha }}</td>
            <td>{{ m.usuario }}</td>
            <td class="mono">{{ m.documentoOrigen ?? '—' }}</td>
            <td>{{ m.observacion ?? '—' }}</td>
            <td class="fw-600">{{ m.stockResultante | number:'1.0-0' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`,
  styles: [`.salidas{max-width:1400px}.header-actions{display:flex;gap:8px}.table-wrap{overflow-x:auto}.fw-600{font-weight:600}.mono{font-family:monospace;font-size:.82rem}`]
})
export class SalidasComponent {
  ds = inject(DataService);
  movimientos = this.ds.getMovimientos();
}
