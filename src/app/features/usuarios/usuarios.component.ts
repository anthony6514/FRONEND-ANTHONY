import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService, BackendUser } from '../../core/services/api.service';
import { SoundService } from '../../core/services/sound.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent implements OnInit {
  auth   = inject(AuthService);
  api    = inject(ApiService);
  sound  = inject(SoundService);
  router = inject(Router);

  users   : BackendUser[] = [];
  loading  = signal(true);
  saving   = signal(false);
  showForm = signal(false);
  error    = signal('');
  success  = signal('');

  // Form nueva cuenta
  form = {
    nombre:   '',
    email:    '',
    password: '',
    rol:      'VENDEDOR' as 'ADMIN' | 'VENDEDOR',
  };
  showPass = false;

  ngOnInit() {
    // Bloqueo extra en frontend: si no es admin, fuera
    if (!this.auth.isAdmin()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.api.getUsuarios().subscribe({
      next: (data) => {
        this.users = data;
        this.loading.set(false);
      },
      error: () => {
        // fallback a datos del usuario actual si el backend no responde
        const me = this.auth.currentUser();
        if (me) {
          this.users = [{
            id: me.id, nombre: me.nombre, email: me.email,
            roles: [me.rol], estado: me.estado
          }];
        }
        this.loading.set(false);
      }
    });
  }

  openNew() {
    this.form = { nombre:'', email:'', password:'', rol:'VENDEDOR' };
    this.error.set('');
    this.success.set('');
    this.showForm.set(true);
    this.sound.play('click');
  }

  save() {
    // Validaciones básicas
    if (!this.form.nombre.trim() || !this.form.email.trim() || !this.form.password.trim()) {
      this.error.set('Todos los campos son obligatorios.');
      return;
    }
    if (this.form.password.length < 12) {
      this.error.set('La contraseña debe tener al menos 12 caracteres.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const body = {
      nombre:   this.form.nombre,
      email:    this.form.email,
      password: this.form.password,
      rol:      this.form.rol,   // nuevo contrato: "rol" string, no "roles" array
    };

    this.api.createUsuario(body).subscribe({
      next: (u) => {
        this.users.push(u);
        this.saving.set(false);
        this.showForm.set(false);
        this.success.set(`Cuenta de ${u.nombre} creada correctamente.`);
        this.sound.play('success');
        setTimeout(() => this.success.set(''), 4000);
        this.loadUsers(); // recargar lista real
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Error al crear la cuenta. Verifica que el email no esté en uso.');
        this.saving.set(false);
        this.sound.play('error');
      }
    });
  }

  toggleEstado(u: BackendUser) {
    const nuevo = u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.api.patchUsuarioStatus(u.id, nuevo).subscribe({
      next: () => {
        u.estado = nuevo;
        this.sound.play('click');
      },
      error: () => {}
    });
  }

  deleteUser(u: BackendUser) {
    // Protección: no puede eliminarse a sí mismo
    if (u.id === this.auth.currentUser()?.id) return;

    if (!confirm(`¿Eliminar la cuenta de ${u.nombre}? Esta acción no se puede deshacer.`)) return;

    this.api.deleteUsuario(u.id).subscribe({
      next: () => {
        this.users = this.users.filter(x => x.id !== u.id);
        this.success.set(`Cuenta de ${u.nombre} eliminada.`);
        this.sound.play('success');
        setTimeout(() => this.success.set(''), 4000);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'No se pudo eliminar el usuario.');
        this.sound.play('error');
        setTimeout(() => this.error.set(''), 4000);
      }
    });
  }

  close() { this.showForm.set(false); }

  rolBadge(roles: string[]) {
    if (roles.includes('ADMIN'))      return 'badge--danger';
    if (roles.includes('SUPERVISOR')) return 'badge--warning';
    return 'badge--info';
  }

  rolLabel(roles: string[]) {
    if (roles.includes('ADMIN'))      return 'ADMIN';
    if (roles.includes('SUPERVISOR')) return 'SUPERVISOR';
    return 'VENDEDOR';
  }

  get totalAdmins()     { return this.users.filter(u => u.roles.includes('ADMIN')).length; }
  get totalVendedores() { return this.users.filter(u => u.roles.includes('VENDEDOR')).length; }
  get totalActivos()    { return this.users.filter(u => u.estado === 'ACTIVO').length; }
}
