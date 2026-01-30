import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class UserService {
    private baseUrl = environment.apiUrl; 
  //  baseUrl = `${this.baseUrl}`;

  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  setUser(user: any) {
    this.userSubject.next(user);
  }

  clearUser() {
    this.userSubject.next(null);
  }

  logout() {
    return this.http.get(`${this.baseUrl}/api/method/logout`, { withCredentials: true });
  }
}
