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
  vista: 'login' | 'forgot' = 'login';

  submit() {
    this.error.set('');
    this.loading.set(true);

    this.auth.loginReal(this.email, this.password).subscribe({
      next: () => {
        this.sound.play('success');
        this.loading.set(false);
      },
      error: (err: any) => {
        const msg = err?.error?.message ?? err?.message ?? '';
        if (err?.status === 401 || msg.toLowerCase().includes('credencial')) {
          this.error.set('Credenciales incorrectas.');
        } else {
          this.error.set('No se pudo conectar al servidor.');
        }
        this.sound.play('error');
        this.loading.set(false);
      }
    });
  }
}
