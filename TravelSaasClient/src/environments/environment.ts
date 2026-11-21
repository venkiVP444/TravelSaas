export const environment = {
  production: false,
  apiUrl: (window as any)?.__env?.apiUrl || ((window.location.port === '4200' && window.location.hostname.includes('127.0.0.1')) ? 'http://127.0.0.1:5000/api' : (window.location.port === '4200' && window.location.hostname === 'localhost') ? 'http://localhost:5000/api' : '/api')
};

