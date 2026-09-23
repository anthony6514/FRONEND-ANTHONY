import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="usuarios animate-fade">
  <div class="page-header">
    <div><h1>Usuarios del sistema</h1><p class="breadcrumb">Inicio / Usuarios</p></div>
    <button class="btn btn--primary" (click)="showNew.set(true)">
      <span class="material-icons-round">person_add</span> Nuevo usuario
    </button>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon stat-icon--orange"><span class="material-icons-round">manage_accounts</span></div>
      <div class="stat-body"><span class="stat-label">Total usuarios</span><span class="stat-value">{{ users.length }}</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon--success"><span class="material-icons-round">admin_panel_settings</span></div>
      <div class="stat-body"><span class="stat-label">Administradores</span><span class="stat-value">{{ admins }}</span></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon stat-icon--info"><span class="material-icons-round">badge</span></div>
      <div class="stat-body"><span class="stat-label">Vendedores</span><span class="stat-value">{{ vendedores }}</span></div>
    </div>
  </div>

  <div class="card">
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          <tr *ngFor="let u of users">
            <td class="mono">#{{ u.id }}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:30px;height:30px;border-radius:50%;background:var(--brand-orange);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.78rem;font-weight:700">{{ u.nombre.charAt(0) }}</div>
                {{ u.nombre }}
              </div>
            </td>
            <td>{{ u.email }}</td>
            <td>
              <span class="badge"
                [ngClass]="u.rol==='ADMIN'?'badge--danger':'badge--info'">
                {{ u.rol }}
              </span>
            </td>
            <td><span class="badge" [ngClass]="u.estado==='ACTIVO'?'badge--success':'badge--neutral'">{{ u.estado }}</span></td>
            <td>
              <div style="display:flex;gap:4px">
                <button class="icon-btn"><span class="material-icons-round" style="font-size:.9rem">edit</span></button>
                <button class="icon-btn"><span class="material-icons-round" style="font-size:.9rem">lock_reset</span></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`,
  styles: [`.usuarios{max-width:900px}.table-wrap{overflow-x:auto}.mono{font-family:monospace;font-size:.82rem}.icon-btn{background:none;border:none;cursor:pointer;padding:4px;border-radius:5px;color:var(--text-secondary);transition:all var(--transition);&:hover{background:var(--brand-orange-soft);color:var(--brand-orange)}}`]
})
export class UsuariosComponent {
  auth     = inject(AuthService);
  showNew  = signal(false);
  users: User[] = [
    { id:1, nombre:'Chris Butrón',  email:'admin@inventio.pe',     rol:'ADMIN',    estado:'ACTIVO' },
    { id:2, nombre:'Vendedor 1',    email:'vendedor1@inventio.pe',  rol:'VENDEDOR', estado:'ACTIVO' },
    { id:3, nombre:'Vendedor 2',    email:'vendedor2@inventio.pe',  rol:'VENDEDOR', estado:'ACTIVO' },
  ];
  get admins()    { return this.users.filter(u => u.rol === 'ADMIN').length; }
  get vendedores(){ return this.users.filter(u => u.rol === 'VENDEDOR').length; }
}
