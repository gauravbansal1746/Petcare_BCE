/**
 * Single source of truth: India state → cities (keys must match <option> values exactly).
 * Load before caretaker-state-cities.js and before the React finder app.
 *
 * Globals:
 *   window.PETCARE_INDIA_STATE_CITIES
 *   window.PETCARE_INDIA_STATE_ORDER
 *   window.petcareGetCitiesForState(stateName) → string[]
 */
(function (global) {
    var CITIES = {
        "Andaman & Nicobar": ["Port Blair"],
        "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
        "Arunachal Pradesh": ["Itanagar", "Tawang", "Ziro"],
        Assam: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
        Bihar: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
        Chandigarh: ["Chandigarh"],
        Chhattisgarh: ["Raipur", "Bhilai", "Bilaspur", "Durg"],
        "Dadra & Nagar Haveli": ["Silvassa"],
        "Daman & Diu": ["Daman", "Diu"],
        Delhi: ["New Delhi", "North Delhi", "South Delhi", "Dwarka", "Rohini"],
        Goa: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
        Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
        Haryana: ["Gurgaon", "Faridabad", "Panipat", "Ambala", "Karnal"],
        "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Solan"],
        "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
        Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
        Karnataka: ["Bangalore", "Mysore", "Mangalore", "Hubli"],
        Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
        Lakshadweep: ["Kavaratti"],
        "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
        Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
        Manipur: ["Imphal"],
        Meghalaya: ["Shillong"],
        Mizoram: ["Aizawl"],
        Nagaland: ["Kohima", "Dimapur"],
        Orissa: ["Bhubaneswar", "Cuttack", "Rourkela"],
        Pondicherry: ["Puducherry", "Karaikal"],
        Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
        Rajasthan: ["Jaipur", "Udaipur", "Jodhpur", "Kota", "Ajmer"],
        Sikkim: ["Gangtok"],
        "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
        Tripura: ["Agartala"],
        "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Varanasi", "Agra"],
        Uttaranchal: ["Dehradun", "Haridwar", "Nainital"],
        "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri"]
    };

    var ORDER = [
        "Andaman & Nicobar", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
        "Chhattisgarh", "Dadra & Nagar Haveli", "Daman & Diu", "Delhi", "Goa", "Gujarat", "Haryana",
        "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Lakshadweep",
        "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Orissa",
        "Pondicherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Tripura", "Uttar Pradesh",
        "Uttaranchal", "West Bengal"
    ];

    function getCitiesForState(state) {
        if (state == null || String(state).trim() === "") return [];
        var list = CITIES[state];
        if (!Array.isArray(list) || !list.length) {
            console.warn("[india-state-cities-data] Unknown or empty state key (must match mapping exactly):", state);
            return [];
        }
        return list;
    }

    global.PETCARE_INDIA_STATE_CITIES = CITIES;
    global.PETCARE_INDIA_STATE_ORDER = ORDER;
    global.petcareGetCitiesForState = getCitiesForState;
})(typeof window !== "undefined" ? window : this);
