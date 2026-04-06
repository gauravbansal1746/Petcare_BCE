/**
 * Vanilla JS — India state → city dropdowns (no React).
 *
 * Usage (after DOM ready):
 *   initCaretakerStateCitySelects("sts", "caretkrCity");
 *
 * After loading profile from API (state + city already set on <select>):
 *   petcareSyncCaretakerCities("sts", "caretkrCity", row.city);
 *
 * Legacy (still supported):
 *   print_state("sts");
 *   print_city("caretkrCity", stateSelect.selectedIndex);
 */
(function (global) {
    var STATE_CITIES = global.PETCARE_INDIA_STATE_CITIES;
    var STATE_ORDER = global.PETCARE_INDIA_STATE_ORDER;
    if (!STATE_CITIES || !STATE_ORDER) {
        console.error(
            "[caretaker-state-cities] Load js/india-state-cities-data.js before this script (defines PETCARE_INDIA_STATE_CITIES / ORDER)."
        );
        STATE_CITIES = {};
        STATE_ORDER = [];
    }

    var DEBUG = typeof location !== "undefined" && /[?&]debugStateCity=1/.test(location.search);

    function fillStateSelect(stateId) {
        var sel = document.getElementById(stateId);
        if (!sel) return;
        sel.length = 0;
        sel.options[0] = new Option("Select State", "");
        sel.selectedIndex = 0;
        for (var i = 0; i < STATE_ORDER.length; i++) {
            var name = STATE_ORDER[i];
            sel.options[sel.options.length] = new Option(name, name);
        }
    }

    /** Rebuild city <select> from exact state name (must match STATE_CITIES key). */
    function rebuildCityOptions(cityEl, stateName) {
        cityEl.length = 0;
        cityEl.options[0] = new Option(stateName ? "Select City" : "Select state first", "");
        cityEl.selectedIndex = 0;

        if (!stateName || String(stateName).trim() === "") {
            cityEl.disabled = true;
            if (DEBUG) console.log("[caretaker-state-cities] city dropdown disabled — no state");
            return;
        }

        var cities = STATE_CITIES[stateName];
        if (!cities || !cities.length) {
            cityEl.disabled = true;
            console.warn("[caretaker-state-cities] no cities for state (check spelling vs mapping):", stateName);
            return;
        }

        cityEl.disabled = false;
        for (var j = 0; j < cities.length; j++) {
            var c = cities[j];
            cityEl.options[cityEl.options.length] = new Option(c, c);
        }
        if (DEBUG) console.log("[caretaker-state-cities] cities for", stateName, ":", cities.length);
    }

    /**
     * Wire state → city: instant update on change. Call once when the page loads (DOM ready).
     * @param {string} stateSelectId  e.g. "sts"
     * @param {string} citySelectId   e.g. "caretkrCity"
     * @param {{ debug?: boolean }} [opts]
     */
    function initCaretakerStateCitySelects(stateSelectId, citySelectId, opts) {
        opts = opts || {};
        if (opts.debug) DEBUG = true;

        var st = document.getElementById(stateSelectId);
        var ct = document.getElementById(citySelectId);
        if (!st || !ct) {
            console.warn("[caretaker-state-cities] missing #", stateSelectId, "or #", citySelectId);
            return;
        }

        if (st.getAttribute("data-petcare-wired") === "1") return;
        st.setAttribute("data-petcare-wired", "1");

        fillStateSelect(stateSelectId);

        function onStateChange() {
            var name = st.value;
            if (DEBUG) console.log("[caretaker-state-cities] state changed →", name || "(empty)");
            rebuildCityOptions(ct, name);
        }

        st.addEventListener("change", onStateChange);
        onStateChange();
    }

    /**
     * @param {string} cityId
     * @param {number} stateSelectedIndex - 0 = placeholder, 1 = first state in list
     */
    function fillCitySelect(cityId, stateSelectedIndex) {
        var el = document.getElementById(cityId);
        if (!el) return;
        if (!stateSelectedIndex || stateSelectedIndex < 1) {
            rebuildCityOptions(el, "");
            return;
        }
        var stateName = STATE_ORDER[stateSelectedIndex - 1];
        rebuildCityOptions(el, stateName);
    }

    /** After API load: set state value first, then rebuild cities and select city. */
    function syncCityDropdownForState(stateSelectId, citySelectId, cityValueToSelect) {
        var st = document.getElementById(stateSelectId);
        var ct = document.getElementById(citySelectId);
        if (!st || !ct) return;
        rebuildCityOptions(ct, st.value);
        if (cityValueToSelect) {
            ct.value = cityValueToSelect;
            if (ct.value !== cityValueToSelect && DEBUG)
                console.warn("[caretaker-state-cities] city not in list for state:", st.value, "wanted:", cityValueToSelect);
        }
    }

    global.initCaretakerStateCitySelects = initCaretakerStateCitySelects;
    global.petcareSyncCaretakerCities = syncCityDropdownForState;
    global.print_state = fillStateSelect;
    global.print_city = fillCitySelect;
})(typeof window !== "undefined" ? window : this);
