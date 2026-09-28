// Reverse geocoding turns (lat, lng) into a city/area name.
// WORKORA never requires this to function — if no provider key is set, the
// backend just stores lat/lng and asks the user to type their city.
//
// To enable it: pick a provider (Google Geocoding API, OpenCage, Mapbox all
// work) and fill in the fetch call below using GEOCODING_API_KEY.
async function reverseGeocode(lat, lng) {
  const key = process.env.GEOCODING_API_KEY;
  if (!key) return null;

  try {
    // Example using OpenCage — swap for your provider of choice.
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${key}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const comp = data?.results?.[0]?.components;
    if (!comp) return null;
    return {
      city: comp.city || comp.town || comp.village || comp.state_district || null,
      area: comp.suburb || comp.neighbourhood || null,
      state: comp.state || null,
    };
  } catch (err) {
    console.error("reverseGeocode failed:", err.message);
    return null;
  }
}

module.exports = { reverseGeocode };
