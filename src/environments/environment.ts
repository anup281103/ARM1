// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: false,
  // [CRITICAL] KEEP THIS EMPTY IN DEV MODE
  // While empty, requests go to 'localhost:4200/api'. 
  // The Angular Proxy (proxy.conf.json) INTERCEPTS this and tunnels it to '10.120.9.114:8000'.
  // This bypasses the 403 CORS Error you see when connecting directly.
  apiUrl: '', 
  master_baseUrl: 'http://localhost:55612/api/',
  legacy_app_baseUrl: 'http://localhost:59369'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
