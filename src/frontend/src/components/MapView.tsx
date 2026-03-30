import L from "leaflet";
import { useEffect, useRef } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { Bus, Route, Stop } from "../ridewatch-types";

const VIT_CENTER: [number, number] = [12.9698, 79.1587];

function createBusIcon(color: string) {
  return L.divIcon({
    html: `<div style="position:relative;width:36px;height:36px">
      <div style="width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 0 14px ${color}88,0 3px 10px rgba(0,0,0,0.5);border:3px solid rgba(255,255,255,0.85);">
        \ud83d\ude8c
      </div>
      <div style="position:absolute;top:-2px;right:-2px;width:11px;height:11px;border-radius:50%;background:#22c55e;border:2.5px solid #0f1629;box-shadow:0 0 7px #22c55e;"></div>
    </div>`,
    className: "bus-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
}

function createStopIcon(selected: boolean) {
  const size = selected ? 24 : 18;
  const bg = selected ? "#f59e0b" : "#fbbf24";
  const border = selected ? "white" : "#1a2341";
  const glow = selected
    ? "0 0 14px #f59e0b, 0 2px 6px rgba(0,0,0,0.4)"
    : "0 2px 6px rgba(0,0,0,0.3)";
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:3px solid ${border};box-shadow:${glow};"></div>`,
    className: "stop-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -14],
  });
}

interface MapControllerProps {
  selectedId: string | null;
  lat: number;
  lng: number;
}

function MapController({ selectedId, lat, lng }: MapControllerProps) {
  const map = useMap();
  const prevIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedId && selectedId !== prevIdRef.current) {
      prevIdRef.current = selectedId;
      map.flyTo([lat, lng], 17, { duration: 1.2, easeLinearity: 0.5 });
    } else if (!selectedId) {
      prevIdRef.current = null;
    }
  }, [selectedId, lat, lng, map]);
  return null;
}

interface MapViewProps {
  buses: Bus[];
  stops: Stop[];
  routes: Route[];
  selectedBus: Bus | null;
  selectedStop: Stop | null;
  onBusClick: (bus: Bus) => void;
  onStopClick: (stop: Stop) => void;
}

export default function MapView({
  buses,
  stops,
  routes,
  selectedBus,
  selectedStop,
  onBusClick,
  onStopClick,
}: MapViewProps) {
  const getRouteColor = (routeId: string) =>
    routes.find((r) => r.id === routeId)?.color ?? "#0ea5e9";
  const getRouteName = (routeId: string) =>
    routes.find((r) => r.id === routeId)?.name ?? routeId;
  const selectedId = selectedBus?.id ?? selectedStop?.id ?? null;
  const selectedLat = selectedBus?.lat ?? selectedStop?.lat ?? VIT_CENTER[0];
  const selectedLng = selectedBus?.lng ?? selectedStop?.lng ?? VIT_CENTER[1];

  return (
    <MapContainer
      center={VIT_CENTER}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
      zoomControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController
        selectedId={selectedId}
        lat={selectedLat}
        lng={selectedLng}
      />

      {stops.map((stop) => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={createStopIcon(selectedStop?.id === stop.id)}
          eventHandlers={{ click: () => onStopClick(stop) }}
        >
          <Tooltip direction="top" offset={[0, -12]}>
            {stop.name}
          </Tooltip>
          <Popup>
            <strong>📍 {stop.name}</strong>
            <br />
            <small style={{ color: "#888" }}>{stop.description}</small>
          </Popup>
        </Marker>
      ))}

      {buses
        .filter((b) => b.isActive)
        .map((bus) => (
          <Marker
            key={bus.id}
            position={[bus.lat, bus.lng]}
            icon={createBusIcon(getRouteColor(bus.routeId))}
            eventHandlers={{ click: () => onBusClick(bus) }}
            zIndexOffset={1000}
          >
            <Popup>
              <div style={{ minWidth: 130 }}>
                <strong>🚌 {bus.name}</strong>
                <br />
                <span style={{ color: "#888", fontSize: "0.85em" }}>
                  {getRouteName(bus.routeId)}
                </span>
                <br />
                <span style={{ fontSize: "0.85em" }}>
                  Speed: {Math.round(bus.speed)} km/h
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
