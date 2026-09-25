import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { SoundService } from '../../core/services/sound.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent {
  auth  = inject(AuthService);
  api   = inject(ApiService);
  sound = inject(SoundService);

  // Cambiar contraseña
  showPassForm  = signal(false);
  savingPass    = signal(false);
  passError     = signal('');
  passSuccess   = signal('');
  showOldPass   = false;
  showNewPass   = false;
  showConfirm   = false;

  passForm = { actual: '', nueva: '', confirmar: '' };

  get user() { return this.auth.currentUser(); }

  get rolLabel() {
    const rol = this.user?.rol;
    if (rol === 'ADMIN')      return 'Administrador';
    if (rol === 'SUPERVISOR') return 'Supervisor';
    return 'Vendedor';
  }

  get rolIcon() {
    const rol = this.user?.rol;
    if (rol === 'ADMIN')      return 'admin_panel_settings';
    if (rol === 'SUPERVISOR') return 'supervisor_account';
    return 'badge';
  }

  get rolClass() {
    const rol = this.user?.rol;
    if (rol === 'ADMIN')      return 'badge--danger';
    if (rol === 'SUPERVISOR') return 'badge--warning';
    return 'badge--info';
  }

  cambiarPassword() {
    this.passError.set('');

    if (!this.passForm.actual || !this.passForm.nueva || !this.passForm.confirmar) {
      this.passError.set('Todos los campos son obligatorios.');
      return;
    }
    if (this.passForm.nueva.length < 12) {
      this.passError.set('La nueva contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (this.passForm.nueva !== this.passForm.confirmar) {
      this.passError.set('Las contraseñas no coinciden.');
      return;
    }

    this.savingPass.set(true);
    const userId = this.user?.id;
    if (!userId) return;

    // Enviamos solo la nueva contraseña al backend (PUT /users/:id)
    this.api.updateUsuario(userId, { password: this.passForm.nueva }).subscribe({
      next: () => {
        this.savingPass.set(false);
        this.passSuccess.set('Contraseña actualizada correctamente.');
        this.passForm = { actual: '', nueva: '', confirmar: '' };
        this.showPassForm.set(false);
        this.sound.play('success');
        setTimeout(() => this.passSuccess.set(''), 4000);
      },
      error: (err) => {
        this.passError.set(err?.message ?? 'Error al actualizar la contraseña.');
        this.savingPass.set(false);
        this.sound.play('error');
      }
    });
  }

  logout() {
    this.sound.play('click');
    this.auth.logout();
  }
}
