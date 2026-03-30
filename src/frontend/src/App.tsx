import { useCallback, useEffect, useRef, useState } from "react";
import AdminDashboard from "./components/AdminDashboard";
import MapView from "./components/MapView";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import type {
  Bus,
  CrowdReport,
  RideWatchActor,
  Route,
  Stop,
} from "./ridewatch-types";
import { CrowdReportType } from "./ridewatch-types";

const CAMPUS_CENTER = { lat: 12.9698, lng: 79.1587 };

const DEMO_STOPS: Stop[] = [
  {
    id: "main-gate",
    name: "Main Gate",
    lat: 12.9682,
    lng: 79.1583,
    description: "Main entrance of VIT Vellore",
  },
  {
    id: "tech-tower",
    name: "Tech Tower",
    lat: 12.971,
    lng: 79.159,
    description: "Academic blocks area",
  },
  {
    id: "anna-auditorium",
    name: "Anna Auditorium",
    lat: 12.9695,
    lng: 79.1578,
    description: "Anna Auditorium venue",
  },
  {
    id: "hostels-abc",
    name: "Hostel Blocks A/B/C",
    lat: 12.972,
    lng: 79.16,
    description: "Residential hostel blocks",
  },
  {
    id: "library",
    name: "Central Library",
    lat: 12.9705,
    lng: 79.157,
    description: "VIT Central Library",
  },
  {
    id: "silver-jubilee",
    name: "Silver Jubilee Tower",
    lat: 12.9698,
    lng: 79.1595,
    description: "Iconic campus landmark",
  },
  {
    id: "sports-complex",
    name: "Sports Complex",
    lat: 12.968,
    lng: 79.161,
    description: "Sports & recreation",
  },
  {
    id: "medical-center",
    name: "Medical Center",
    lat: 12.9715,
    lng: 79.1575,
    description: "Campus health center",
  },
];

const DEMO_ROUTES: Route[] = [
  {
    id: "route-1",
    name: "Campus Loop",
    stopIds: [
      "main-gate",
      "anna-auditorium",
      "library",
      "tech-tower",
      "silver-jubilee",
      "hostels-abc",
      "sports-complex",
      "medical-center",
    ],
    color: "#0ea5e9",
  },
  {
    id: "route-2",
    name: "Hostel Express",
    stopIds: ["main-gate", "tech-tower", "hostels-abc"],
    color: "#06d6a0",
  },
  {
    id: "route-3",
    name: "Academic Ring",
    stopIds: ["main-gate", "anna-auditorium", "library", "medical-center"],
    color: "#f59e0b",
  },
];

const DEMO_BUSES_INIT: Bus[] = [
  {
    id: "bus-1",
    name: "Shuttle 01",
    routeId: "route-1",
    lat: 12.9682,
    lng: 79.1583,
    speed: 22,
    heading: 45,
    isActive: true,
    lastUpdate: BigInt(Date.now()),
    driver: "Rajan Kumar",
  },
  {
    id: "bus-2",
    name: "Shuttle 02",
    routeId: "route-1",
    lat: 12.971,
    lng: 79.159,
    speed: 18,
    heading: 180,
    isActive: true,
    lastUpdate: BigInt(Date.now()),
    driver: "Suresh Babu",
  },
  {
    id: "bus-3",
    name: "Shuttle 03",
    routeId: "route-2",
    lat: 12.972,
    lng: 79.16,
    speed: 25,
    heading: 270,
    isActive: true,
    lastUpdate: BigInt(Date.now()),
    driver: "Priya Devi",
  },
  {
    id: "bus-4",
    name: "Shuttle 04",
    routeId: "route-3",
    lat: 12.9695,
    lng: 79.1578,
    speed: 0,
    heading: 0,
    isActive: false,
    lastUpdate: BigInt(Date.now()),
    driver: "Arjun Nair",
  },
];

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateETA(bus: Bus, stop: Stop): string {
  const dist = haversineDistance(bus.lat, bus.lng, stop.lat, stop.lng);
  const speed = bus.speed > 0 ? bus.speed : 20;
  const minutes = (dist / speed) * 60;
  if (minutes < 1) return "<1 min";
  return `~${Math.round(minutes)} min`;
}

export function timeAgo(timestamp: bigint): string {
  const seconds = Math.floor((Date.now() - Number(timestamp)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

type TabType = "map" | "stops" | "admin";

export default function App() {
  const { actor: rawActor } = useActor();
  const actor = rawActor as unknown as RideWatchActor | null;
  const { identity, login, clear } = useInternetIdentity();
  const [activeTab, setActiveTab] = useState<TabType>("map");
  const [buses, setBuses] = useState<Bus[]>(DEMO_BUSES_INIT);
  const [stops, setStops] = useState<Stop[]>(DEMO_STOPS);
  const [routes, setRoutes] = useState<Route[]>(DEMO_ROUTES);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [recentReports, setRecentReports] = useState<CrowdReport[]>([]);
  const [stopReports, setStopReports] = useState<CrowdReport[]>([]);
  const [stopRating, setStopRating] = useState(0);
  const [reportType, setReportType] = useState<CrowdReportType>(
    CrowdReportType.arrival,
  );
  const [selectedBusForReport, setSelectedBusForReport] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const tickRef = useRef(0);
  const gpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("gps_consent_shown")) setShowGPSModal(true);
  }, []);

  useEffect(() => {
    if (!actor) return;
    actor
      .getStops()
      .then((s) => {
        if (s.length > 0) setStops(s);
      })
      .catch(() => {});
    actor
      .getRoutes()
      .then((r) => {
        if (r.length > 0) setRoutes(r);
      })
      .catch(() => {});
    actor
      .isCallerAdmin()
      .then(setIsAdmin)
      .catch(() => {});
    actor
      .getRecentCrowdReports()
      .then(setRecentReports)
      .catch(() => {});
  }, [actor]);

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;
      const simulateBuses = (prev: Bus[]) =>
        prev.map((bus, i) => {
          if (!bus.isActive) return bus;
          const angle = tick * 0.07 + i * 2.094;
          const radius = 0.0035 + i * 0.0012;
          return {
            ...bus,
            lat: CAMPUS_CENTER.lat + Math.sin(angle) * radius,
            lng: CAMPUS_CENTER.lng + Math.cos(angle) * radius,
            speed: Math.round(14 + Math.abs(Math.sin(tick * 0.15 + i)) * 14),
            heading: ((angle * 180) / Math.PI + 90) % 360,
            lastUpdate: BigInt(Date.now()),
          };
        });
      if (actor) {
        actor
          .getAllBuses()
          .then((b) => {
            if (b.length > 0) setBuses(b);
            else setBuses(simulateBuses);
          })
          .catch(() => setBuses(simulateBuses));
      } else {
        setBuses(simulateBuses);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [actor]);

  useEffect(() => {
    if (!selectedStop || !actor) return;
    actor
      .getCrowdReportsByStop(selectedStop.id)
      .then(setStopReports)
      .catch(() => {});
    actor
      .getAverageRating(selectedStop.id)
      .then(setStopRating)
      .catch(() => {});
  }, [selectedStop, actor]);

  const handleSelectStop = useCallback((stop: Stop) => {
    setSelectedStop(stop);
    setSelectedBus(null);
    setActiveTab("map");
  }, []);

  const handleSubmitReport = useCallback(async () => {
    if (!actor || !selectedStop || !identity) return;
    setIsSubmittingReport(true);
    try {
      await actor.submitCrowdReport(
        selectedStop.id,
        reportType,
        selectedBusForReport || buses[0]?.id || "",
      );
      const reports = await actor.getCrowdReportsByStop(selectedStop.id);
      setStopReports(reports);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReport(false);
    }
  }, [actor, selectedStop, identity, reportType, selectedBusForReport, buses]);

  const handleSubmitFeedback = useCallback(async () => {
    if (!actor || !selectedStop || !identity) return;
    setIsSubmittingFeedback(true);
    try {
      await actor.submitFeedback(
        selectedStop.id,
        BigInt(feedbackRating),
        feedbackComment,
      );
      const rating = await actor.getAverageRating(selectedStop.id);
      setStopRating(rating);
      setFeedbackComment("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingFeedback(false);
    }
  }, [actor, selectedStop, identity, feedbackRating, feedbackComment]);

  const handleGPSConsent = useCallback(
    (consent: boolean) => {
      localStorage.setItem("gps_consent_shown", "true");
      localStorage.setItem("gps_consent", consent ? "true" : "false");
      setShowGPSModal(false);
      if (consent && navigator.geolocation && actor) {
        gpsIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition((pos) => {
            actor
              .submitAnonymousGPS(pos.coords.latitude, pos.coords.longitude)
              .catch(() => {});
          });
        }, 30000);
      }
    },
    [actor],
  );

  useEffect(() => {
    return () => {
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    };
  }, []);

  const getRouteColor = (routeId: string) =>
    routes.find((r) => r.id === routeId)?.color ?? "#0ea5e9";
  const getRouteName = (routeId: string) =>
    routes.find((r) => r.id === routeId)?.name ?? routeId;
  const activeBuses = buses.filter((b) => b.isActive);

  const s: Record<string, React.CSSProperties> = {
    root: {
      height: "100vh",
      background: "#0f1629",
      color: "#e8eaf6",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    header: {
      background: "#0d1423",
      borderBottom: "1px solid #1e2d4a",
      padding: "0.6rem 1.25rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
    },
    nav: {
      background: "#0d1423",
      borderBottom: "1px solid #1e2d4a",
      display: "flex",
      padding: "0 1rem",
      flexShrink: 0,
    },
    main: { flex: 1, display: "flex", overflow: "hidden" },
    sidebar: {
      width: "290px",
      flexShrink: 0,
      background: "#111827",
      borderRight: "1px solid #1e2d4a",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
    },
    mapWrap: { flex: 1, minWidth: 0 },
    card: {
      background: "#1a2341",
      borderRadius: "10px",
      border: "1px solid #1e2d4a",
    },
    badge: {
      padding: "0.15rem 0.5rem",
      borderRadius: "999px",
      fontSize: "0.7rem",
      fontWeight: 700,
    },
    btn: {
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
      fontWeight: 600,
    },
    input: {
      width: "100%",
      padding: "0.45rem 0.6rem",
      borderRadius: "6px",
      border: "1px solid #1e2d4a",
      background: "#1a2341",
      color: "#e8eaf6",
      fontSize: "0.82rem",
    },
  };

  return (
    <div style={s.root}>
      {/* GPS Consent Modal */}
      {showGPSModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#1a2341",
              borderRadius: "14px",
              padding: "2rem",
              maxWidth: "380px",
              width: "100%",
              border: "1px solid #2a3a5e",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                fontSize: "2.5rem",
                textAlign: "center",
                marginBottom: "0.75rem",
              }}
            >
              📍
            </div>
            <h3
              style={{
                margin: "0 0 0.6rem",
                textAlign: "center",
                color: "#e8eaf6",
                fontSize: "1.1rem",
              }}
            >
              Help Improve Tracking
            </h3>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "0.875rem",
                textAlign: "center",
                lineHeight: 1.6,
                margin: "0 0 1.5rem",
              }}
            >
              Share your anonymous location while riding to improve shuttle
              tracking accuracy. Your data is never linked to your identity.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => handleGPSConsent(false)}
                style={{
                  flex: 1,
                  padding: "0.65rem",
                  ...s.btn,
                  background: "transparent",
                  border: "1px solid #2a3a5e",
                  color: "#94a3b8",
                  fontWeight: 400,
                }}
              >
                No Thanks
              </button>
              <button
                type="button"
                onClick={() => handleGPSConsent(true)}
                style={{
                  flex: 1,
                  padding: "0.65rem",
                  ...s.btn,
                  background: "#0ea5e9",
                  color: "#fff",
                }}
              >
                Yes, Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={s.header}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🚌</span>
            <span
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                letterSpacing: "-0.5px",
              }}
            >
              RideWatch
            </span>
            <span
              style={{ ...s.badge, background: "#0ea5e933", color: "#0ea5e9" }}
            >
              LIVE
            </span>
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "#475569",
              marginTop: "0.1rem",
            }}
          >
            VIT University · Vellore 632014
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22c55e",
                display: "inline-block",
                boxShadow: "0 0 6px #22c55e",
              }}
            />
            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
              {activeBuses.length} Active
            </span>
          </div>
          {identity ? (
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              {isAdmin && (
                <span
                  style={{
                    ...s.badge,
                    background: "#7c3aed33",
                    color: "#a78bfa",
                  }}
                >
                  ADMIN
                </span>
              )}
              <button
                type="button"
                onClick={clear}
                style={{
                  padding: "0.35rem 0.8rem",
                  ...s.btn,
                  background: "transparent",
                  border: "1px solid #2a3a5e",
                  color: "#94a3b8",
                  fontWeight: 400,
                  fontSize: "0.78rem",
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={login}
              style={{
                padding: "0.35rem 0.9rem",
                ...s.btn,
                background: "#0ea5e9",
                color: "#fff",
                fontSize: "0.78rem",
              }}
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* Nav */}
      <nav style={s.nav}>
        {(["map", "stops", ...(isAdmin ? ["admin"] : [])] as TabType[]).map(
          (tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.6rem 1rem",
                border: "none",
                background: "transparent",
                color: activeTab === tab ? "#0ea5e9" : "#64748b",
                borderBottom: `2px solid ${activeTab === tab ? "#0ea5e9" : "transparent"}`,
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: activeTab === tab ? 700 : 400,
                transition: "all 0.15s",
              }}
            >
              {tab === "map"
                ? "🗺 Map"
                : tab === "stops"
                  ? "📍 Stops"
                  : "⚙ Admin"}
            </button>
          ),
        )}
      </nav>

      {/* Main */}
      <main style={s.main}>
        {/* MAP TAB */}
        {activeTab === "map" && (
          <>
            {/* Sidebar */}
            <div style={s.sidebar}>
              {/* Bus Detail Panel */}
              {selectedBus && (
                <div
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid #1e2d4a",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                      🚌 {selectedBus.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedBus(null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                        fontSize: "1.1rem",
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.4rem",
                      marginBottom: "0.75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        ...s.badge,
                        background: `${getRouteColor(selectedBus.routeId)}22`,
                        color: getRouteColor(selectedBus.routeId),
                      }}
                    >
                      {getRouteName(selectedBus.routeId)}
                    </span>
                    <span
                      style={{
                        ...s.badge,
                        background: selectedBus.isActive
                          ? "#14532d"
                          : "#7f1d1d",
                        color: selectedBus.isActive ? "#22c55e" : "#ef4444",
                      }}
                    >
                      {selectedBus.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.5rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        ...s.card,
                        padding: "0.6rem",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.35rem",
                          fontWeight: 800,
                          color: "#0ea5e9",
                        }}
                      >
                        {Math.round(selectedBus.speed)}
                      </div>
                      <div
                        style={{
                          fontSize: "0.65rem",
                          color: "#64748b",
                          marginTop: "0.1rem",
                        }}
                      >
                        km/h
                      </div>
                    </div>
                    <div
                      style={{
                        ...s.card,
                        padding: "0.6rem",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.35rem",
                          fontWeight: 800,
                          color: "#0ea5e9",
                        }}
                      >
                        {Math.round(selectedBus.heading)}°
                      </div>
                      <div
                        style={{
                          fontSize: "0.65rem",
                          color: "#64748b",
                          marginTop: "0.1rem",
                        }}
                      >
                        Heading
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      ...s.card,
                      padding: "0.75rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#64748b",
                        marginBottom: "0.5rem",
                        fontWeight: 600,
                      }}
                    >
                      ETA TO STOPS
                    </div>
                    {stops.slice(0, 5).map((stop) => (
                      <div
                        key={stop.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "0.28rem 0",
                          borderBottom: "1px solid #1e2d4a",
                          fontSize: "0.78rem",
                        }}
                      >
                        <span style={{ color: "#94a3b8" }}>{stop.name}</span>
                        <span style={{ color: "#22c55e", fontWeight: 600 }}>
                          {calculateETA(selectedBus, stop)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#475569" }}>
                    Updated {timeAgo(selectedBus.lastUpdate)} ·{" "}
                    {selectedBus.driver}
                  </div>
                </div>
              )}

              {/* Stop Detail Panel */}
              {selectedStop && !selectedBus && (
                <div
                  style={{
                    padding: "1rem",
                    borderBottom: "1px solid #1e2d4a",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                      📍 {selectedStop.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedStop(null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                        fontSize: "1.1rem",
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "0.78rem",
                      margin: "0 0 0.75rem",
                    }}
                  >
                    {selectedStop.description}
                  </p>
                  {stopRating > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        marginBottom: "0.6rem",
                      }}
                    >
                      <span style={{ color: "#fbbf24", fontSize: "0.85rem" }}>
                        {"★".repeat(Math.round(stopRating))}
                        {"☆".repeat(5 - Math.round(stopRating))}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        {stopRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#64748b",
                        marginBottom: "0.4rem",
                        fontWeight: 600,
                      }}
                    >
                      UPCOMING BUSES
                    </div>
                    {activeBuses.length === 0 ? (
                      <div style={{ color: "#475569", fontSize: "0.8rem" }}>
                        No active buses
                      </div>
                    ) : (
                      activeBuses.map((bus) => (
                        <div
                          key={bus.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.35rem 0.5rem",
                            background: "#1a2341",
                            borderRadius: "6px",
                            marginBottom: "0.2rem",
                          }}
                        >
                          <div>
                            <div
                              style={{ fontSize: "0.78rem", fontWeight: 600 }}
                            >
                              {bus.name}
                            </div>
                            <div
                              style={{ fontSize: "0.65rem", color: "#64748b" }}
                            >
                              {getRouteName(bus.routeId)}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              color: "#22c55e",
                            }}
                          >
                            {calculateETA(bus, selectedStop)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  {stopReports.length > 0 && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#64748b",
                          marginBottom: "0.4rem",
                          fontWeight: 600,
                        }}
                      >
                        RECENT REPORTS
                      </div>
                      {stopReports.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          style={{
                            padding: "0.3rem 0.5rem",
                            background: "#1a2341",
                            borderRadius: "6px",
                            marginBottom: "0.2rem",
                            fontSize: "0.75rem",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              color:
                                r.reportType === CrowdReportType.arrival
                                  ? "#22c55e"
                                  : "#f97316",
                            }}
                          >
                            {r.reportType === CrowdReportType.arrival
                              ? "🟢 Arrived"
                              : "🟠 Departed"}
                          </span>
                          <span style={{ color: "#475569" }}>
                            {timeAgo(r.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {identity ? (
                    <div
                      style={{
                        borderTop: "1px solid #1e2d4a",
                        paddingTop: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#64748b",
                          marginBottom: "0.4rem",
                          fontWeight: 600,
                        }}
                      >
                        SUBMIT REPORT
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.4rem",
                          marginBottom: "0.4rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setReportType(CrowdReportType.arrival)}
                          style={{
                            flex: 1,
                            padding: "0.35rem",
                            ...s.btn,
                            border: `1px solid ${reportType === CrowdReportType.arrival ? "#22c55e" : "#1e2d4a"}`,
                            background:
                              reportType === CrowdReportType.arrival
                                ? "#14532d"
                                : "transparent",
                            color:
                              reportType === CrowdReportType.arrival
                                ? "#22c55e"
                                : "#94a3b8",
                            fontSize: "0.73rem",
                          }}
                        >
                          Arrived
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReportType(CrowdReportType.departure)
                          }
                          style={{
                            flex: 1,
                            padding: "0.35rem",
                            ...s.btn,
                            border: `1px solid ${reportType === CrowdReportType.departure ? "#f97316" : "#1e2d4a"}`,
                            background:
                              reportType === CrowdReportType.departure
                                ? "#431407"
                                : "transparent",
                            color:
                              reportType === CrowdReportType.departure
                                ? "#f97316"
                                : "#94a3b8",
                            fontSize: "0.73rem",
                          }}
                        >
                          Departed
                        </button>
                      </div>
                      <select
                        value={selectedBusForReport}
                        onChange={(e) =>
                          setSelectedBusForReport(e.target.value)
                        }
                        style={{ ...s.input, marginBottom: "0.4rem" }}
                      >
                        <option value="">Select bus (optional)</option>
                        {buses.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleSubmitReport}
                        disabled={isSubmittingReport}
                        style={{
                          width: "100%",
                          padding: "0.45rem",
                          ...s.btn,
                          background: "#0ea5e9",
                          color: "#fff",
                          fontSize: "0.8rem",
                          marginBottom: "0.75rem",
                          opacity: isSubmittingReport ? 0.6 : 1,
                        }}
                      >
                        {isSubmittingReport ? "Submitting..." : "Submit Report"}
                      </button>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#64748b",
                          marginBottom: "0.35rem",
                          fontWeight: 600,
                        }}
                      >
                        RATE TIMING ACCURACY
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.2rem",
                          marginBottom: "0.4rem",
                        }}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            type="button"
                            key={n}
                            onClick={() => setFeedbackRating(n)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "1.1rem",
                              color:
                                n <= feedbackRating ? "#fbbf24" : "#374151",
                              padding: 0,
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Comment (optional)"
                        rows={2}
                        style={{
                          ...s.input,
                          resize: "none",
                          marginBottom: "0.4rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSubmitFeedback}
                        disabled={isSubmittingFeedback}
                        style={{
                          width: "100%",
                          padding: "0.45rem",
                          ...s.btn,
                          background: "transparent",
                          border: "1px solid #0ea5e9",
                          color: "#0ea5e9",
                          fontSize: "0.8rem",
                          opacity: isSubmittingFeedback ? 0.6 : 1,
                        }}
                      >
                        {isSubmittingFeedback
                          ? "Submitting..."
                          : "Submit Feedback"}
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        borderTop: "1px solid #1e2d4a",
                        paddingTop: "0.75rem",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "0.78rem",
                          marginBottom: "0.6rem",
                        }}
                      >
                        Login to submit reports &amp; feedback
                      </p>
                      <button
                        type="button"
                        onClick={login}
                        style={{
                          padding: "0.45rem 1.25rem",
                          ...s.btn,
                          background: "#0ea5e9",
                          color: "#fff",
                          fontSize: "0.8rem",
                        }}
                      >
                        Login
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Active Buses List */}
              <div style={{ padding: "1rem", flex: 1 }}>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#64748b",
                    fontWeight: 600,
                    marginBottom: "0.6rem",
                  }}
                >
                  ACTIVE SHUTTLES ({activeBuses.length})
                </div>
                {activeBuses.map((bus) => (
                  <div
                    key={bus.id}
                    onClick={() => {
                      setSelectedBus(bus);
                      setSelectedStop(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedBus(bus);
                        setSelectedStop(null);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      padding: "0.6rem 0.65rem",
                      background:
                        selectedBus?.id === bus.id ? "#1e3a5f" : "#1a2341",
                      borderRadius: "8px",
                      marginBottom: "0.35rem",
                      cursor: "pointer",
                      border: `1px solid ${selectedBus?.id === bus.id ? "#0ea5e9" : "transparent"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>🚌</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.82rem",
                          marginBottom: "0.1rem",
                        }}
                      >
                        {bus.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.68rem",
                          color: getRouteColor(bus.routeId),
                        }}
                      >
                        {getRouteName(bus.routeId)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "#0ea5e9",
                        }}
                      >
                        {Math.round(bus.speed)}
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#64748b" }}>
                        km/h
                      </div>
                    </div>
                  </div>
                ))}
                {activeBuses.length === 0 && (
                  <div style={{ color: "#475569", fontSize: "0.82rem" }}>
                    No active buses
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            <div style={s.mapWrap}>
              <MapView
                buses={buses}
                stops={stops}
                routes={routes}
                selectedBus={selectedBus}
                selectedStop={selectedStop}
                onBusClick={(bus) => {
                  setSelectedBus(bus);
                  setSelectedStop(null);
                }}
                onStopClick={(stop) => {
                  setSelectedStop(stop);
                  setSelectedBus(null);
                }}
              />
            </div>
          </>
        )}

        {/* STOPS TAB */}
        {activeTab === "stops" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
            <h2
              style={{
                color: "#e8eaf6",
                margin: "0 0 1.25rem",
                fontSize: "1rem",
                fontWeight: 700,
              }}
            >
              Campus Shuttle Stops
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "0.9rem",
              }}
            >
              {stops.map((stop) => {
                const nearest = activeBuses.reduce<{
                  bus: Bus | null;
                  dist: number;
                }>(
                  (acc, bus) => {
                    const d = haversineDistance(
                      bus.lat,
                      bus.lng,
                      stop.lat,
                      stop.lng,
                    );
                    return d < acc.dist ? { bus, dist: d } : acc;
                  },
                  { bus: null, dist: Number.POSITIVE_INFINITY },
                );
                return (
                  <div
                    key={stop.id}
                    onClick={() => handleSelectStop(stop)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        handleSelectStop(stop);
                    }}
                    style={{
                      ...s.card,
                      padding: "1.1rem",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor =
                        "#0ea5e9";
                      (e.currentTarget as HTMLDivElement).style.transform =
                        "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor =
                        "#1e2d4a";
                      (e.currentTarget as HTMLDivElement).style.transform = "";
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.92rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      📍 {stop.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.77rem",
                        color: "#64748b",
                        marginBottom: "0.75rem",
                      }}
                    >
                      {stop.description}
                    </div>
                    {nearest.bus && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#0f1629",
                          borderRadius: "6px",
                          padding: "0.4rem 0.6rem",
                        }}
                      >
                        <span style={{ fontSize: "0.73rem", color: "#94a3b8" }}>
                          Next: {nearest.bus.name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "#22c55e",
                          }}
                        >
                          {calculateETA(nearest.bus, stop)}
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        marginTop: "0.6rem",
                        fontSize: "0.72rem",
                        color: "#0ea5e9",
                        fontWeight: 600,
                      }}
                    >
                      View on map →
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ADMIN TAB */}
        {activeTab === "admin" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <AdminDashboard
              actor={actor}
              buses={buses}
              stops={stops}
              routes={routes}
              recentReports={recentReports}
              isAdmin={isAdmin}
              isLoggedIn={!!identity}
              onLogin={login}
              getRouteName={getRouteName}
              timeAgo={timeAgo}
              onRefresh={() => {
                if (actor)
                  actor
                    .getRecentCrowdReports()
                    .then(setRecentReports)
                    .catch(() => {});
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
