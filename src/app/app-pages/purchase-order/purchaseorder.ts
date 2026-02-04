import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { HttpClientModule } from '@angular/common/http';

interface PurchaseOrder {
  name: string;          // ERPNext uses 'name' for PO ID
  status: string;
  supplier: string;
  transaction_date: string;  // ERPNext field name
  grand_total: number;       // ERPNext field name
  company: string;
}


@Component({
  selector: 'app-purchaseorder',
  standalone: true,
  imports: [NgApexchartsModule, CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './purchaseorder.html',
  styleUrl: './purchaseorder.scss'
})
export class Purchaseorder implements OnInit {

  // Data
  orders: PurchaseOrder[] = [];
  loading: boolean = false;
  error: string | null = null;

  // Statistics
  stats = {
    total: 0,
    toBill: 0,
    completed: 0,
    draft: 0,
    toReceiveAndBill: 0
  };
  statsLoading: boolean = false;

  // Pagination
  pageSize = 5;
  currentPage = 1;
  totalRecords = 0;  // Will be updated from API response

  // Sorting
  sortColumn: keyof PurchaseOrder | '' = '';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Charts
  monthlyChart!: Partial<ApexOptions>;
  chartOptions_1!: Partial<ApexOptions>;

  constructor(private purchaseOrderService: PurchaseOrderService) {
    this.initializeCharts();
  }

  ngOnInit(): void {
    this.loadPurchaseOrders();
    this.loadStatistics();
  }

  initializeCharts(): void {
    this.monthlyChart = {
      chart: {
        type: 'bar',
        height: 260,
        toolbar: { show: false }
      },

      series: [
        {
          name: 'Purchase Orders',
          data: [4, 7, 10, 9, 14, 19]
        }
      ],

      xaxis: {
        categories: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan']
      },

      dataLabels: {
        enabled: false
      },

      colors: ['#4680ff'],

      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '40%'
        }
      }
    };

    this.chartOptions_1 = {
      chart: {
        height: 150,
        type: 'donut'
      },
      dataLabels: {
        enabled: false
      },
      plotOptions: {
        pie: {
          donut: {
            size: '75%'
          }
        }
      },
      labels: ['New', 'Return'],
      series: [20, 15],
      legend: {
        show: false
      },
      tooltip: {
        theme: 'dark'
      },
      grid: {
        padding: {
          top: 20,
          right: 0,
          bottom: 0,
          left: 0
        }
      },
      colors: ['#d6d6d6', '#2955d2'],
      fill: {
        opacity: [1, 1]
      },
      stroke: {
        width: 0
      }
    };
  }

  /**
   * Load purchase order statistics from ERPNext API
   */
  loadStatistics(): void {
    this.statsLoading = true;

    // Fetch all purchase orders with just name and status fields for counting
    const fields = JSON.stringify(['name', 'status']);
    const url = `limit_start=0&limit_page_length=999999`; // Get all records for statistics

    this.purchaseOrderService.getPurchaseOrders(0, 999999, 'name desc').subscribe({
      next: (response) => {
        const allOrders = response.data || [];
        
        // Calculate statistics
        this.stats.total = allOrders.length;
        this.stats.completed = allOrders.filter((o: any) => o.status === 'Completed').length;
        this.stats.toBill = allOrders.filter((o: any) => o.status === 'To Bill').length;
        this.stats.draft = allOrders.filter((o: any) => o.status === 'Draft').length;
        this.stats.toReceiveAndBill = allOrders.filter((o: any) => o.status === 'To Receive and Bill').length;
        
        this.statsLoading = false;
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
        this.statsLoading = false;
        // Keep default values on error
      }
    });
  }

  /**
   * Load purchase orders from ERPNext API
   */
  loadPurchaseOrders(): void {
    this.loading = true;
    this.error = null;

    // Calculate pagination offset
    const limitStart = (this.currentPage - 1) * this.pageSize;

    // Build order_by parameter for ERPNext
    let orderBy = 'name desc'; // Default sorting
    if (this.sortColumn) {
      orderBy = `${this.sortColumn} ${this.sortDirection}`;
    }

    // Step 1: Get count
    this.purchaseOrderService.getPurchaseOrdersCount().subscribe({
      next: (countRes: any) => {
        this.totalRecords = countRes.message || 0;
        
        // Step 2: Fetch paginated data
        this.purchaseOrderService
          .getPurchaseOrders(limitStart, this.pageSize, orderBy)
          .subscribe({
            next: (response) => {
              this.orders = response.data || [];
              this.loading = false;
            },
            error: (err) => {
              console.error('Error loading purchase orders:', err);
              this.error = 'Failed to load purchase orders. Please try again.';
              this.loading = false;
              this.orders = [];
            }
          });
      },
      error: (err) => {
        console.error('Failed to get count:', err);
        // Fallback
        this.purchaseOrderService
          .getPurchaseOrders(limitStart, this.pageSize, orderBy)
          .subscribe({
            next: (response) => {
              this.orders = response.data || [];
              this.loading = false;
            },
            error: (e) => this.loading = false
          });
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  get paginatedOrders(): PurchaseOrder[] {
    // Since we're fetching paginated data from API, just return all orders
    return this.orders;
  }

  /**
   * Change sorting column and direction
   * Triggers API call with new sorting parameters
   */
  changeSort(column: keyof PurchaseOrder): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // Reset to first page when sorting changes
    this.currentPage = 1;

    // Reload data with new sorting
    this.loadPurchaseOrders();
  }

  /**
   * Change current page
   * Triggers API call with new pagination parameters
   */
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    
    this.currentPage = page;
    this.loadPurchaseOrders();
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadPurchaseOrders();
  }
}
