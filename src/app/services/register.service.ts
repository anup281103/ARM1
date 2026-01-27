import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';

export interface DemoTest {
  id?: number;
  name?: string;
  lastName?: string;
  mobile?: string;
  gender?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  private baseUrl = 'https://localhost:7121/api/ContractualEmpRegistration';

  private http = inject(HttpClient);

  constructor() { } 

  // POST (insert)
  insertDemo(demo: DemoTest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}`, demo);
  }

  // GET (get)
  getAll(): Observable<DemoTest[]> {
    return this.http.get<DemoTest[]>(`${this.baseUrl}`);
  }

  // PUT (update)
  updateDemo(id: number, demo: DemoTest): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/${id}`, demo, { responseType: 'text' });
  }

  // DELETE (delete)
  deleteDemo(id?: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }

  getById(id: number): Observable<DemoTest> {
    return this.http.get<DemoTest>(`${this.baseUrl}/${id}`);
  }
}
