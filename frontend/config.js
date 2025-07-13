// ClotCare Frontend Configuration
// Update this file when you change servers

const CONFIG = {
    // Backend API Server URL
    API_BASE_URL: 'https://backendclotcare-production.up.railway.app',
    
    // API Endpoints
    ENDPOINTS: {
        PREDICT: '/predict',
        LIVE_DATA: '/live-data',
        EMERGENCY_EMAIL: '/send-emergency-email'
    }
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
    return CONFIG.API_BASE_URL + endpoint;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, getApiUrl };
} 