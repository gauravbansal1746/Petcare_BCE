/**
 * PetCare — State → City → Pincode mapping (shared for Client + Caretaker)
 *
 * Globals:
 *   window.PETCARE_PINCODES
 *   window.petcareGetPincodes(state, city) -> string[]
 *   window.petcareInitPincodeAutofill({ stateId, cityId, pinId, preferDropdown? })
 */
(function (global) {
    var PINCODES = {
        Haryana: {
            Gurgaon: ["122001", "122002", "122003"],
            Faridabad: ["121001", "121002"],
            Panipat: ["132103"],
            Ambala: ["133001"],
            Karnal: ["132001"]
        },
        Maharashtra: {
            Mumbai: ["400001", "400002", "400003"],
            Pune: ["411001", "411002"],
            Nagpur: ["440001"],
            Nashik: ["422001"],
            Aurangabad: ["431001"]
        },
        Karnataka: {
            Bangalore: ["560001", "560002"],
            Mysore: ["570001"],
            Mangalore: ["575001"],
            Hubli: ["580020"]
        },
        "Uttar Pradesh": {
            Lucknow: ["226001"],
            Kanpur: ["208001"],
            Noida: ["201301"],
            Varanasi: ["221001"],
            Agra: ["282001"]
        },
        "Tamil Nadu": {
            Chennai: ["600001", "600002"],
            Coimbatore: ["641001"],
            Madurai: ["625001"],
            Salem: ["636001"]
        },
        Delhi: {
            "New Delhi": ["110001"],
            "North Delhi": ["110007"],
            "South Delhi": ["110016"],
            Dwarka: ["110075"],
            Rohini: ["110085"]
        },
        Gujarat: {
            Ahmedabad: ["380001"],
            Surat: ["395003"],
            Vadodara: ["390001"],
            Rajkot: ["360001"],
            Gandhinagar: ["382010"]
        },
        Punjab: {
            Ludhiana: ["141001"],
            Amritsar: ["143001"],
            Jalandhar: ["144001"],
            Patiala: ["147001"]
        },
        Rajasthan: {
            Jaipur: ["302001"],
            Udaipur: ["313001"],
            Jodhpur: ["342001"],
            Kota: ["324001"],
            Ajmer: ["305001"]
        },
        "West Bengal": {
            Kolkata: ["700001"],
            Howrah: ["711101"],
            Durgapur: ["713201"],
            Siliguri: ["734001"]
        }
    };

    function normalize(s) {
        return (s == null ? "" : String(s)).trim();
    }

    function getPincodes(state, city) {
        var st = normalize(state);
        var ct = normalize(city);
        if (!st || !ct) return [];
        var sMap = PINCODES[st];
        var list = sMap ? sMap[ct] : null;
        return Array.isArray(list) ? list : [];
    }

    function setReadOnly(el, ro) {
        if (!el) return;
        el.readOnly = !!ro;
        if (ro) el.setAttribute("readonly", "readonly");
        else el.removeAttribute("readonly");
    }

    function initAutofill(opts) {
        opts = opts || {};
        var stateId = opts.stateId;
        var cityId = opts.cityId;
        var pinId = opts.pinId;

        var st = document.getElementById(stateId);
        var ct = document.getElementById(cityId);
        var pin = document.getElementById(pinId);
        if (!st || !ct || !pin) {
            console.warn("[pincode] missing elements", { stateId: stateId, cityId: cityId, pinId: pinId });
            return;
        }

        if (st.getAttribute("data-petcare-pin-wired") === "1") return;
        st.setAttribute("data-petcare-pin-wired", "1");

        setReadOnly(pin, true);

        function update() {
            var state = st.value;
            var city = ct.value;
            var pins = getPincodes(state, city);
            var val = pins.length ? pins[0] : "";

            pin.value = val;

            console.log("State:", state || "");
            console.log("City:", city || "");
            console.log("Pincode:", val || "");
        }

        // City drives pincode
        ct.addEventListener("change", update);
        // State change resets city list (handled elsewhere) and should clear/refresh pincode
        st.addEventListener("change", function () {
            pin.value = "";
            update();
        });

        update();
    }

    global.PETCARE_PINCODES = PINCODES;
    global.petcareGetPincodes = getPincodes;
    global.petcareInitPincodeAutofill = initAutofill;
})(typeof window !== "undefined" ? window : this);

