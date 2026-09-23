import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SoundService } from '../../core/services/sound.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  auth  = inject(AuthService);
  sound = inject(SoundService);

  email    = '';
  password = '';
  error    = signal('');
  loading  = signal(false);
  showPass = false;
  usingBackend = signal(false);

  submit() {
    this.error.set('');
    this.loading.set(true);

    // Intentar con el backend real primero
    this.auth.loginReal(this.email, this.password).subscribe({
      next: (res: any) => {
        if (res === false) {
          // Backend no disponible → fallback a mock
          this.tryMock();
        } else {
          this.usingBackend.set(true);
          this.sound.play('success');
          this.loading.set(false);
        }
      },
      error: (err: any) => {
        if (err?.status === 401 || err?.status === 403) {
          // Credenciales incorrectas en el backend real
          this.error.set(err?.message ?? 'Credenciales incorrectas.');
          this.sound.play('error');
          this.loading.set(false);
        } else {
          // Backend caído → fallback a mock
          this.tryMock();
        }
      }
    });
  }

  private tryMock() {
    setTimeout(() => {
      const ok = this.auth.login(this.email, this.password);
      if (!ok) {
        this.error.set('Credenciales incorrectas. Verifica tu email y contraseña.');
        this.sound.play('error');
      } else {
        this.sound.play('success');
      }
      this.loading.set(false);
    }, 400);
  }
}
