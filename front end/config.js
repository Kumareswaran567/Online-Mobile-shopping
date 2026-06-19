// Frontend Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:4000/api',
    ENDPOINTS: {
        CHECKOUT:          '/checkout',
        ORDERS:            '/orders',
        RETURNS:           '/returns',
        RETURNS_ELIGIBILITY: '/returns/check-eligibility',
        RETURNS_VERIFY:    '/returns/verify-identity',
        RETURNS_REQUEST:   '/returns/request',
        RETURNS_MY_ORDERS: '/returns/my-orders',
        ADMIN_RETURNS:     '/returns'
    }
};

/**
 * Get full API URL for a specific endpoint
 * @param {string} endpoint - The endpoint path
 * @returns {string} The full URL
 */
function getApiUrl(endpoint) {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
}

