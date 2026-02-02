import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class UserService {
    private baseUrl = environment.apiUrl; 
  //  baseUrl = `${this.baseUrl}`;

  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  private rolesSubject = new BehaviorSubject<string[]>([]);
  roles$ = this.rolesSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initialize user and roles from localStorage on app start
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    // Load user from localStorage
    const storedUser = localStorage.getItem('lstUserDetail');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.userSubject.next(user);
        console.log('UserService: Loaded user from localStorage:', user);
      } catch (error) {
        console.error('UserService: Failed to parse stored user', error);
      }
    }

    // Load roles from localStorage
    const storedRoles = localStorage.getItem('userRoles');
    if (storedRoles) {
      try {
        const roles = JSON.parse(storedRoles);
        this.rolesSubject.next(roles);
        console.log('UserService: Loaded roles from localStorage:', roles);
      } catch (error) {
        console.error('UserService: Failed to parse stored roles', error);
      }
    }
  }

  setUser(user: any) {
    this.userSubject.next(user);
  }

  getUser(): any {
    return this.userSubject.value;
  }

  clearUser() {
    this.userSubject.next(null);
    this.rolesSubject.next([]);
    localStorage.removeItem('lstUserDetail');
    localStorage.removeItem('userRoles');
  }

  setRoles(roles: string[]) {
    this.rolesSubject.next(roles);
    // Persist roles to localStorage
    localStorage.setItem('userRoles', JSON.stringify(roles));
    console.log('UserService: Saved roles to localStorage:', roles);
  }

  getRoles(): string[] {
    return this.rolesSubject.value;
  }

  hasRole(roleName: string): boolean {
    return this.rolesSubject.value.includes(roleName);
  }

  isDealer(): boolean {
    return this.hasRole('Dealer') || this.hasRole('Purchase User');
  }

  isCollector(): boolean {
    return this.hasRole('Collector Office');
  }

  logout() {
    return this.http.get(`${this.baseUrl}/api/method/logout`, { withCredentials: true });
  }
}
