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
  loading: boolean = false;
  error: string | null = null;

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
        this.loading = false;
      }
    });
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
    
    if (status === 'Completed' || status === 'Closed') {
      return { cssClass: 'completed', status: 'Completed' };
    } else if (status === 'To Receive and Bill' || status === 'To Bill' || status === 'To Receive') {
      return { cssClass: 'active', status: status };
    } else if (status === 'Submitted') {
      return { cssClass: 'active', status: 'Submitted' };
    }
    
    return { cssClass: 'pending', status: status };
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
      return { cssClass: 'active', status: `${perReceived}% Received` };
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
    
    if (perBilled >= 100) {
      return { cssClass: 'completed', status: 'Ready for Payment' };
    } else if (perBilled > 0) {
      return { cssClass: 'active', status: `${perBilled}% Billed` };
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

    const status = this.purchaseOrder.status;
    const perBilled = this.purchaseOrder.per_billed || 0;
    
    if (status === 'Completed' || status === 'Closed') {
      return { cssClass: 'completed', status: 'Completed' };
    } else if (perBilled >= 100) {
      return { cssClass: 'active', status: 'In Progress' };
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

    // Material Request (20%)
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
    if (status === 'Completed' || status === 'Closed') {
      progress += 20;
    }

    return Math.min(progress, 100);
  }
}
