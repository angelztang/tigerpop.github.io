export const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com'
  : 'http://localhost:8000/api';  // Added back /api prefix

export const CAS_URL = process.env.NODE_ENV === 'production'
  ? 'https://fed.princeton.edu/cas'
  : 'https://fed.princeton.edu/cas';  // Always use Princeton CAS server 