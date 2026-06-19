
const API_CONFIG = {

    BASE_URL: 'http://localhost:4000/api', 
    ENDPOINTS: {
        CHECKOUT: '/checkout',
        ORDERS: '/orders'
    }
};

// Helper function to get full API URL
// function getApiUrl(endpoint) {
//     return `${API_CONFIG.BASE_URL}${endpoint}`;
// }
function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + endpoint;
}