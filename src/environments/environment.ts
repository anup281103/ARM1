import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: false,
  apiUrl: '',
  master_baseUrl: 'http://localhost:55612/api/',
  legacy_app_baseUrl: 'http://localhost:59369'
};
