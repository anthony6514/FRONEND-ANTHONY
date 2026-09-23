import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { SoundService } from '../../../core/services/sound.service';

@Component({
  selector: 'app-entradas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="entradas animate-fade">
  <div class="page-header">
    <div><h1>Entradas de Inventario</h1><p class="breadcrumb">Inventario / Entradas</p></div>
    <div class="header-actions">
      <a routerLink="/inventario" class="btn btn--outline">
        <span class="material-icons-round">arrow_back</span> Volver al stock
      </a>
      <button class="btn btn--primary">
        <span class="material-icons-round">add</span> Registrar entrada
      </button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon stat-icon--success"><span class="material-icons-round">add_circle</span></div>
      <div class="stat-body"><span class="stat-label">Entradas este mes</span><span class="stat-value">3</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon--info"><span class="material-icons-round">water_drop</span></div>
      <div class="stat-body"><span class="stat-label">Litros ingresados</span><span class="stat-value">10.000 L</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon--orange"><span class="material-icons-round">inventory_2</span></div>
      <div class="stat-body"><span class="stat-label">Productos afectados</span><span class="stat-value">3</span></div>
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
          <tr *ngFor="let m of entradas">
            <td class="mono">#{{ m.id }}</td>
            <td>{{ m.productoNombre }}</td>
            <td><span class="badge badge--success">{{ m.tipoMovimiento }}</span></td>
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
  styles: [`.entradas{max-width:1400px}.header-actions{display:flex;gap:8px}.table-wrap{overflow-x:auto}.fw-600{font-weight:600}.mono{font-family:monospace;font-size:.82rem}`]
})
export class EntradasComponent {
  ds = inject(DataService);
  entradas = this.ds.getMovimientos().filter(m => m.tipoMovimiento === 'ENTRADA');
}
