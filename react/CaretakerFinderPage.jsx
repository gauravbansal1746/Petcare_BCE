/**
 * JSX version of the Find Caretaker page (for Vite / Create React App).
 * Deployed static app uses: public/js/caretaker-finder-react.js (no JSX, CSP-safe).
 *
 * Import mapping from ./indiaStateCities.js — keep in sync with public/js/india-state-cities-data.js
 */
import { useState, useMemo } from "react";
import { INDIA_STATE_ORDER, getCitiesForState } from "./indiaStateCities.js";

const API = process.env.REACT_APP_API_URL || "https://petcarebce-production.up.railway.app";

export default function CaretakerFinderPage() {
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPet, setSelectedPet] = useState("");
  const [results, setResults] = useState([]);
  const [showNoResults, setShowNoResults] = useState(false);

  const cityOptions = useMemo(() => getCitiesForState(selectedState), [selectedState]);

  const cityDisabled = !selectedState || cityOptions.length === 0;
  const cityPlaceholder = !selectedState
    ? "Select state first"
    : cityOptions.length === 0
      ? "No cities for this state"
      : "Choose city…";

  function onStateChange(e) {
    const v = e.target.value;
    console.log("[caretaker-finder] selected state:", v || "(empty)");
    setSelectedState(v);
    setSelectedCity("");
    setShowNoResults(false);
  }

  function onCityChange(e) {
    const v = e.target.value;
    console.log("[caretaker-finder] selected city:", v || "(empty)", "| state:", selectedState || "(empty)");
    setSelectedCity(v);
  }

  function onPetChange(e) {
    const v = e.target.value;
    console.log("[caretaker-finder] selected pet type:", v || "(empty)");
    setSelectedPet(v);
  }

  async function fetchCaretakers() {
    const city = (selectedCity && String(selectedCity).trim()) || "";
    const pet = (selectedPet && String(selectedPet).trim()) || "";
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

    const url = `${API}/api/v1/caretakers?cityforserver=${encodeURIComponent(city)}&petforserver=${encodeURIComponent(pet)}`;
    console.log("[caretaker-finder] Fetch caretakers request:", { state: selectedState, city, pet, url });

    try {
      const res = await fetch(url);
      const body = await res.json();
      console.log("[caretaker-finder] Fetch caretakers response:", {
        httpStatus: res.status,
        status: body?.status,
        count: body?.data?.length ?? 0,
        body,
      });
      if (!res.ok) {
        alert(body?.message || `Search failed (${res.status}).`);
        return;
      }
      const list = body?.data ?? [];
      setResults(list);
      setShowNoResults(list.length === 0);
    } catch (err) {
      console.error("[caretaker-finder] network / parse error:", err);
      alert("Network error — is the server running?");
    }
  }

  return (
    <>
      <div className="container">
        <div className="alert alert-info py-2 small">
          Choose the same state and city as caretakers use in their profile. Search uses <strong>city + pet</strong>{" "}
          against the database.
        </div>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label" htmlFor="finder-state">
              State
            </label>
            <select id="finder-state" className="form-select" value={selectedState} onChange={onStateChange}>
              <option value="">Choose state…</option>
              {INDIA_STATE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="finder-city">
              City
            </label>
            <select
              id="finder-city"
              className="form-select"
              value={selectedCity}
              onChange={onCityChange}
              disabled={cityDisabled}
            >
              <option value="">{cityPlaceholder}</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="finder-pet">
              Pet type
            </label>
            <select id="finder-pet" className="form-select" value={selectedPet} onChange={onPetChange}>
              <option value="">Choose pet…</option>
              <option value="cat">Cat</option>
              <option value="dog">Dog</option>
              <option value="cow">Cow</option>
              <option value="rabbit">Rabbit</option>
              <option value="parrot">Parrot</option>
              <option value="horse">Horse</option>
            </select>
          </div>
          <div className="col-12 mt-2 text-center">
            <button type="button" className="btn btn-outline-success" onClick={fetchCaretakers}>
              Fetch Caretakers
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {showNoResults && (
          <div className="alert alert-secondary py-2 small mt-3">
            No caretakers found for this city and pet type. Try another combination.
          </div>
        )}
        <div className="row">
          {results.map((obj) => (
            <div className="col-md-3 card-group mt-4" key={obj.email}>
              <div className="card">
                <div className="container">
                  <img src={`uploads/${obj.idproofpic || "nopic.png"}`} className="card-img-top mt-3" alt="" />
                </div>
                <div className="card-body text-center">
                  <h5 className="card-title">{obj.email}</h5>
                  <p className="card-text">{obj.name}</p>
                  <p className="card-text">{obj.mobile}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
