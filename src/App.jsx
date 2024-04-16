import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapWithSearch = () => {
  const [origin, searchOrigin] = useState("");
  const [destination, searchDestination] = useState("");
  const [actualOrigin, setActualOrigin] = useState([11.0813583, 39.7408732]);
  const [actualDestination, setActualDestination] = useState([
    11.0813583, 39.7408732,
  ]);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [route, setRoute] = useState(null);

  useEffect(() => {
    if (origin) {
      geocode(origin).then(setOriginSuggestions);
    }
  }, [origin]);

  useEffect(() => {
    if (destination) {
      geocode(destination).then(setDestinationSuggestions);
    }
  }, [destination]);

  const mapRef = useRef(null); // Create a ref to store the map instance

  function handleOrigin(suggestion) {
    setActualOrigin([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
    mapRef.current.setView(actualOrigin, 13);
  }

  function handleDestination(suggestion) {
    setActualDestination([
      parseFloat(suggestion.lat),
      parseFloat(suggestion.lon),
    ]);
    mapRef.current.setView(actualDestination, 13);
  }

  const API_KEY = "f90e5c88-fb4f-4457-ad74-dcb99623c70f";

  const geocode = async (query) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
    );
    const data = await response.json();
    return data;
  };

  async function fetchRoute(origin, destination) {
    const response = await fetch(
      `https://graphhopper.com/api/1/route?point=${origin[0]},${origin[1]}&point=${destination[0]},${destination[1]}&key=${API_KEY}`
    );
    const data = await response.json();
    console.log("Response : ", data);
    if (data.paths && data.paths.length > 0) {
      const encodedPoints = data.paths[0].points;
      const decodedPoints = decodePolyline(encodedPoints);
      console.log("Decoded Points : ", decodedPoints);
      setRoute(decodedPoints);
      return decodedPoints;
    }
    return null;
  }

  // Function to decode polyline points
  function decodePolyline(encoded) {
    const poly = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      const latlng = [lat * 1e-5, lng * 1e-5];
      poly.push(latlng);
    }
    return poly;
  }

  return (
    <div className="p-8 grid h-screen gap-x-6 grid-cols-12 ">
      <div className="space-y-6 col-span-3">
        <div className="relative">
          <input
            className="border px-5 py-2 rounded-lg border-gray-700 focus:outline-none focus:ring-0"
            type="text"
            value={origin}
            onChange={(e) => searchOrigin(e.target.value)}
            placeholder="Enter Origin"
          />
          <div className="suggestions-container">
            {originSuggestions.map((suggestion, index) => (
              <div
                className="suggestion"
                key={index}
                onClick={() => handleOrigin(suggestion)}
              >
                {suggestion.display_name}
              </div>
            ))}
          </div>
        </div>
        <div>
          <input
            className="border px-5 py-2 rounded-lg border-gray-700 focus:outline-none focus:ring-0"
            type="text"
            value={destination}
            onChange={(e) => searchDestination(e.target.value)}
            placeholder="Enter Destination"
          />
          <div className="suggestions-container">
            {destinationSuggestions.map((suggestion, index) => (
              <div
                className="suggestion"
                key={index}
                onClick={() => handleDestination(suggestion)}
              >
                {suggestion.display_name}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => fetchRoute(actualOrigin, actualDestination)}
          type="button"
          className="h-fit bg-yellow-500 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-0"
        >
          Get Route
        </button>
      </div>
      <div className="col-span-9 h-full bg-black">
        <MapContainer
          center={actualOrigin}
          zoom={13}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {actualOrigin && <Marker position={actualOrigin} />}
          {actualDestination && <Marker position={actualDestination} />}
          {route && route.length > 0 && <Polyline positions={route} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapWithSearch;
