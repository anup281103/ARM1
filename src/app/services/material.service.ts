
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MaterialService {

  // Base URL from environment configuration
  private baseUrl = environment.apiUrl; 

  constructor(private http: HttpClient) { }

  /**
   * Post a new Material Request to ERPNext
   * Endpoint: /api/resource/Material Request
   */
  createMaterialRequest(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/resource/Material Request`, data, { withCredentials: true });
  }

  /**
   * Fetch Items from ERPNext
   * Endpoint: /api/resource/Item
   * You might want to filter or fetch specific fields
   */
  getItems(): Observable<any> {
    // Example: Fetching Item Code and Item Name. Adjust filters as needed.
    const fields = JSON.stringify(["item_code", "item_name", "stock_uom"]);
    return this.http.get(`${this.baseUrl}/api/resource/Item?fields=${fields}`, { withCredentials: true });
  }

  /**
   * Fetch Warehouses
   */
  getWarehouses(): Observable<any> {
    const fields = JSON.stringify(["warehouse_name", "name"]);
    return this.http.get(`${this.baseUrl}/api/resource/Warehouse?fields=${fields}`, { withCredentials: true });
  }
}
