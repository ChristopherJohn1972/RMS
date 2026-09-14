// ============================================
// API CONFIGURATION FOR RENTAL MANAGEMENT SYSTEM
// Backend: FastAPI (Python) on Render
// URL: https://rental-management-services-backend-1.onrender.com
// ============================================

const API_CONFIG = {
    BASE_URL: 'https://rental-management-services-backend-1.onrender.com',
    
    // ========== AUTHENTICATION ==========
    AUTH: {
        LOGIN: '/login',                    // POST
        REGISTER: '/register',              // POST  
        PROFILE: '/profile',                // GET
        ME: '/api/auth/me'                  // GET
    },
    
    // ========== PROPERTIES ==========
    PROPERTIES: {
        PUBLIC: '/api/properties',          // GET (public)
        PROTECTED: '/api/v1/properties',    // GET (protected)
        CREATE: '/api/v1/properties'        // POST (admin only)
    },
    
    // ========== DASHBOARD ==========
    DASHBOARD: {
        USER: '/dashboard/user',            // GET
        STAFF: '/dashboard/staff',          // GET
        ADMIN: '/dashboard/admin'           // GET
    },
    
    // ========== MAINTENANCE ==========
    MAINTENANCE: {
        CREATE: '/api/v1/maintenance/requests',  // POST
        LIST: '/api/v1/maintenance/requests'     // GET
    },
    
    // ========== PAYMENTS ==========
    PAYMENTS: '/api/v1/payments',           // GET
    
    // ========== TENANTS ==========
    TENANTS: '/api/v1/tenants',             // GET (staff/admin)
    
    // ========== SYSTEM ==========
    SYSTEM: {
        HEALTH: '/health',
        INFO: '/api/v1/info'
    }
};

export default API_CONFIG;

// ============================================
// USAGE EXAMPLE:
// ============================================
/*
import API_CONFIG from './apiConfig';

// Login example
async function login(email, password) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.AUTH.LOGIN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return response.json();
}

// Get properties example  
async function getProperties() {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.PROPERTIES.PUBLIC}`);
    return response.json();
}
*/
