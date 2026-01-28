import React, { useState, useCallback, useMemo } from "react";
import Map, { Marker, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useGetPractitionersQuery } from "../../app/api/patientApiSlice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Loader2, MapPin, List, Map as MapIcon, AlertCircle, Navigation } from "lucide-react";

const TEST_TYPES = [
  { code: "TB", label: "Tuberculosis" },
  { code: "BREAST_CANCER", label: "Breast Cancer" },
];

const DEFAULT_MAP_CENTER = [20.5937, 78.9629]; // Center of India

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const Practitioners = () => {
  const { data: practitioners, isLoading, error } = useGetPractitionersQuery();
  const [viewMode, setViewMode] = useState("map"); // "map" or "list"
  const [selectedTestType, setSelectedTestType] = useState("all");
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [zoom, setZoom] = useState(4);

  // Get user location on mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setMapCenter([longitude, latitude]);
          setZoom(10);
        },
        (error) => {
          console.log("Geolocation not available:", error);
        }
      );
    }
  }, []);

  // Filter practitioners based on test type and search
  const filteredPractitioners = useMemo(() => {
    if (!practitioners) return [];

    return practitioners.filter((p) => {
      // Filter by test type
      if (selectedTestType !== "all") {
        const services = p.services_offered || [];
        if (!services.includes(selectedTestType)) {
          return false;
        }
      }

      // Filter by search location (center name or location)
      if (searchLocation) {
        const search = searchLocation.toLowerCase();
        const centerMatch = p.center_name?.toLowerCase().includes(search);
        const locationMatch = p.center_location?.toLowerCase().includes(search);
        if (!centerMatch && !locationMatch) {
          return false;
        }
      }

      return true;
    });
  }, [practitioners, selectedTestType, searchLocation]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getDistance = (practitioner) => {
    if (!userLocation || !practitioner.latitude || !practitioner.longitude) {
      return null;
    }
    return calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      practitioner.latitude,
      practitioner.longitude
    );
  };

  const openGoogleDirections = (practitioner) => {
    if (practitioner.latitude && practitioner.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${practitioner.latitude},${practitioner.longitude}`;
      window.open(url, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load diagnostic centers. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Diagnostic Centers Discovery
          </CardTitle>
          <CardDescription>
            Find nearby diagnostic centers offering the services you need
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Test Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="test-type">Filter by Test Type</Label>
              <Select value={selectedTestType} onValueChange={setSelectedTestType}>
                <SelectTrigger id="test-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Test Types</SelectItem>
                  {TEST_TYPES.map((test) => (
                    <SelectItem key={test.code} value={test.code}>
                      {test.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Search */}
            <div className="space-y-2">
              <Label htmlFor="location">Search Location</Label>
              <Input
                id="location"
                placeholder="Center name or location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>

            {/* View Toggle */}
            <div className="space-y-2">
              <Label>View Mode</Label>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("map")}
                  className="flex-1 gap-2"
                >
                  <MapIcon className="h-4 w-4" />
                  Map
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="flex-1 gap-2"
                >
                  <List className="h-4 w-4" />
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredPractitioners.length} of {practitioners?.length || 0} centers
          </p>
        </CardContent>
      </Card>

      {/* Map View */}
      {viewMode === "map" && (
        <Card className="overflow-hidden h-[500px] md:h-[600px]">
          {filteredPractitioners.some((p) => p.latitude && p.longitude) ? (
            <Map
              initialViewState={{
                longitude: mapCenter[0],
                latitude: mapCenter[1],
                zoom: zoom,
              }}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              {/* User location marker */}
              {userLocation && (
                <Marker
                  longitude={userLocation.longitude}
                  latitude={userLocation.latitude}
                  color="#3b82f6"
                  scale={1.2}
                />
              )}

              {/* Practitioner markers */}
              {filteredPractitioners.map((practitioner) => {
                if (!practitioner.latitude || !practitioner.longitude) return null;

                return (
                  <Marker
                    key={practitioner.id}
                    longitude={practitioner.longitude}
                    latitude={practitioner.latitude}
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      setSelectedMarker(practitioner);
                    }}
                  />
                );
              })}

              {/* Selected marker popup */}
              {selectedMarker && (
                <Popup
                  longitude={selectedMarker.longitude}
                  latitude={selectedMarker.latitude}
                  onClose={() => setSelectedMarker(null)}
                  closeButton
                  closeOnClick
                  maxWidth="280px"
                >
                  <div className="space-y-2 overflow-hidden">
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-bold text-sm word-break overflow-ellipsis" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{selectedMarker.center_name}</h4>
                      <p className="text-xs text-muted-foreground" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{selectedMarker.center_location}</p>
                    </div>

                    {/* Services */}
                    {selectedMarker.services_offered && selectedMarker.services_offered.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Services:</p>
                        <div className="flex flex-wrap gap-1 overflow-hidden">
                          {selectedMarker.services_offered.map((service) => (
                            <Badge key={service} variant="outline" className="text-xs whitespace-nowrap flex-shrink-0">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Distance */}
                    {getDistance(selectedMarker) && (
                      <p className="text-xs text-muted-foreground">
                        📍 {getDistance(selectedMarker).toFixed(1)} km away
                      </p>
                    )}

                    {/* Get Directions Button */}
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => openGoogleDirections(selectedMarker)}
                    >
                      <Navigation className="h-3 w-3" />
                      Get Directions
                    </Button>
                  </div>
                </Popup>
              )}
            </Map>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Alert className="w-3/4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No location data</AlertTitle>
                <AlertDescription>
                  The filtered centers don't have location coordinates available. Try a different filter.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </Card>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPractitioners.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-semibold">No centers found</p>
              <p className="text-sm">Try adjusting your search filters</p>
            </div>
          ) : (
            filteredPractitioners.map((practitioner) => (
              <Card key={practitioner.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{practitioner.center_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{practitioner.center_location}</p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Services */}
                  {practitioner.services_offered && practitioner.services_offered.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2">Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {practitioner.services_offered.map((service) => (
                          <Badge key={service} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Distance */}
                  {getDistance(practitioner) && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        📍 {getDistance(practitioner).toFixed(1)} km away
                      </p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => openGoogleDirections(practitioner)}
                    >
                      <Navigation className="h-3 w-3" />
                      Directions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => {
                        setViewMode("map");
                        setSelectedMarker(practitioner);
                        if (practitioner.latitude && practitioner.longitude) {
                          setMapCenter([practitioner.longitude, practitioner.latitude]);
                          setZoom(12);
                        }
                      }}
                    >
                      <MapIcon className="h-3 w-3" />
                      View Map
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Practitioners;
