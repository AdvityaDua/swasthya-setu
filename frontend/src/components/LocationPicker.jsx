import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";
const DEFAULT_CENTER = { longitude: 77.209, latitude: 28.6139 }; // New Delhi
const DEFAULT_ZOOM = 10;
const GEOCODING_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";
const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/**
 * Location picker using Mapbox. User can search for places or click on map to set a marker;
 * latitude/longitude are passed to onChange. Expects VITE_MAPBOX_ACCESS_TOKEN in .env.
 */
export function LocationPicker({ latitude, longitude, onChange, className, height = "240px" }) {
  const mapRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const hasMarker = latitude != null && longitude != null && !Number.isNaN(Number(latitude)) && !Number.isNaN(Number(longitude));

  const initialViewState = useMemo(
    () => ({
      longitude: hasMarker ? Number(longitude) : DEFAULT_CENTER.longitude,
      latitude: hasMarker ? Number(latitude) : DEFAULT_CENTER.latitude,
      zoom: DEFAULT_ZOOM,
    }),
    [hasMarker, latitude, longitude]
  );

  const fetchPlaces = useCallback(
    async (query) => {
      if (!MAPBOX_TOKEN || !query || query.length < MIN_QUERY_LENGTH) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const url = `${GEOCODING_URL}/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5&proximity=77.2,28.6`;
        const res = await fetch(url);
        const data = await res.json();
        setSearchResults(Array.isArray(data?.features) ? data.features : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const t = setTimeout(() => fetchPlaces(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery, fetchPlaces]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPlace = useCallback(
    (feature) => {
      const coords = feature?.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return;
      const [lng, lat] = coords;
      if (typeof onChange === "function") onChange(lat, lng);
      setSearchQuery(feature.place_name ?? "");
      setSearchResults([]);
      setShowDropdown(false);
      const map = mapRef?.current?.getMap?.();
      if (map && typeof map.flyTo === "function") {
        map.flyTo({ center: [lng, lat], zoom: 14, duration: 800 });
      }
    },
    [onChange]
  );

  const handleClick = useCallback(
    (evt) => {
      const lngLat = evt.lngLat;
      const lng = typeof lngLat?.lng === "number" ? lngLat.lng : Array.isArray(lngLat) ? lngLat[0] : null;
      const lat = typeof lngLat?.lat === "number" ? lngLat.lat : Array.isArray(lngLat) ? lngLat[1] : null;
      if (lat != null && lng != null && typeof onChange === "function") {
        onChange(lat, lng);
      }
    },
    [onChange]
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={cn(
          "rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 flex items-center justify-center text-amber-800 dark:text-amber-200 text-sm",
          className
        )}
        style={{ height }}
      >
        Add VITE_MAPBOX_ACCESS_TOKEN to .env to enable the map.
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border border-input overflow-hidden", className)}>
      <div className="relative border-b border-input bg-muted/30 p-2" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for a place..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            className="pl-8 h-9"
          />
        </div>
        {showDropdown && (searchQuery.trim().length >= MIN_QUERY_LENGTH || searchResults.length > 0) && (
          <ul
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-md border border-input bg-background py-1 shadow-md"
            style={{ minHeight: searchLoading ? "48px" : undefined }}
          >
            {searchLoading ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>
            ) : searchResults.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                {searchQuery.trim().length < MIN_QUERY_LENGTH ? "Type at least 2 characters" : "No places found"}
              </li>
            ) : (
              searchResults.map((f) => (
                <li
                  key={f.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none"
                  onClick={() => handleSelectPlace(f)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectPlace(f);
                    }
                  }}
                >
                  {f.place_name}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      <div style={{ height }}>
        <Map
          ref={mapRef}
          initialViewState={initialViewState}
          onClick={handleClick}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: "100%", height: "100%" }}
          cursor="crosshair"
        >
          {hasMarker && (
            <Marker longitude={Number(longitude)} latitude={Number(latitude)} />
          )}
        </Map>
      </div>
    </div>
  );
}

export default LocationPicker;
