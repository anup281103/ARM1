// Angular Import
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// project import
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';
import { MaterialRequest } from './app-pages/material-request/material-request';
// import { EmployeeProfile } from './contractual-employee/employee-profile/employee-profile';
// import { TabsLayout } from './contractual-employee/employee-profile/tabs/tabs-layout/tabs-layout';
// import { PersonalDetails } from './contractual-employee/employee-profile/tabs/personal-details/personal-details';
// import { FirstAppointment } from './contractual-employee/employee-profile/tabs/first-appointment/first-appointment';
// import { TransferPosting } from './contractual-employee/employee-profile/tabs/transfer-posting/transfer-posting';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        //redirectTo: '/contractual-employee',
        //redirectTo: '/resgister-profile',
        redirectTo: '/login',
        pathMatch: 'full'
      },
      {
        path: 'analytics',
        loadComponent: () => import('./demo/dashboard/dash-analytics.component').then((c) => c.DashAnalyticsComponent)
      },
      {
        path: 'component',
        loadChildren: () => import('./demo/ui-element/ui-basic.module').then((m) => m.UiBasicModule)
      },

      {
        path: 'materialRequest',
        component: MaterialRequest
      },

      // {
      //   path: 'chart',
      //   loadComponent: () => import('./demo/chart-maps/core-apex.component').then((c) => c.CoreApexComponent)
      // },
      {
        path: 'forms',
        loadComponent: () => import('./demo/forms/form-elements/form-elements.component').then((c) => c.FormElementsComponent)
      },
      {
        path: 'tables',
        loadComponent: () => import('./demo/tables/tbl-bootstrap/tbl-bootstrap.component').then((c) => c.TblBootstrapComponent)
      },
      {
        path: 'sample-page',
        loadComponent: () => import('./demo/other/sample-page/sample-page.component').then((c) => c.SamplePageComponent)
      }
      // {
      //   path: 'resgister-employee',
      //   loadComponent: () => import('./employee/register/register').then((c) => c.Register)
      // },
      // {
      //   path: 'emp-profile',
      //   component: EmployeeProfile,
      //   children: [
      //     {
      //       path: '',
      //       component: TabsLayout,
      //       children: [
      //         { path: '', redirectTo: 'personal-details', pathMatch: 'full' },
      //         { path: 'personal-details', component: PersonalDetails },
      //         { path: 'first-appointment', component: FirstAppointment },
      //         { path: 'transfer-posting', component: TransferPosting }
      //       ]
      //     }
      //   ]
      // }
    ]
  },
  {
    path: '',
    component: GuestComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./demo/pages/authentication/sign-in/sign-in.component').then((c) => c.SignInComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./demo/pages/authentication/sign-in/sign-in.component').then((c) => c.SignInComponent)
      }
      // {
      //   path: 'contractual-registration',
      //   loadComponent: () => import('./ContractualEmployee/contractual-registration/contractual-registration').then((c) => c.ContractualRegistration)
      // }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
