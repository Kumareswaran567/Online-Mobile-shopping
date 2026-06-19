
// Checkout Logic
const form = document.getElementById('checkoutForm');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form elements
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const cardInput = document.getElementById('cardNumber') || document.getElementById('card');
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const card = cardInput.value.replace(/\s/g, '');
        
        // Get selected mobile from sessionStorage (consistent with mobiles.html)
        const mobile = JSON.parse(sessionStorage.getItem('selectedMobile') || '{}');

        let valid = true;
        // Clear previous error messages
        document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');

        // Name validation
        if (name.length < 2) {
            const nameError = document.getElementById('nameError');
            if (nameError) nameError.style.display = 'block';
            valid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            const emailError = document.getElementById('emailError');
            if (emailError) emailError.style.display = 'block';
            valid = false;
        }

        // Card validation
        if (!/^\d{16}$/.test(card)) {
            const cardError = document.getElementById('cardError');
            if (cardError) cardError.style.display = 'block';
            valid = false;
        }

        if (!mobile.id) {
            alert("No mobile selected. Please go back and select a mobile.");
            return;
        }

        if (!valid) return;

        try {
            // Use API_CONFIG if available, otherwise fallback to localhost
            const apiUrl = typeof getApiUrl === 'function' ? 
                           getApiUrl(API_CONFIG.ENDPOINTS.CHECKOUT) : 
                           "http://localhost:4000/api/checkout";

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    mobile: {
                        id: mobile.id,
                        brand: mobile.brand,
                        model: mobile.model,
                        price: mobile.price
                    },
                    customer: {
                        name: name,
                        email: email
                    },
                    cardNumber: card,
                    totalAmount: mobile.price
                })
            });

            const data = await res.json();

            if (data.success) {
                sessionStorage.setItem('orderDetails', JSON.stringify({
                    ...data,
                    mobile: mobile,
                    customer: { name, email },
                    cardNumber: card
                }));
                window.location.href = 'success.html';
            } else {
                alert(data.message || "Payment Failed");
            }

        } catch (err) {
            alert("Backend server not reachable. Please ensure the server is running.");
            console.error(err);
        }
    });
}