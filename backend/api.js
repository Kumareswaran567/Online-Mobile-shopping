

/**
 * Send checkout data to backend
 * @param {Object} orderData - Order data object
 * @returns {Promise} Promise that resolves with order response
 


/**
 * Get order details from backend
 * @param {string} orderId - Order ID
 * @returns {Promise} Promise that resolves with order data
 */
async function getOrder(orderId) {
    try {
        const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}`), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch order: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * @param {Error} error - Error object
 * @param {HTMLElement} errorElement - DOM element to display error
 */
function handleApiError(error, errorElement) {
    let errorMessage = 'An unexpected error occurred. Please try again.';
    
    if (error.message) {
        errorMessage = error.message;
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
    }
    
    if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.classList.add('show');
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    return errorMessage;
}
