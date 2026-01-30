import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, FormsModule],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
    // private userService: UserService // Inject if you want to set state directly without relying solely on localstorage read in next component
  ) {}

  onLogin() {
    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        console.log('Login phase 1 successful, response:', response);
        
        // Login success, now fetch full user details
        this.authService.getLoggedInUser().subscribe({
          next: (userResponse: any) => {
            this.loading = false;
            console.log('User details fetched successfully:', userResponse);
            
            // Frappe usually returns user object inside `message`
            const userData = userResponse.message || userResponse;

            if (userData) {
              // Normalize the data if needed to match your UserModel interface
              // Example: if backend returns 'full_name' but model expects 'FullName'
              const normalizedUser = {
                ...userData,
                FullName: userData.full_name || userData.FullName,
                // Add other mappings as you discover them from the console log
              };

              localStorage.setItem('lstUserDetail', JSON.stringify(normalizedUser));
              console.log('Saved COMPLETE user data to localStorage:', normalizedUser);
            }

            this.router.navigate(['/analytics']);
          },
          error: (userErr) => {
             console.error('Failed to fetch user details after login', userErr);
             this.loading = false;
             // Still navigate, maybe we can survive with partial data or it will fail gracefully
             this.router.navigate(['/analytics']);
          }
        });
      },
      error: (err) => {
        this.loading = false;
        console.error('Login error:', err);
        
        if (err.status === 404) {
             this.error = 'Server Proxy Not Active. PLEASE RESTART "ng serve" in terminal.';
        } else if (err.status === 403 || err.status === 401) {
             this.error = 'Invalid credentials or CORS error.';
        } else {
             this.error = err?.error?.message || 'Login failed';
        }
      }
    });
  }
}
