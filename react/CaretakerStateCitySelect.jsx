import { useState, useMemo, useEffect } from "react";
import { INDIA_STATE_ORDER, getCitiesForState } from "./indiaStateCities.js";

const DEBUG =
  (typeof process !== "undefined" && process.env.NODE_ENV === "development") ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV);

/**
 * Drop-in example: local useState for state + city.
 * City list updates immediately when state changes; city resets when state changes.
 */
export default function CaretakerStateCitySelect() {
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const cities = useMemo(() => getCitiesForState(state), [state]);

  // Edge case: e.g. API prefilled state that doesn't exist, or city not in list
  useEffect(() => {
    if (!state) {
      if (city) {
        if (DEBUG) console.log("[StateCity] clearing city — no state selected");
        setCity("");
      }
      return;
    }
    if (city && !cities.includes(city)) {
      if (DEBUG) console.warn("[StateCity] clearing city — not in list for", state, ":", city);
      setCity("");
    }
  }, [state, cities, city]);

  function handleStateChange(e) {
    const next = e.target.value;
    if (DEBUG) console.log("[StateCity] state →", next || "(empty)");
    setState(next);
    setCity(""); // instant reset; avoids stale city from previous state
  }

  function handleCityChange(e) {
    const next = e.target.value;
    if (DEBUG) console.log("[StateCity] city →", next || "(empty)");
    setCity(next);
  }

  const cityDisabled = !state || cities.length === 0;
  const cityPlaceholder = !state
    ? "Select state first"
    : cities.length === 0
      ? "No cities for this state"
      : "Select city";

  return (
    <div className="caretaker-location-fields" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>State</span>
        <select name="stt" value={state} onChange={handleStateChange} required>
          <option value="">Select state</option>
          {INDIA_STATE_ORDER.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>City</span>
        <select name="city" value={city} onChange={handleCityChange} disabled={cityDisabled} required={!cityDisabled}>
          <option value="">{cityPlaceholder}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {DEBUG && (
        <pre style={{ width: "100%", fontSize: 12, opacity: 0.8 }}>
          {JSON.stringify({ state, city, cityCount: cities.length }, null, 2)}
        </pre>
      )}
    </div>
  );
}

/**
 * Controlled version — use when parent owns form state (e.g. react-hook-form).
 *
 * <CaretakerStateCitySelectControlled
 *   state={stt}
 *   city={cityName}
 *   onStateChange={(s) => { setStt(s); setCityName(""); }}
 *   onCityChange={setCityName}
 * />
 */
export function CaretakerStateCitySelectControlled({ state, city, onStateChange, onCityChange, stateName = "stt", cityName = "city" }) {
  const cities = useMemo(() => getCitiesForState(state), [state]);

  function handleStateChange(e) {
    const next = e.target.value;
    if (DEBUG) console.log("[StateCity controlled] state →", next);
    onStateChange(next);
    onCityChange("");
  }

  const cityDisabled = !state || cities.length === 0;

  return (
    <div className="caretaker-location-fields" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>State</span>
        <select name={stateName} value={state} onChange={handleStateChange} required>
          <option value="">Select state</option>
          {INDIA_STATE_ORDER.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>City</span>
        <select name={cityName} value={city} onChange={(e) => onCityChange(e.target.value)} disabled={cityDisabled} required={!cityDisabled}>
          <option value="">{!state ? "Select state first" : cities.length ? "Select city" : "No cities"}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
