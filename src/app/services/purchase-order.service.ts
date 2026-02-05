import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {

  // Base URL from environment configuration
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Fetch Purchase Orders from ERPNext with pagination and sorting
   * @param limitStart - Pagination offset (start index)
   * @param limitPageLength - Number of records per page
   * @param orderBy - Sorting parameter (e.g., "name asc", "transaction_date desc")
   * @returns Observable with purchase order data
   */
  getPurchaseOrders(
    limitStart: number = 0,
    limitPageLength: number = 20,
    orderBy: string = 'name desc'
  ): Observable<any> {
    // Fields to fetch from ERPNext
    const fields = JSON.stringify([
      'name',
      'status',
      'supplier',
      'transaction_date',
      'grand_total',
      'company'
    ]);

    // Build URL with ERPNext pagination and sorting parameters
    const url = `${this.baseUrl}/api/resource/Purchase Order?fields=${fields}&limit_start=${limitStart}&limit_page_length=${limitPageLength}&order_by=${encodeURIComponent(orderBy)}`;

    return this.http.get(url, { withCredentials: true });
  }

  /**
   * Get total count of Purchase Orders matching the filters
   */
  getPurchaseOrdersCount(filters?: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/method/frappe.client.get_count`,
      {
        doctype: 'Purchase Order',
        filters: filters || {}
      },
      { withCredentials: true }
    );
  }

  /**
   * Get a single Purchase Order by ID
   * @param orderId - Purchase Order ID
   */
  getPurchaseOrderById(orderId: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/api/resource/Purchase Order/${orderId}`,
      { withCredentials: true }
    );
  }

  /**
   * Get purchase order statistics
   * This can be used to populate summary cards
   * @param filters - Optional filters for status counts
   */
  getPurchaseOrderStats(filters?: any): Observable<any> {
    let url = `${this.baseUrl}/api/resource/Purchase Order?fields=["name","status"]&limit_page_length=500`;
    
    if (filters) {
      const filterStr = JSON.stringify(filters);
      url += `&filters=${filterStr}`;
    }
    
    return this.http.get(url, { withCredentials: true });
  }

  /**
   * Create a Purchase Order from a Material Request
   * Uses ERPNext's built-in method to convert MR to PO
   * @param materialRequestId - Material Request ID
   * @param supplier - Supplier name
   */
  createPurchaseOrderFromMaterialRequest(materialRequestId: string, supplier: string): Observable<any> {
    const url = `${this.baseUrl}/api/method/erpnext.stock.doctype.material_request.material_request.make_purchase_order`;
    
    return this.http.post(url, {
      source_name: materialRequestId,
      for_supplier: supplier
    }, { withCredentials: true });
  }

  /**
   * Create a Purchase Order via custom API method
   * @param purchaseOrderData - Purchase Order data
   */
  createPurchaseOrder(purchaseOrderData: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/method/create_purchase_order`,
      purchaseOrderData,
      { withCredentials: true }
    );
  }

  /**
   * Submit a Purchase Order (change docstatus to 1)
   * @param orderId - Purchase Order ID
   */
  submitPurchaseOrder(orderId: string): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/api/resource/Purchase Order/${orderId}`,
      { docstatus: 1 },
      { withCredentials: true }
    );
  }

  /**
   * Create Purchase Receipt from Purchase Order
   * @param data - Payload with purchase_order ID and items
   */
  createPurchaseReceipt(data: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/method/create_purchase_receipt`,
      data,
      { withCredentials: true }
    );
  }

  /**
   * Fetch mapped Purchase Invoice data from Purchase Order
   * @param purchaseOrderId 
   */
  getMappedPurchaseInvoice(purchaseOrderId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/method/erpnext.buying.doctype.purchase_order.purchase_order.make_purchase_invoice`,
      { source_name: purchaseOrderId },
      { withCredentials: true }
    );
  }

  /**
   * Create (Save) a Purchase Invoice
   * @param invoiceData - The document object returned by getMappedPurchaseInvoice
   */
  createPurchaseInvoice(invoiceData: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/resource/Purchase Invoice`,
      invoiceData,
      { withCredentials: true }
    );
  }

  /**
   * Submit a Purchase Invoice
   * @param invoiceId 
   */
  submitPurchaseInvoice(invoiceId: string): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/api/resource/Purchase Invoice/${invoiceId}`,
      { docstatus: 1 },
      { withCredentials: true }
    );
  }

  /**
   * Fetch mapped Payment Entry data from Purchase Invoice
   * @param purchaseInvoiceId 
   * @param partyType - Usually 'Supplier'
   * @param party - Supplier Name
   */
  getMappedPaymentEntry(purchaseInvoiceId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/method/erpnext.accounts.doctype.payment_entry.payment_entry.get_payment_entry`,
      { 
        dt: 'Purchase Invoice', 
        dn: purchaseInvoiceId 
      },
      { withCredentials: true }
    );
  }

  /**
   * Create (Save) a Payment Entry
   * @param paymentData 
   */
  createPaymentEntry(paymentData: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/resource/Payment Entry`,
      paymentData,
      { withCredentials: true }
    );
  }

  /**
   * Get Purchase Invoices linked to a PO
   * @param poName 
   */
  getLinkedPurchaseInvoices(poName: string): Observable<any> {
    const filters = JSON.stringify([['purchase_order', '=', poName], ['docstatus', '=', 1]]);
    return this.http.get(
      `${this.baseUrl}/api/resource/Purchase Invoice?filters=${filters}&fields=["name", "grand_total", "outstanding_amount"]`,
      { withCredentials: true }
    );
  }
}
