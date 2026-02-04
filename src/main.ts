import { enableProdMode, importProvidersFrom } from '@angular/core';

import { environment } from 'src/environments/environment.prod';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AppRoutingModule } from './app/app-routing.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(), 
    importProvidersFrom(BrowserModule, AppRoutingModule), 
    provideAnimations(),
    provideTanStackQuery(new QueryClient())
  ]
}).catch((err) => console.error(err));
