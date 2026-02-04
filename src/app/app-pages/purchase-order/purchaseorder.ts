import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { PurchaseOrderService } from '../../services/purchase-order.service';
import { HttpClientModule } from '@angular/common/http';
import { injectQuery, keepPreviousData } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

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

  // Signals for Pagination & Sorting
  pageSize = signal(5);
  currentPage = signal(1);
  sortColumn = signal<keyof PurchaseOrder | ''>('');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Queries
  countQuery = injectQuery(() => ({
    queryKey: ['purchase-orders-count'],
    queryFn: async () => {
      return lastValueFrom(this.purchaseOrderService.getPurchaseOrdersCount());
    }
  }));

  dataQuery = injectQuery(() => ({
    queryKey: ['purchase-orders', this.currentPage(), this.pageSize(), this.sortColumn(), this.sortDirection()],
    queryFn: async () => {
      let orderBy = 'name desc';
      if (this.sortColumn()) {
        orderBy = `${this.sortColumn()} ${this.sortDirection()}`;
      }
      return lastValueFrom(
        this.purchaseOrderService.getPurchaseOrders(
          (this.currentPage() - 1) * this.pageSize(),
          this.pageSize(),
          orderBy
        )
      );
    },
    placeholderData: keepPreviousData
  }));

  statsQuery = injectQuery(() => ({
    queryKey: ['purchase-orders-stats'],
    queryFn: async () => {
      // Fetch all for stats
      return lastValueFrom(this.purchaseOrderService.getPurchaseOrders(0, 999999, 'name desc'));
    }
  }));

  // Derived State
  totalRecords = computed(() => this.countQuery.data()?.message || 0);
  orders = computed(() => this.dataQuery.data()?.data || []);
  loading = computed(() => this.dataQuery.isPending());
  error = computed(() => this.dataQuery.error());

  // Statistics Derived State
  stats = computed(() => {
    const allOrders = this.statsQuery.data()?.data || [];
    return {
      total: allOrders.length,
      toBill: allOrders.filter((o: any) => o.status === 'To Bill').length,
      completed: allOrders.filter((o: any) => o.status === 'Completed').length,
      draft: allOrders.filter((o: any) => o.status === 'Draft').length,
      toReceiveAndBill: allOrders.filter((o: any) => o.status === 'To Receive and Bill').length
    };
  });
  statsLoading = computed(() => this.statsQuery.isPending());

  // Charts
  monthlyChart!: Partial<ApexOptions>;
  chartOptions_1!: Partial<ApexOptions>;

  constructor(private purchaseOrderService: PurchaseOrderService) {
    this.initializeCharts();
  }

  ngOnInit(): void {
    // Queries execute automatically
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

  get totalPages(): number {
    return Math.ceil(this.totalRecords() / this.pageSize());
  }

  get paginatedOrders(): PurchaseOrder[] {
    return this.orders();
  }

  /**
   * Change sorting column and direction
   */
  changeSort(column: keyof PurchaseOrder): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    // Reset to first page
    this.currentPage.set(1);
  }

  /**
   * Change current page
   */
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    
    this.currentPage.set(page);
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(): void {
    this.currentPage.set(1);
  }
  
  refreshList() {
    this.currentPage.set(1);
    this.dataQuery.refetch();
    this.countQuery.refetch();
    this.statsQuery.refetch();
  }
}
