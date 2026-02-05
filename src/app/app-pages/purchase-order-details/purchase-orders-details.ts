import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-purchase-orders-details',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './purchase-orders-details.html',
  styleUrl: './purchase-orders-details.scss'
})
export class PurchaseOrdersDetails implements OnInit {
  
  purchaseOrderId: string = '';
  purchaseOrder: any = null;
  invoices: any[] = []; // Store linked invoices
  loading: boolean = false;
  error: string | null = null;
  
  // Stats for progress
  paymentStatus: string = 'Pending';

  constructor(
    private route: ActivatedRoute,
    private purchaseOrderService: PurchaseOrderService
  ) {}

  ngOnInit(): void {
    // Get the ID from route parameter
    this.purchaseOrderId = this.route.snapshot.paramMap.get('id') || '';
    
    if (this.purchaseOrderId) {
      this.loadPurchaseOrderDetails();
    } else {
      this.error = 'No purchase order ID provided';
    }
  }

  /**
   * Load purchase order details from ERPNext API
   */
  loadPurchaseOrderDetails(): void {
    this.loading = true;
    this.error = null;

    this.purchaseOrderService.getPurchaseOrderById(this.purchaseOrderId).subscribe({
      next: (response) => {
        this.purchaseOrder = response.data;
        
        // After loading PO, load linked invoices for Payment Status
        this.loadLinkedInvoices();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load purchase order details';
        console.error(err);
      }
    });
  }

  loadLinkedInvoices(): void {
    this.purchaseOrderService.getLinkedPurchaseInvoices(this.purchaseOrderId).subscribe({
        next: (res) => {
            this.invoices = res.data || [];
            this.calculatePaymentStatus();
            this.loading = false;
        },
        error: (err) => {
            console.error('Error loading invoices', err);
            // Non-blocking error
            this.loading = false;
        }
    });
  }

  calculatePaymentStatus() {
      if (!this.invoices || this.invoices.length === 0) {
          this.paymentStatus = 'Pending';
          return;
      }
      
      const totalGrand = this.invoices.reduce((sum, inv) => sum + inv.grand_total, 0);
      const totalOutstanding = this.invoices.reduce((sum, inv) => sum + inv.outstanding_amount, 0);

      if (totalGrand > 0 && totalOutstanding === 0) {
          this.paymentStatus = 'Completed';
      } else if (totalOutstanding < totalGrand) {
          this.paymentStatus = 'Partial';
      } else {
          this.paymentStatus = 'Pending';
      }
  }

  /**
   * Get material request status
   * Assumes material request was approved if PO exists
   */
  getMaterialRequestStatus(): { cssClass: string; status: string } {
    if (this.purchaseOrder) {
      return { cssClass: 'completed', status: 'Approved' };
    }
    return { cssClass: 'pending', status: 'Pending' };
  }

  /**
   * Get purchase order status
   */
  getPurchaseOrderStatus(): { cssClass: string; status: string } {
    if (!this.purchaseOrder) {
      return { cssClass: 'pending', status: 'Draft' };
    }

    const status = this.purchaseOrder.status;
    
    // If it's submitted (docstatus=1) and not cancelled/closed, it's at least Active/Done
    // For PO step, if it's not Draft, it's done.
    if (status !== 'Draft' && status !== 'Cancelled') {
         return { cssClass: 'completed', status: status };
    }
    
    return { cssClass: 'active', status: status };
  }

  /**
   * Get purchase receipt status
   */
  getPurchaseReceiptStatus(): { cssClass: string; status: string } {
    if (!this.purchaseOrder) {
      return { cssClass: 'pending', status: 'Pending' };
    }

    const perReceived = this.purchaseOrder.per_received || 0;
    
    if (perReceived >= 100) {
      return { cssClass: 'completed', status: 'Received' };
    } else if (perReceived > 0) {
      return { cssClass: 'active', status: `${perReceived.toFixed(0)}% Received` };
    } else if (this.purchaseOrder.status !== 'Draft') {
        // If PO is approved, Receipt is next
        return { cssClass: 'active', status: 'Pending Receipt' }; // Active indicates "Current Step"
    }
    
    return { cssClass: 'pending', status: 'Pending' };
  }

  /**
   * Get purchase invoice status
   */
  getPurchaseInvoiceStatus(): { cssClass: string; status: string } {
    if (!this.purchaseOrder) {
      return { cssClass: 'pending', status: 'Pending' };
    }

    const perBilled = this.purchaseOrder.per_billed || 0;
    const perReceived = this.purchaseOrder.per_received || 0;
    
    if (perBilled >= 100) {
      return { cssClass: 'completed', status: 'Invoiced' };
    } else if (perBilled > 0) {
      return { cssClass: 'active', status: `${perBilled.toFixed(0)}% Billed` };
    } else if (perReceived >= 100) {
        // If received fully, Invoice is next/active
        return { cssClass: 'active', status: 'Pending Invoice' };
    }
    
    return { cssClass: 'pending', status: 'Pending' };
  }

  /**
   * Get payment status
   * Based on billing and receipt status
   */
  getPaymentStatus(): { cssClass: string; status: string } {
    if (!this.purchaseOrder) {
      return { cssClass: 'pending', status: 'Pending' };
    }
    
    if (this.paymentStatus === 'Completed') {
        return { cssClass: 'completed', status: 'Paid' };
    } else if (this.paymentStatus === 'Partial') {
        return { cssClass: 'active', status: 'Partially Paid' };
    }
    
    const perBilled = this.purchaseOrder.per_billed || 0;
    if (perBilled >= 100) {
         // Fully billed, ready for payment
         return { cssClass: 'active', status: 'To Pay' };
    }

    return { cssClass: 'pending', status: 'Pending' };
  }

  /**
   * Calculate progress percentage for the journey
   */
  getJourneyProgress(): number {
    if (!this.purchaseOrder) return 0;

    let progress = 0;
    const perReceived = this.purchaseOrder.per_received || 0;
    const perBilled = this.purchaseOrder.per_billed || 0;
    const status = this.purchaseOrder.status;

    // Material Request (20%) - Always done if we are here
    progress += 20;

    // Purchase Order (20%)
    if (status !== 'Draft') {
      progress += 20;
    }

    // Purchase Receipt (20%)
    progress += (perReceived / 100) * 20;

    // Purchase Invoice (20%)
    progress += (perBilled / 100) * 20;

    // Payment (20%)
    if (this.paymentStatus === 'Completed') {
      progress += 20;
    } else if (this.paymentStatus === 'Partial') {
        progress += 10;
    }

    return Math.min(progress, 100);
  }

  /**
   * Get dynamic header status
   */
  getHeaderStatus(): { label: string; cssClass: string; icon: string } {
    if (!this.purchaseOrder) return { label: 'Loading...', cssClass: 'badge bg-light text-dark', icon: 'icon-loader' };

    const status = this.purchaseOrder.status;

    // 1. Payment Complete always wins
    if (this.paymentStatus === 'Completed') {
        return { label: 'Paid', cssClass: 'badge bg-success text-white', icon: 'icon-check-circle' };
    }

    // 2. Partial Payment
    if (this.paymentStatus === 'Partial') {
        return { label: 'Partially Paid', cssClass: 'badge bg-info text-white', icon: 'icon-pie-chart' };
    }

    // 3. Status mappings
    if (status === 'Completed' || status === 'Closed') {
         return { label: status, cssClass: 'badge bg-success text-white', icon: 'icon-check-square' };
    } 
    
    if (status === 'To Bill') {
        return { label: 'To Bill', cssClass: 'badge bg-warning text-dark', icon: 'icon-file-text' };
    }
    
    if (status === 'To Receive and Bill') {
        return { label: 'To Receive & Bill', cssClass: 'badge bg-warning text-dark', icon: 'icon-package' };
    }

    if (status === 'To Receive') {
        return { label: 'To Receive', cssClass: 'badge bg-info text-white', icon: 'icon-truck' };
    }

    if (status === 'Draft') {
        return { label: 'Draft', cssClass: 'badge bg-secondary text-white', icon: 'icon-edit' };
    }
    
    if (status === 'Cancelled') {
        return { label: 'Cancelled', cssClass: 'badge bg-danger text-white', icon: 'icon-x-circle' };
    }

    // Default
    return { label: status, cssClass: 'badge bg-light text-primary', icon: 'icon-info' };
  }

  creatingReceipt: boolean = false;
  creatingInvoice: boolean = false;
  creatingPayment: boolean = false;

  /**
   * Create Purchase Receipt API Call
   */
  createPurchaseReceipt(): void {
    if (!this.purchaseOrder) return;

    if (!confirm('Are you sure you want to create a Purchase Receipt for these items?')) {
      return;
    }

    this.creatingReceipt = true;

    // Map all items to the payload. 
    // Assuming we want to receive the full remaining quantity.
    const items = this.purchaseOrder.items.map((item: any) => ({
      item_code: item.item_code,
      accepted_qty: item.qty - (item.received_qty || 0), // Pending Qty
      rejected_qty: 0,
      rejected_warehouse: ''
    }));

    const payload = {
      purchase_order: this.purchaseOrderId,
      items: items
    };

    this.purchaseOrderService.createPurchaseReceipt(payload).subscribe({
      next: (res) => {
        this.creatingReceipt = false;
         // Refresh to checking status
        alert('Purchase Receipt created successfully!');
        this.loadPurchaseOrderDetails();
      },
      error: (err) => {
        this.creatingReceipt = false;
        console.error('Error creating purchase receipt:', err);
        alert('Failed to create purchase receipt. Check console for details.');
      }
    });
  }

  /**
   * Create Purchase Invoice API Call
   * Flow: Get mapped invoice -> Save it -> Submit it (optional, but standard flow usually stops at Draft or Submits)
   * The user said "generate it", usually means create. Submitting might be a separate step or implied.
   * We will create it in Draft state initially.
   */
  createPurchaseInvoice(): void {
    if (!this.purchaseOrder) return;

    if (!confirm('Are you sure you want to create a Purchase Invoice?')) {
      return;
    }

    this.creatingInvoice = true;

    // Step 1: Get mapped Purchase Invoice
    this.purchaseOrderService.getMappedPurchaseInvoice(this.purchaseOrderId).subscribe({
      next: (res) => {
        const invoiceData = res.data;
        
        // Step 2: Save (Create) the Purchase Invoice
        this.purchaseOrderService.createPurchaseInvoice(invoiceData).subscribe({
          next: (createRes) => {
             // Step 3: Automatically Submit to proceed to payment readily?
             // User said "generate it... and then do the payment". 
             // To do payment, invoice usually needs to be Submitted (outstanding amount).
             // Let's try to submit it immediately for streamlined flow.
             const invoiceId = createRes.data.name;
             
             this.purchaseOrderService.submitPurchaseInvoice(invoiceId).subscribe({
               next: (submitRes) => {
                 this.creatingInvoice = false;
                 alert(`Purchase Invoice ${invoiceId} created and submitted successfully!`);
                 this.loadPurchaseOrderDetails();
               },
               error: (err) => {
                 this.creatingInvoice = false;
                 console.error('Error submitting purchase invoice:', err);
                 // It created but failed to submit
                 alert(`Purchase Invoice ${invoiceId} created (Draft), but failed to submit. Please check manually.`);
                 this.loadPurchaseOrderDetails();
               }
             });
          },
          error: (err) => {
            this.creatingInvoice = false;
            console.error('Error creating purchase invoice:', err);
            alert('Failed to create purchase invoice.');
          }
        });
      },
      error: (err) => {
        this.creatingInvoice = false;
        console.error('Error fetching mapped invoice:', err);
        alert('Failed to prepare purchase invoice.');
      }
    });
  }

  /**
   * Make Payment API Call
   * Creates a Payment Entry against the Purchase Invoice
   * Since there could be multiple invoices, we should ideally pick one.
   * However, for this flow, we'll try to find the latest specific invoice or use PO to fetch invoice?
   * Mapped Payment Entry API usually requires Invoice or PO. 
   * Payment Entry can be made against PO (Advance) or PI (Payment).
   * User said "go to the purchase invoice... and then do the payment". 
   * So we should find the Invoice linked to this PO.
   * We don't have the Invoice ID readily available in the PO object unless we fetch it.
   * DO: We'll make a Payment Entry against the PO for now (Advance) OR 
   * Better: We search for the Invoice we just created associated with this PO.
   * 
   * Simplification: For now, I'll attempt to make a Payment Entry against the PO (type='Advance') 
   * if no invoice is found, OR if the user implies "After creating Invoice", 
   * we probably should have stored the Invoice ID or fetch it.
   * 
   * Better approach: Query for PIs linked to this PO.
   * But to avoid over-engineering without a list view of Invoices, 
   * I'll add a check: if status is "To Pay", we assume there is an invoice.
   * 
   * Let's use `get_payment_entry` with `dt='Purchase Order'` first? 
   * No, user explicitly said "purchase invoice ... and then do the payment".
   * 
   * Let's try to find the latest submitted Purchase Invoice for this PO.
   * We need a search method for that.
   * 
   * ALTERNATIVE: Just pass 'Purchase Order' as reference to `get_payment_entry`. 
   * ERPNext allows Payment Entry against PO (Advance).
   * But User said "Purchase Invoice... then Payment".
   * 
   * I'll assume for this simplified flow, we might need to find the Invoice ID.
   * I will add a fetch for PIs in the service or here.
   * 
   * Actually, let's keep it robust. I will modify the `createPayment` to finding the invoice first.
   * 
   * UPDATED PLAN:
   * 1. Search for Purchase Invoices linked to this PO.
   * 2. If found, use the latest one to create Payment Entry.
   * 
   * Since I didn't add a search method yet, I will use `PurchaseOrderService.getPurchaseOrderStats` 
   * or generic list call.
   * 
   * Wait, I can use `purchaseOrderService.getPurchaseOrders` equivalent for Invoices.
   * I'll inject HttpClient here to do a quick search or add method in Service.
   * I'll add a private method `findLinkedInvoice` here using the generic get call if possible, 
   * or better, just ask the Service.
   * 
   * Let's assume for now we create Payment against the PO as "Advance" if we can't find API.
   * BUT, `get_payment_entry` works with PO too.
   * 
   * Let's stick to the user request. "purchase invoice ... then do the payment".
   * I'll use `this.purchaseOrderService` to find invoice.
   * I need to add `getPurchaseInvoicesByPO` to service.
   * 
   * Let's add that to service first? Or just do it inline here if I have general http usage?
   * I have `HttpClientModule` imported but `http` is not in constructor (Service has it).
   * 
   * I will add `getLinkedPurchaseInvoice` to the Service in the next step or assume it exists.
   * Actually, I will add it to the Service now using `multi_replace`.
   */
   
  /**
   * Make Payment API Call
   * Creates a Payment Entry against the latest submitted Purchase Invoice
   */
  createPayment(): void {
    if (!this.purchaseOrder) return;

    if (!confirm('Are you sure you want to make a payment?')) {
      return;
    }

    this.creatingPayment = true;

    // Step 1: Find the linked Purchase Invoice (must be Submitted, i.e., docstatus=1)
    this.purchaseOrderService.getLinkedPurchaseInvoices(this.purchaseOrderId).subscribe({
      next: (res) => {
        const invoices = res.data;
        
        if (!invoices || invoices.length === 0) {
          this.creatingPayment = false;
          alert('No submitted Purchase Invoice found for this order. Please create and submit an invoice first.');
          return;
        }

        // Use the first found invoice (or latest by name sort default)
        // Ideally we should check for outstanding amount > 0
        const pendingInvoice = invoices.find((inv: any) => inv.outstanding_amount > 0) || invoices[0];
        
        if (pendingInvoice.outstanding_amount <= 0) {
           if (!confirm('This invoice seems to be fully paid. Do you want to create another payment anyway?')) {
             this.creatingPayment = false;
             return;
           }
        }

        const invoiceId = pendingInvoice.name;

        // Step 2: Get Mapped Payment Entry
        this.purchaseOrderService.getMappedPaymentEntry(invoiceId).subscribe({
          next: (mapRes) => {
            const paymentData = mapRes.data;
            
            // Step 3: Create (Save) Payment Entry
            this.purchaseOrderService.createPaymentEntry(paymentData).subscribe({
              next: (createRes) => {
                this.creatingPayment = false;
                alert(`Payment Entry ${createRes.data.name} created successfully!`);
                this.loadPurchaseOrderDetails();
              },
              error: (err) => {
                this.creatingPayment = false;
                console.error('Error creating payment entry:', err);
                alert('Failed to create payment entry.');
              }
            });
          },
          error: (err) => {
             this.creatingPayment = false;
             console.error('Error fetching mapped payment entry:', err);
             alert('Failed to prepare payment entry.');
          }
        });
      },
      error: (err) => {
        this.creatingPayment = false;
        console.error('Error finding linked invoices:', err);
        alert('Failed to find linked invoices.');
      }
    });
  }
}
