const isDevelopment = process.env.NODE_ENV === 'development';

// Always use the production frontend URL for CAS authentication
export const FRONTEND_URL = 'https://tigerpop-marketplace-frontend-df8f1fbc1309.herokuapp.com';

export const API_URL = 'https://tigerpop-marketplace-backend-76fa6fb8c8a2.herokuapp.com';

export const CAS_URL = 'https://fed.princeton.edu/cas';

// The service URL should be our backend's CAS endpoint
export const CAS_SERVICE = `${API_URL}/api/auth/cas/login?redirect_uri=${encodeURIComponent(FRONTEND_URL)}`;

export const CAS_ENTITY_ID = 'https://iamprox202L.princeton.edu/shibboleth'; 