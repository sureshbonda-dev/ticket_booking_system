export default function CityPicker({ cities, value, onChange, disabled = false }) {
  return (
    <label className="city-picker">
      <span className="city-picker__label">YOUR CITY</span>
      <span className="city-picker__control">
        <span aria-hidden="true" className="city-picker__pin">⌖</span>
        <select
          aria-label="Choose your city"
          value={value}
          disabled={disabled || cities.length === 0}
          onChange={(event) => onChange(event.target.value)}
        >
          {cities.length === 0 && <option value="">No cities available</option>}
          {cities.map((city) => <option key={city} value={city}>{city}</option>)}
        </select>
        <span aria-hidden="true" className="city-picker__chevron">⌄</span>
      </span>
    </label>
  );
}
