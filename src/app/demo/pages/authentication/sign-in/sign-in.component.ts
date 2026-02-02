import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

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
    private router: Router,
    private userService: UserService
  ) {}

  onLogin() {
    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        console.log('Login phase 1 successful, response:', response);
        
        // Fetch both user details and roles in parallel
        forkJoin({
          user: this.authService.getLoggedInUser(),
          roles: this.authService.getUserRoles()
        }).subscribe({
          next: ({ user: userResponse, roles: rolesResponse }) => {
            this.loading = false;
            console.log('User details fetched:', userResponse);
            console.log('User roles fetched:', rolesResponse);
            
            // Frappe usually returns data inside `message`
            const userData = userResponse.message || userResponse;
            const userRoles = rolesResponse.message || [];

            if (userData) {
              // Normalize and store user data
              const normalizedUser = {
                ...userData,
                FullName: userData.full_name || userData.FullName,
              };

              localStorage.setItem('lstUserDetail', JSON.stringify(normalizedUser));
              this.userService.setUser(normalizedUser);
              console.log('Saved user data to localStorage and UserService:', normalizedUser);
            }

            // Store roles in UserService
            if (Array.isArray(userRoles)) {
              this.userService.setRoles(userRoles);
              console.log('Stored user roles:', userRoles);
            }

            // Navigate based on role
            if (this.userService.isCollector()) {
              // Redirect Collector Office users to Material Approval page
              this.router.navigate(['/materialApproval']);
            } else {
              this.router.navigate(['/analytics']);
            }
          },
          error: (err) => {
             console.error('Failed to fetch user details/roles after login', err);
             this.loading = false;
             // Still navigate to analytics as fallback
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
