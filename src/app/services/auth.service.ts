import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Base URL from environment configuration
  private baseUrl = environment.apiUrl;


  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    const body = {
      usr: email,
      pwd: password
    };

    return this.http.post(`${this.baseUrl}/api/method/login`, body, { withCredentials: true });
  }

  logout(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/method/logout`, { withCredentials: true });
  }

  getLoggedInUser(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/method/frappe.auth.get_logged_user`, { withCredentials: true });
  }

  getUserDetails(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/resource/User/${userId}`, { withCredentials: true });
  }
}
