import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(m => m.LoginComponent),
    data: { animation: 'login' },
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    data: { animation: 'dashboard' },
  },

  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/perfil/perfil.component').then(m => m.PerfilComponent),
    data: { animation: 'perfil' },
  },

  {
    path: 'inventario',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/inventario/inventario.component').then(m => m.InventarioComponent),
    data: { animation: 'inventario' },
  },

  {
    path: 'movimientos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/movimientos/movimientos.component').then(m => m.MovimientosComponent),
    data: { animation: 'movimientos' },
  },

  {
    path: 'proformas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/proformas/proformas.component').then(m => m.ProformasComponent),
    data: { animation: 'proformas' },
  },

  {
    path: 'clientes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/clientes/clientes.component').then(m => m.ClientesComponent),
    data: { animation: 'clientes' },
  },

  {
    path: 'recibos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/recibos/recibos.component').then(m => m.RecibosComponent),
    data: { animation: 'recibos' },
  },

  {
    path: 'usuarios',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    data: { animation: 'usuarios' },
  },

  {
    path: 'configuracion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
    data: { animation: 'configuracion' },
  },

  { path: '**', redirectTo: 'dashboard' },
];
