export const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com'
  : 'http://localhost:8000';

export const CAS_URL = 'https://fed.princeton.edu/cas';

export const FRONTEND_URL = process.env.NODE_ENV === 'production'
  ? 'https://tigerpop-marketplace-frontend-df8f1fbc1309.herokuapp.com'
  : 'http://localhost:3000'; 