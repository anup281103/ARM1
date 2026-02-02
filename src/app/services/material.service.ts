
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

  /**
   * Fetch Companies from ERPNext
   * Endpoint: /api/resource/Company
   */
  getCompanies(): Observable<any> {
    const fields = JSON.stringify(["name", "company_name", "abbr"]);
    return this.http.get(`${this.baseUrl}/api/resource/Company?fields=${fields}`, { withCredentials: true });
  }

  /**
   * Fetch Districts from ERPNext
   * Endpoint: /api/resource/District
   */
  /**
   * Fetch Districts from ERPNext
   * Endpoint: /api/resource/District
   */
  getDistricts(): Observable<any> {
    const fields = JSON.stringify(["name", "district_name"]);
    return this.http.get(`${this.baseUrl}/api/resource/District?fields=${fields}`, { withCredentials: true });
  }

  /**
   * Fetch Material Requests for approval
   * Filter by status if needed (e.g., Submitted, Pending)
   */
  getMaterialRequests(filters?: any): Observable<any> {
    const fields = JSON.stringify([
      "name", 
      "transaction_date", 
      "material_request_type", 
      "schedule_date", 
      "company", 
      "owner", 
      "status",
      "custom_district",
      "items"
    ]);
    
    // You can add filters for status, e.g., ?filters=[["status","in",["Submitted","Pending"]]]
    let url = `${this.baseUrl}/api/resource/Material Request?fields=${fields}`;
    
    if (filters) {
      const filterStr = JSON.stringify(filters);
      url += `&filters=${filterStr}`;
    }
    
    return this.http.get(url, { withCredentials: true });
  }

  /**
   * Approve a material request using ERPNext's submit method
   * This changes docstatus from Draft (0) to Submitted (1)
   */
  approveMaterialRequest(requestId: string, data?: any): Observable<any> {
    // Using ERPNext v2 API to submit the document
    return this.http.post(
      `${this.baseUrl}/api/v2/document/Material Request/${requestId}/method/submit`, 
      data || {}, 
      { withCredentials: true }
    );
  }

  /**
   * Reject a material request using ERPNext's cancel method
   * This changes docstatus from Submitted (1) to Cancelled (2)
   */
  rejectMaterialRequest(requestId: string, reason?: string): Observable<any> {
    // Using ERPNext v2 API to cancel the document
    // Note: ERPNext's cancel method doesn't typically accept a reason in the body
    // If you need to store rejection reason, you might need to update the document first
    const payload = reason ? { reason: reason } : {};
    return this.http.post(
      `${this.baseUrl}/api/v2/document/Material Request/${requestId}/method/cancel`, 
      payload, 
      { withCredentials: true }
    );
  }
}
