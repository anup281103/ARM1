
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
   * Update an existing Material Request
   * Endpoint: /api/resource/Material Request/:id
   */
  updateMaterialRequest(requestId: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/resource/Material Request/${requestId}`, data, { withCredentials: true });
  }

  /**
   * Fetch Items from ERPNext
   * Endpoint: /api/resource/Item
   * You might want to filter or fetch specific fields
   */
  getItems(): Observable<any> {
    // Fetching Item Code and Item Name with pagination to get all records
    const fields = JSON.stringify(["item_code", "item_name", "stock_uom"]);
    return this.http.get(`${this.baseUrl}/api/resource/Item
?fields=${fields}
&filters=[["disabled","=",0]]
&limit_page_length=500`, { withCredentials: true });
  }

  /**
   * Fetch Warehouses
   */
  getWarehouses(): Observable<any> {
    const fields = JSON.stringify(["warehouse_name", "name"]);
    return this.http.get(`${this.baseUrl}/api/resource/Warehouse?fields=${fields}&limit_page_length=500`, { withCredentials: true });
  }

  /**
   * Fetch Companies from ERPNext
   * Endpoint: /api/resource/Company
   */
  getCompanies(): Observable<any> {
    const fields = JSON.stringify(["name", "company_name", "abbr"]);
    return this.http.get(`${this.baseUrl}/api/resource/Company?fields=${fields}&limit_page_length=500`, { withCredentials: true });
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
    return this.http.get(`${this.baseUrl}/api/resource/District?fields=${fields}&limit_page_length=500`, { withCredentials: true });
  }

  /**
   * Fetch Material Requests for approval
   * Filter by status if needed (e.g., Submitted, Pending)
   */
  getMaterialRequests(filters?: any, limitStart: number = 0, limitPageLength: number = 20, orderBy: string = 'creation desc'): Observable<any> {
    const fields = JSON.stringify([
      "name", 
      "transaction_date", 
      "material_request_type", 
      "schedule_date", 
      "company", 
      "owner", 
      "status",
      "workflow_state",
      "custom_district",
      "items"
    ]);
    
    // Build URL with pagination - use high limit to get all records
    let url = `${this.baseUrl}/api/resource/Material Request?fields=${fields}&limit_start=${limitStart}&limit_page_length=${limitPageLength}&order_by=${encodeURIComponent(orderBy)}`;
    
    if (filters) {
      const filterStr = JSON.stringify(filters);
      url += `&filters=${filterStr}`;
    }
    
    return this.http.get(url, { withCredentials: true });
  }

  /**
   * Get total count of Material Requests matching the filters
   */
  getMaterialRequestsCount(filters?: any): Observable<any> {
    const filtersParam = filters ? JSON.stringify(filters) : '[]';
    return this.http.post(
      `${this.baseUrl}/api/method/frappe.client.get_count`,
      {
        doctype: 'Material Request',
        filters: filters
      },
      { withCredentials: true }
    );
  }
  
  /**
   * Get a single Material Request by ID
   */
  getMaterialRequestById(requestId: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/api/resource/Material Request/${requestId}`,
      { withCredentials: true }
    );
  }
  
  /**
   * Submit a material request (changes docstatus from 0 to 1)
   * This sets the status to "Pending" or "Submitted" depending on ERPNext configuration
   */
  submitMaterialRequest(requestId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/resource/Material Request/${requestId}`,
      { docstatus: 1 },
      { withCredentials: true }
    );
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
  
  /**
   * Apply workflow action to Material Request using ERPNext workflow API
   * @param requestId - Material Request ID
   * @param action - Workflow action name (e.g., "Submit For Approval", "Approve", "Reject")
   */
  applyWorkflow(requestId: string, action: string): Observable<any> {
    // ERPNext requires the doc as a stringified JSON
    const doc = JSON.stringify({
      doctype: 'Material Request',
      name: requestId
    });
    
    return this.http.post(
      `${this.baseUrl}/api/method/frappe.model.workflow.apply_workflow`,
      {
        doc: doc,
        action: action
      },
      { withCredentials: true }
    );
  }

  /**
   * Fetch Suppliers from ERPNext
   * Endpoint: /api/resource/Supplier
   */
  getSuppliers(): Observable<any> {
    const fields = JSON.stringify(["name", "supplier_name"]);
    return this.http.get(`${this.baseUrl}/api/resource/Supplier?fields=${fields}&limit_page_length=500`, { withCredentials: true });
  }
}
