/**
 * Find Caretaker — React without JSX (works with Helmet CSP; no Babel).
 * Same state→city data as Caretaker Profile: india-state-cities-data.js
 */
(function () {
    var useState = React.useState;
    var useMemo = React.useMemo;
    var e = React.createElement;

    function CaretakerFinderApp() {
        var stateOrder = window.PETCARE_INDIA_STATE_ORDER;
        var dataOk =
            Array.isArray(stateOrder) &&
            stateOrder.length > 0 &&
            typeof window.petcareGetCitiesForState === "function";

        var stState = useState("");
        var selectedState = stState[0];
        var setSelectedState = stState[1];

        var ctState = useState("");
        var selectedCity = ctState[0];
        var setSelectedCity = ctState[1];

        var ptState = useState("");
        var selectedPet = ptState[0];
        var setSelectedPet = ptState[1];

        var resState = useState([]);
        var results = resState[0];
        var setResults = resState[1];

        var nrState = useState(false);
        var showNoResults = nrState[0];
        var setShowNoResults = nrState[1];

        var cityOptions = useMemo(
            function () {
                if (!dataOk || !selectedState) return [];
                return window.petcareGetCitiesForState(selectedState);
            },
            [dataOk, selectedState]
        );

        var cityDisabled = !selectedState || cityOptions.length === 0;
        var cityPlaceholder = !selectedState
            ? "Select state first"
            : cityOptions.length === 0
              ? "No cities for this state"
              : "Choose city…";

        function onStateChange(ev) {
            var v = ev.target.value;
            console.log("[caretaker-finder] selected state:", v || "(empty)");
            setSelectedState(v);
            setSelectedCity("");
            setShowNoResults(false);
        }

        function onCityChange(ev) {
            var v = ev.target.value;
            console.log("[caretaker-finder] selected city:", v || "(empty)", "| state:", selectedState || "(empty)");
            setSelectedCity(v);
        }

        function onPetChange(ev) {
            var v = ev.target.value;
            console.log("[caretaker-finder] selected pet type:", v || "(empty)");
            setSelectedPet(v);
        }

        function fetchCaretakers() {
            var city = (selectedCity && String(selectedCity).trim()) || "";
            var pet = (selectedPet && String(selectedPet).trim()) || "";
            if (!city) {
                alert("Please select a state and city.");
                return;
            }
            if (!pet) {
                alert("Please select a pet type.");
                return;
            }

            setShowNoResults(false);
            setResults([]);

            var url =
                "/api/v1/caretakers?cityforserver=" +
                encodeURIComponent(city) +
                "&petforserver=" +
                encodeURIComponent(pet);

            console.log("[caretaker-finder] Fetch caretakers request:", {
                state: selectedState || "(empty)",
                city: city,
                pet: pet,
                url: url
            });

            fetch(url)
                .then(function (res) {
                    return res.json().then(function (body) {
                        return { ok: res.ok, status: res.status, body: body };
                    });
                })
                .then(function (out) {
                    console.log("[caretaker-finder] Fetch caretakers response:", {
                        httpStatus: out.status,
                        status: out.body && out.body.status,
                        count: out.body && out.body.data ? out.body.data.length : 0,
                        body: out.body
                    });
                    if (!out.ok) {
                        var msg =
                            (out.body && out.body.message) ||
                            "Search failed (HTTP " + out.status + ").";
                        alert(msg);
                        return;
                    }
                    var list = out.body && out.body.data ? out.body.data : [];
                    setResults(list);
                    setShowNoResults(list.length === 0);
                })
                .catch(function (err) {
                    console.error("[caretaker-finder] network / parse error:", err);
                    alert("Network error — is the server running?");
                });
        }

        function createBookingFor(caretakerEmail) {
            var token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in first.");
                window.location.href = "/";
                return;
            }

            var pet = (selectedPet && String(selectedPet).trim()) || "";
            var city = (selectedCity && String(selectedCity).trim()) || "";
            if (!pet || !city) {
                alert("Please select pet type and city first.");
                return;
            }

            var bookingDate = window.prompt("Enter booking date (YYYY-MM-DD):");
            if (!bookingDate) return;
            var bookingTime = window.prompt("Enter booking time (HH:MM, 24h):", "10:00");
            if (!bookingTime) return;

            fetch("/api/v1/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({
                    caretakerId: caretakerEmail,
                    petType: pet,
                    city: city,
                    date: bookingDate,
                    time: bookingTime
                })
            })
                .then(function (res) {
                    return res.json().then(function (body) {
                        return { ok: res.ok, status: res.status, body: body };
                    });
                })
                .then(function (out) {
                    if (!out.ok) {
                        alert((out.body && out.body.message) || ("Booking failed (HTTP " + out.status + ")"));
                        return;
                    }
                    var bookingId = out.body && out.body.bookingId;
                    alert("Booking created successfully.");
                    window.location.href = "/payment?bookingId=" + encodeURIComponent(bookingId);
                })
                .catch(function () {
                    alert("Network error while creating booking.");
                });
        }

        if (!dataOk) {
            return e(
                "div",
                { className: "alert alert-danger m-3" },
                "State/city data failed to load. Include ",
                e("code", null, "js/india-state-cities-data.js"),
                " before this script."
            );
        }

        var stateOptions = [
            e("option", { key: "_", value: "" }, "Choose state…")
        ].concat(
            stateOrder.map(function (s) {
                return e("option", { key: s, value: s }, s);
            })
        );

        var cityOptionEls = [
            e("option", { key: "_", value: "" }, cityPlaceholder)
        ].concat(
            cityOptions.map(function (c) {
                return e("option", { key: c, value: c }, c);
            })
        );

        return e(
            React.Fragment,
            null,
            e(
                "div",
                { className: "container" },
                e(
                    "div",
                    { className: "alert alert-info py-2 small" },
                    "Choose the same state and city style as caretakers use in their profile. Search uses ",
                    e("strong", null, "city + pet"),
                    " against the database."
                ),
                e(
                    "div",
                    { className: "row g-3" },
                    e(
                        "div",
                        { className: "col-md-4" },
                        e("label", { className: "form-label", htmlFor: "finder-state" }, "State"),
                        e(
                            "select",
                            {
                                id: "finder-state",
                                className: "form-select",
                                value: selectedState,
                                onChange: onStateChange
                            },
                            stateOptions
                        )
                    ),
                    e(
                        "div",
                        { className: "col-md-4" },
                        e("label", { className: "form-label", htmlFor: "finder-city" }, "City"),
                        e(
                            "select",
                            {
                                id: "finder-city",
                                className: "form-select",
                                value: selectedCity,
                                onChange: onCityChange,
                                disabled: cityDisabled
                            },
                            cityOptionEls
                        )
                    ),
                    e(
                        "div",
                        { className: "col-md-4" },
                        e("label", { className: "form-label", htmlFor: "finder-pet" }, "Pet type"),
                        e(
                            "select",
                            {
                                id: "finder-pet",
                                className: "form-select",
                                value: selectedPet,
                                onChange: onPetChange
                            },
                            e("option", { value: "" }, "Choose pet…"),
                            e("option", { value: "cat" }, "Cat"),
                            e("option", { value: "dog" }, "Dog"),
                            e("option", { value: "cow" }, "Cow"),
                            e("option", { value: "rabbit" }, "Rabbit"),
                            e("option", { value: "parrot" }, "Parrot"),
                            e("option", { value: "horse" }, "Horse")
                        )
                    ),
                    e(
                        "div",
                        { className: "col-12 mt-2 text-center" },
                        e(
                            "button",
                            {
                                type: "button",
                                className: "btn btn-outline-success",
                                id: "fetch-btn",
                                onClick: fetchCaretakers
                            },
                            "Fetch Caretakers"
                        )
                    )
                )
            ),
            e(
                "div",
                { className: "container" },
                showNoResults
                    ? e(
                          "div",
                          {
                              className: "alert alert-secondary py-2 small mt-3"
                          },
                          "No caretakers found for this city and pet type. Try another city or pet, or check that caretakers have saved a profile with matching city and pets."
                      )
                    : null,
                e(
                    "div",
                    { className: "row" },
                    results.map(function (obj) {
                        return e(
                            "div",
                            { className: "col-md-3 card-group mt-4", key: obj.email },
                            e(
                                "div",
                                { className: "card" },
                                e(
                                    "div",
                                    { className: "container" },
                                    e("img", {
                                        src: /^https?:\/\//.test(obj.idproofpic || "") ? obj.idproofpic : ("uploads/" + (obj.idproofpic || "nopic.png")),
                                        className: "card-img-top mt-3",
                                        alt: ""
                                    })
                                ),
                                e(
                                    "div",
                                    { className: "card-body text-center" },
                                    e("h5", { className: "card-title" }, obj.email),
                                    e("p", { className: "card-text" }, obj.name),
                                    e("p", { className: "card-text" }, obj.mobile),
                                    e(
                                        "button",
                                        {
                                            type: "button",
                                            className: "btn btn-outline-success",
                                            onClick: function () { createBookingFor(obj.email); }
                                        },
                                        "Book Now"
                                    )
                                )
                            )
                        );
                    })
                )
            )
        );
    }

    var mount = document.getElementById("caretaker-finder-root");
    if (!mount) return;

    if (ReactDOM.createRoot) {
        ReactDOM.createRoot(mount).render(e(CaretakerFinderApp));
    } else {
        ReactDOM.render(e(CaretakerFinderApp), mount);
    }
})();
