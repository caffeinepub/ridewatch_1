import { useCallback, useState } from "react";
import type {
  Bus,
  CrowdReport,
  RideWatchActor,
  Route,
  Stop,
} from "../ridewatch-types";
import { CrowdReportType } from "../ridewatch-types";

interface AdminDashboardProps {
  actor: RideWatchActor | null;
  buses: Bus[];
  stops: Stop[];
  routes: Route[];
  recentReports: CrowdReport[];
  isAdmin: boolean;
  isLoggedIn: boolean;
  onLogin: () => void;
  getRouteName: (routeId: string) => string;
  timeAgo: (ts: bigint) => string;
  onRefresh: () => void;
}

const card: React.CSSProperties = {
  background: "#1a2341",
  borderRadius: "12px",
  border: "1px solid #1e2d4a",
};
const inp: React.CSSProperties = {
  width: "100%",
  padding: "0.45rem 0.6rem",
  borderRadius: "6px",
  border: "1px solid #1e2d4a",
  background: "#0f1629",
  color: "#e8eaf6",
  fontSize: "0.82rem",
};

export default function AdminDashboard({
  actor,
  buses,
  stops,
  routes,
  recentReports,
  isAdmin,
  isLoggedIn,
  onLogin,
  getRouteName,
  timeAgo,
  onRefresh,
}: AdminDashboardProps) {
  const [busName, setBusName] = useState("");
  const [busRouteId, setBusRouteId] = useState(routes[0]?.id ?? "route-1");
  const [busLat, setBusLat] = useState("12.9698");
  const [busLng, setBusLng] = useState("79.1587");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const handleAddBus = useCallback(async () => {
    if (!actor || !busName) return;
    setAdding(true);
    setAddError("");
    try {
      await actor.addBus(
        busName,
        busRouteId,
        Number.parseFloat(busLat),
        Number.parseFloat(busLng),
      );
      setAddSuccess(`"${busName}" added!`);
      setBusName("");
      setTimeout(() => setAddSuccess(""), 3000);
    } catch {
      setAddError("Failed. Check admin permissions.");
    } finally {
      setAdding(false);
    }
  }, [actor, busName, busRouteId, busLat, busLng]);

  const handleToggle = useCallback(
    async (busId: string, active: boolean) => {
      if (!actor) return;
      await actor.setBusActive(busId, !active).catch(() => {});
    },
    [actor],
  );

  const handleVerify = useCallback(
    async (reportId: string) => {
      if (!actor) return;
      await actor.verifyCrowdReport(reportId).catch(() => {});
      onRefresh();
    },
    [actor, onRefresh],
  );

  if (!isLoggedIn) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "3rem",
          color: "#64748b",
        }}
      >
        <span style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</span>
        <h3 style={{ color: "#e8eaf6", margin: "0 0 0.5rem" }}>
          Login Required
        </h3>
        <p
          style={{
            marginBottom: "1.5rem",
            textAlign: "center",
            fontSize: "0.875rem",
          }}
        >
          Login with your admin credentials to access the dashboard.
        </p>
        <button
          type="button"
          onClick={onLogin}
          style={{
            padding: "0.65rem 2rem",
            borderRadius: "8px",
            border: "none",
            background: "#0ea5e9",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
        >
          Login
        </button>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "3rem",
          color: "#64748b",
        }}
      >
        <span style={{ fontSize: "3rem", marginBottom: "1rem" }}>⛔</span>
        <h3 style={{ color: "#e8eaf6", margin: "0 0 0.5rem" }}>
          Not Authorized
        </h3>
        <p style={{ fontSize: "0.875rem" }}>
          Your account does not have admin privileges.
        </p>
      </div>
    );
  }

  const active = buses.filter((b) => b.isActive).length;

  return (
    <div
      style={{ padding: "1.5rem", background: "#0f1629", minHeight: "100%" }}
    >
      <h2
        style={{
          color: "#e8eaf6",
          margin: "0 0 1.25rem",
          fontSize: "1rem",
          fontWeight: 700,
        }}
      >
        ⚙ Admin Dashboard
      </h2>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        {[
          {
            label: "Active Shuttles",
            value: active,
            icon: "🟢",
            color: "#22c55e",
          },
          {
            label: "Total Buses",
            value: buses.length,
            icon: "🚌",
            color: "#0ea5e9",
          },
          {
            label: "Crowd Reports",
            value: recentReports.length,
            icon: "📋",
            color: "#a78bfa",
          },
          { label: "Stops", value: stops.length, icon: "📍", color: "#f59e0b" },
        ].map((stat) => (
          <div key={stat.label} style={{ ...card, padding: "1rem" }}>
            <div style={{ fontSize: "1.25rem", marginBottom: "0.35rem" }}>
              {stat.icon}
            </div>
            <div
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                color: stat.color,
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "#64748b",
                marginTop: "0.25rem",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        {/* Fleet Table */}
        <div style={{ ...card, padding: "1.1rem" }}>
          <h3
            style={{
              color: "#e8eaf6",
              margin: "0 0 0.9rem",
              fontSize: "0.88rem",
              fontWeight: 700,
            }}
          >
            🚌 Bus Fleet
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.78rem",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #1e2d4a" }}>
                  {["Bus", "Route", "Speed", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "0.4rem 0.35rem",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buses.map((bus) => (
                  <tr
                    key={bus.id}
                    style={{ borderBottom: "1px solid #1e2d4a" }}
                  >
                    <td style={{ padding: "0.4rem 0.35rem", color: "#e8eaf6" }}>
                      {bus.name}
                    </td>
                    <td style={{ padding: "0.4rem 0.35rem", color: "#94a3b8" }}>
                      {getRouteName(bus.routeId)}
                    </td>
                    <td style={{ padding: "0.4rem 0.35rem", color: "#0ea5e9" }}>
                      {Math.round(bus.speed)}
                    </td>
                    <td style={{ padding: "0.4rem 0.35rem" }}>
                      <button
                        type="button"
                        onClick={() => handleToggle(bus.id, bus.isActive)}
                        style={{
                          padding: "0.18rem 0.5rem",
                          borderRadius: "999px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          background: bus.isActive ? "#14532d" : "#7f1d1d",
                          color: bus.isActive ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {bus.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Bus */}
        <div style={{ ...card, padding: "1.1rem" }}>
          <h3
            style={{
              color: "#e8eaf6",
              margin: "0 0 0.9rem",
              fontSize: "0.88rem",
              fontWeight: 700,
            }}
          >
            ➕ Add New Bus
          </h3>
          {addSuccess && (
            <div
              style={{
                background: "#14532d",
                color: "#22c55e",
                padding: "0.4rem 0.6rem",
                borderRadius: "6px",
                marginBottom: "0.5rem",
                fontSize: "0.78rem",
              }}
            >
              {addSuccess}
            </div>
          )}
          {addError && (
            <div
              style={{
                background: "#7f1d1d",
                color: "#ef4444",
                padding: "0.4rem 0.6rem",
                borderRadius: "6px",
                marginBottom: "0.5rem",
                fontSize: "0.78rem",
              }}
            >
              {addError}
            </div>
          )}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#64748b",
                  display: "block",
                  marginBottom: "0.2rem",
                }}
              >
                Bus Name
              </div>
              <input
                value={busName}
                onChange={(e) => setBusName(e.target.value)}
                placeholder="e.g. Shuttle 05"
                style={inp}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#64748b",
                  display: "block",
                  marginBottom: "0.2rem",
                }}
              >
                Route
              </div>
              <select
                value={busRouteId}
                onChange={(e) => setBusRouteId(e.target.value)}
                style={inp}
              >
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.4rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#64748b",
                    display: "block",
                    marginBottom: "0.2rem",
                  }}
                >
                  Latitude
                </div>
                <input
                  value={busLat}
                  onChange={(e) => setBusLat(e.target.value)}
                  style={inp}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#64748b",
                    display: "block",
                    marginBottom: "0.2rem",
                  }}
                >
                  Longitude
                </div>
                <input
                  value={busLng}
                  onChange={(e) => setBusLng(e.target.value)}
                  style={inp}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddBus}
              disabled={adding || !busName}
              style={{
                padding: "0.5rem",
                borderRadius: "6px",
                border: "none",
                background: "#0ea5e9",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.82rem",
                marginTop: "0.15rem",
                opacity: adding || !busName ? 0.6 : 1,
              }}
            >
              {adding ? "Adding..." : "Add Bus"}
            </button>
          </div>
        </div>
      </div>

      {/* Crowd Reports */}
      <div style={{ ...card, padding: "1.1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.9rem",
          }}
        >
          <h3
            style={{
              color: "#e8eaf6",
              margin: 0,
              fontSize: "0.88rem",
              fontWeight: 700,
            }}
          >
            📋 Crowd Reports Feed
          </h3>
          <button
            type="button"
            onClick={onRefresh}
            style={{
              padding: "0.28rem 0.7rem",
              borderRadius: "6px",
              border: "1px solid #1e2d4a",
              background: "transparent",
              color: "#0ea5e9",
              cursor: "pointer",
              fontSize: "0.75rem",
            }}
          >
            Refresh
          </button>
        </div>
        {recentReports.length === 0 ? (
          <div
            style={{
              color: "#475569",
              fontSize: "0.82rem",
              textAlign: "center",
              padding: "1.5rem 0",
            }}
          >
            No crowd reports yet
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
          >
            {recentReports.map((r) => {
              const stop = stops.find((s) => s.id === r.stopId);
              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.65rem",
                    padding: "0.55rem 0.7rem",
                    background: "#0f1629",
                    borderRadius: "8px",
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>
                    {r.reportType === CrowdReportType.arrival ? "🟢" : "🟠"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.82rem", color: "#e8eaf6" }}>
                      <strong>{stop?.name ?? r.stopId}</strong>
                      {" — "}
                      <span
                        style={{
                          color:
                            r.reportType === CrowdReportType.arrival
                              ? "#22c55e"
                              : "#f97316",
                        }}
                      >
                        {r.reportType === CrowdReportType.arrival
                          ? "Bus Arrived"
                          : "Bus Departed"}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#475569" }}>
                      {timeAgo(r.timestamp)}
                    </div>
                  </div>
                  {r.isVerified ? (
                    <span style={{ fontSize: "0.72rem", color: "#22c55e" }}>
                      ✓ Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleVerify(r.id)}
                      style={{
                        padding: "0.22rem 0.55rem",
                        borderRadius: "6px",
                        border: "1px solid #1e2d4a",
                        background: "transparent",
                        color: "#0ea5e9",
                        cursor: "pointer",
                        fontSize: "0.72rem",
                      }}
                    >
                      Verify
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
