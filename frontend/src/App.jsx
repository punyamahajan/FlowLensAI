import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  TrendingUp,
  Workflow,
} from "lucide-react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  // =========================
  // STATE
  // =========================
  const [selectedStage, setSelectedStage] = useState(null);

  const [question, setQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);

  const [kpis, setKpis] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");

  // =========================
  // LOAD DASHBOARD DATA
  // =========================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [kpiResponse, bottleneckResponse, incidentResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/kpis`),
          fetch(`${API_URL}/api/bottlenecks`),
          fetch(`${API_URL}/api/incidents`),
        ]);

      if (
        !kpiResponse.ok ||
        !bottleneckResponse.ok ||
        !incidentResponse.ok
      ) {
        throw new Error("Failed to fetch dashboard data");
      }

      const kpiData = await kpiResponse.json();
      const bottleneckData = await bottleneckResponse.json();
      const incidentData = await incidentResponse.json();

      setKpis(kpiData.data || []);
      setBottlenecks(bottleneckData.data || []);
      setIncidents(incidentData.data || []);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to connect to the FlowLens backend. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // AI ASSISTANT
  // =========================

  const askAssistant = async () => {
    if (!question.trim()) return;

    try {
      setAssistantLoading(true);
      setAssistantAnswer("");

      const response = await fetch(
        `${API_URL}/api/assistant?question=${encodeURIComponent(question)}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Assistant request failed");
      }

      setAssistantAnswer(result.answer || "No answer returned.");
    } catch (err) {
      console.error(err);

      setAssistantAnswer(
        "Unable to get an answer from FlowLens Assistant."
      );
    } finally {
      setAssistantLoading(false);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    loadDashboard();
  }, []);

  // =========================
  // CALCULATED METRICS
  // =========================

  const totalCases = kpis.reduce(
    (sum, item) => sum + Number(item.total_cases || 0),
    0
  );

  const totalBreaches = kpis.reduce(
    (sum, item) => sum + Number(item.sla_breaches || 0),
    0
  );

  const averageProcessing =
    kpis.length > 0
      ? (
          kpis.reduce(
            (sum, item) =>
              sum + Number(item.avg_processing_hours || 0),
            0
          ) / kpis.length
        ).toFixed(2)
      : 0;

  const criticalStages = kpis.filter(
    (item) => Number(item.sla_breaches || 0) > 0
  ).length;

  const highestBottleneck =
    bottlenecks.length > 0
      ? [...bottlenecks].sort(
          (a, b) =>
            Number(b.bottleneck_score || 0) -
            Number(a.bottleneck_score || 0)
        )[0]
      : null;

  const sortedBottlenecks = [...bottlenecks].sort(
    (a, b) =>
      Number(b.bottleneck_score || 0) -
      Number(a.bottleneck_score || 0)
  );

  // =========================
  // SIDEBAR
  // =========================

  const renderSidebar = () => {
    return (
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={21} />
          </div>

          <div>
            <h1>FlowLens</h1>
            <span>Operations Intelligence</span>
          </div>
        </div>

        <nav>
          <div
            className={`nav-item ${
              activePage === "Dashboard" ? "active" : ""
            }`}
            onClick={() => setActivePage("Dashboard")}
          >
            <Workflow size={18} />
            Dashboard
          </div>

          <div
            className={`nav-item ${
              activePage === "Performance" ? "active" : ""
            }`}
            onClick={() => setActivePage("Performance")}
          >
            <TrendingUp size={18} />
            Performance
          </div>

          <div
            className={`nav-item ${
              activePage === "SLA Incidents" ? "active" : ""
            }`}
            onClick={() => setActivePage("SLA Incidents")}
          >
            <AlertTriangle size={18} />
            SLA Incidents
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="status-dot"></span>
            System Connected
          </div>

          <small>FlowLens AI v1.0</small>
        </div>
      </aside>
    );
  };

  // =========================
  // HEADER
  // =========================

  const renderHeader = (title, subtitle) => {
    return (
      <header className="header">
        <div>
          <p className="eyebrow">OPERATIONS CONTROL CENTER</p>
          <h2>{title}</h2>
          <p className="subtitle">{subtitle}</p>
        </div>

        <button className="refresh-btn" onClick={loadDashboard}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>
    );
  };

  // =========================
  // DASHBOARD
  // =========================

  const renderDashboard = () => {
    return (
      <>
        {renderHeader(
          "Operations Overview",
          "Real-time visibility into process performance, bottlenecks and SLA risks."
        )}

        {error && (
          <div className="error-box">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading">
            <RefreshCw className="spin" size={28} />
            <p>Loading operations data...</p>
          </div>
        ) : (
          <>
            {/* KPI CARDS */}

            <section className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-top">
                  <span>Total Cases</span>

                  <div className="kpi-icon">
                    <Workflow size={19} />
                  </div>
                </div>

                <strong>{totalCases.toLocaleString()}</strong>

                <p>Cases processed across stages</p>
              </div>

              <div className="kpi-card danger">
                <div className="kpi-top">
                  <span>SLA Breaches</span>

                  <div className="kpi-icon">
                    <AlertTriangle size={19} />
                  </div>
                </div>

                <strong>{totalBreaches.toLocaleString()}</strong>

                <p>Detected SLA violations</p>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <span>Avg Processing</span>

                  <div className="kpi-icon">
                    <Clock3 size={19} />
                  </div>
                </div>

                <strong>{averageProcessing} hrs</strong>

                <p>Average across all stages</p>
              </div>

              <div className="kpi-card warning">
                <div className="kpi-top">
                  <span>At-Risk Stages</span>

                  <div className="kpi-icon">
                    <AlertTriangle size={19} />
                  </div>
                </div>

                <strong>{criticalStages}</strong>

                <p>Stages currently breaching SLA</p>
              </div>
            </section>

            {/* PERFORMANCE + BOTTLENECK */}

            <section className="content-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Stage Performance</h3>
                    <p>Processing time and SLA breach overview</p>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Stage</th>
                        <th>Cases</th>
                        <th>Avg Time</th>
                        <th>Max Time</th>
                        <th>Breaches</th>
                        <th>Rate</th>
                      </tr>
                    </thead>

                    <tbody>
                      {kpis.map((stage) => (
                        <tr key={stage.stage}>
                          <td className="stage-name">
                            {stage.stage}
                          </td>

                          <td>
                            {Number(
                              stage.total_cases || 0
                            ).toLocaleString()}
                          </td>

                          <td>
                            {stage.avg_processing_hours} hrs
                          </td>

                          <td>
                            {stage.max_processing_hours} hrs
                          </td>

                          <td>
                            <span
                              className={
                                Number(stage.sla_breaches) > 0
                                  ? "badge danger-badge"
                                  : "badge success-badge"
                              }
                            >
                              {Number(
                                stage.sla_breaches || 0
                              ).toLocaleString()}
                            </span>
                          </td>

                          <td>
                            {stage.sla_breach_rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="panel bottleneck-panel">
                <div className="panel-header">
                  <div>
                    <h3>Bottleneck Analysis</h3>
                    <p>AI-derived process pressure</p>
                  </div>
                </div>

                <div className="bottleneck-list">
                  {sortedBottlenecks.map((item) => {
                    const score = Number(
                      item.bottleneck_score || 0
                    );

                    const percentage = Math.round(score * 100);

                    return (
                      <div
                        className="bottleneck-item"
                        key={item.stage}
                      >
                        <div className="bottleneck-info">
                          <span>{item.stage}</span>
                          <strong>{percentage}</strong>
                        </div>

                        <div className="progress">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          ></div>
                        </div>

                        <div className="bottleneck-meta">
                          <span>
                            Avg:{" "}
                            {item.avg_processing_hours} hrs
                          </span>

                          <span>
                            Breaches:{" "}
                            {Number(
                              item.sla_breaches || 0
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {highestBottleneck && (
                  <div className="insight">
                    <TrendingUp size={18} />

                    <div>
                      <strong>Primary bottleneck</strong>

                      <p>
                        {highestBottleneck.stage} currently has
                        the highest bottleneck score at{" "}
                        {Math.round(
                          Number(
                            highestBottleneck.bottleneck_score
                          ) * 100
                        )}
                        %.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* SLA INCIDENTS */}

            <section className="panel incidents-panel">
              <div className="panel-header">
                <div>
                  <h3>SLA Incidents</h3>
                  <p>
                    Active operational issues requiring attention
                  </p>
                </div>

                <div className="incident-count">
                  {incidents.length} Open
                </div>
              </div>

              {incidents.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle2 size={30} />
                  <p>No active SLA incidents.</p>
                </div>
              ) : (
                <div className="incident-list">
                  {incidents.map((incident) => (
                    <div
                      className="incident"
                      key={incident.incident_id}
                    >
                      <div className="incident-icon">
                        <AlertTriangle size={18} />
                      </div>

                      <div className="incident-content">
                        <div className="incident-title">
                          <strong>{incident.stage}</strong>

                          <span className="open-badge">
                            {incident.status}
                          </span>
                        </div>

                        <p>
                          {Number(
                            incident.sla_breaches || 0
                          ).toLocaleString()}{" "}
                          SLA breaches detected with an average
                          processing time of{" "}
                          {incident.avg_processing_hours} hours.
                        </p>
                      </div>

                      <div className="incident-metric">
                        <strong>
                          {incident.sla_breach_rate}%
                        </strong>

                        <span>Breach rate</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* AI ASSISTANT */}

            <section className="assistant-panel">
              <div className="assistant-panel-header">
                <div>
                  <span className="assistant-eyebrow">
                    FLOWLENS AI
                  </span>

                  <h2>Ask FlowLens</h2>

                  <p>
                    Ask questions about bottlenecks, SLA breaches
                    and operational performance.
                  </p>
                </div>
              </div>

              <div className="assistant-input">
                <input
                  type="text"
                  value={question}
                  placeholder="e.g. What is the main bottleneck?"
                  onChange={(e) =>
                    setQuestion(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      askAssistant();
                    }
                  }}
                />

                <button
                  onClick={askAssistant}
                  disabled={assistantLoading || !question.trim()}
                >
                  {assistantLoading ? (
                    <>
                      <RefreshCw
                        className="spin"
                        size={16}
                      />
                      Thinking...
                    </>
                  ) : (
                    "Ask"
                  )}
                </button>
              </div>

              {assistantAnswer && (
                <div className="assistant-answer">
                  <strong>FlowLens AI</strong>

                  <p>{assistantAnswer}</p>
                </div>
              )}
            </section>
          </>
        )}
      </>
    );
  };

  // =========================
  // PERFORMANCE PAGE
  // =========================

  const renderPerformance = () => {
    return (
      <>
        {renderHeader(
          "Performance",
          "Detailed stage-level processing performance and SLA analysis."
        )}

        {loading ? (
          <div className="loading">
            <RefreshCw className="spin" size={28} />
            <p>Loading performance data...</p>
          </div>
        ) : (
          <>
            <section className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-top">
                  <span>Total Cases</span>

                  <div className="kpi-icon">
                    <Workflow size={19} />
                  </div>
                </div>

                <strong>{totalCases.toLocaleString()}</strong>

                <p>Cases across all process stages</p>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <span>Average Processing</span>

                  <div className="kpi-icon">
                    <Clock3 size={19} />
                  </div>
                </div>

                <strong>{averageProcessing} hrs</strong>

                <p>Average processing time</p>
              </div>

              <div className="kpi-card danger">
                <div className="kpi-top">
                  <span>Total SLA Breaches</span>

                  <div className="kpi-icon">
                    <AlertTriangle size={19} />
                  </div>
                </div>

                <strong>{totalBreaches.toLocaleString()}</strong>

                <p>Detected process violations</p>
              </div>

              <div className="kpi-card warning">
                <div className="kpi-top">
                  <span>At-Risk Stages</span>

                  <div className="kpi-icon">
                    <TrendingUp size={19} />
                  </div>
                </div>

                <strong>{criticalStages}</strong>

                <p>Stages with active SLA breaches</p>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3>Stage Performance Analysis</h3>

                  <p>
                    Compare processing efficiency across every
                    operational stage.
                  </p>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>Total Cases</th>
                      <th>Avg Processing</th>
                      <th>Median</th>
                      <th>Maximum</th>
                      <th>SLA Breaches</th>
                      <th>Breach Rate</th>
                    </tr>
                  </thead>

                  <tbody>
                    {kpis.map((stage) => (
                      <tr key={stage.stage}
                      onClick={() => setSelectedStage(stage)}
                      className="clickable-row">
                        <td className="stage-name">
                          {stage.stage}
                        </td>

                        <td>
                          {Number(
                            stage.total_cases || 0
                          ).toLocaleString()}
                        </td>

                        <td>
                          {stage.avg_processing_hours} hrs
                        </td>

                        <td>
                          {stage.median_processing_hours
                            ? `${stage.median_processing_hours} hrs`
                            : "—"}
                        </td>

                        <td>
                          {stage.max_processing_hours} hrs
                        </td>

                        <td>
                          <span
                            className={
                              Number(stage.sla_breaches) > 0
                                ? "badge danger-badge"
                                : "badge success-badge"
                            }
                          >
                            {Number(
                              stage.sla_breaches || 0
                            ).toLocaleString()}
                          </span>
                        </td>

                        <td>
                          {stage.sla_breach_rate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Processing Time</h3>
                    <p>Average processing time by stage</p>
                  </div>
                </div>

                <div className="bottleneck-list">
                  {[...kpis]
                    .sort(
                      (a, b) =>
                        Number(
                          b.avg_processing_hours || 0
                        ) -
                        Number(
                          a.avg_processing_hours || 0
                        )
                    )
                    .map((stage) => {
                      const maxProcessing = Math.max(
                        ...kpis.map((item) =>
                          Number(
                            item.avg_processing_hours || 0
                          )
                        )
                      );

                      const percentage =
                        maxProcessing > 0
                          ? Math.round(
                              (Number(
                                stage.avg_processing_hours || 0
                              ) /
                                maxProcessing) *
                                100
                            )
                          : 0;

                      return (
                        <div
                          className="bottleneck-item"
                          key={stage.stage}
                        >
                          <div className="bottleneck-info">
                            <span>{stage.stage}</span>

                            <strong>
                              {stage.avg_processing_hours} hrs
                            </strong>
                          </div>

                          <div className="progress">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${percentage}%`,
                              }}
                            ></div>
                          </div>

                          <div className="bottleneck-meta">
                            <span>
                              Maximum:{" "}
                              {stage.max_processing_hours} hrs
                            </span>

                            <span>
                              Breach rate:{" "}
                              {stage.sla_breach_rate}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>SLA Performance</h3>
                    <p>Stage-level SLA compliance</p>
                  </div>
                </div>

                <div className="bottleneck-list">
                  {[...kpis]
                    .sort(
                      (a, b) =>
                        Number(b.sla_breach_rate || 0) -
                        Number(a.sla_breach_rate || 0)
                    )
                    .map((stage) => {
                      const rate = Number(
                        stage.sla_breach_rate || 0
                      );

                      const percentage = Math.min(
                        Math.round(rate * 5),
                        100
                      );

                      return (
                        <div
                          className="bottleneck-item"
                          key={stage.stage}
                        >
                          <div className="bottleneck-info">
                            <span>{stage.stage}</span>

                            <strong>
                              {rate.toFixed(2)}%
                            </strong>
                          </div>

                          <div className="progress">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${percentage}%`,
                              }}
                            ></div>
                          </div>

                          <div className="bottleneck-meta">
                            <span>
                              Breaches:{" "}
                              {Number(
                                stage.sla_breaches || 0
                              ).toLocaleString()}
                            </span>

                            <span>
                              Cases:{" "}
                              {Number(
                                stage.total_cases || 0
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </section>
          </>
        )}
      </>
    );
  };

  // =========================
  // INCIDENTS PAGE
  // =========================

  const renderIncidents = () => {
    return (
      <>
        {renderHeader(
          "SLA Incidents",
          "Monitor active operational issues and identify stages requiring intervention."
        )}

        {loading ? (
          <div className="loading">
            <RefreshCw className="spin" size={28} />
            <p>Loading incident data...</p>
          </div>
        ) : (
          <>
            <section className="kpi-grid">
              <div className="kpi-card danger">
                <div className="kpi-top">
                  <span>Open Incidents</span>

                  <div className="kpi-icon">
                    <AlertTriangle size={19} />
                  </div>
                </div>

                <strong>{incidents.length}</strong>

                <p>Active operational incidents</p>
              </div>

              <div className="kpi-card danger">
                <div className="kpi-top">
                  <span>Total Breaches</span>

                  <div className="kpi-icon">
                    <TrendingUp size={19} />
                  </div>
                </div>

                <strong>
                  {totalBreaches.toLocaleString()}
                </strong>

                <p>Across all process stages</p>
              </div>

              <div className="kpi-card warning">
                <div className="kpi-top">
                  <span>Highest Risk Stage</span>

                  <div className="kpi-icon">
                    <AlertTriangle size={19} />
                  </div>
                </div>

                <strong>
                  {incidents.length > 0
                    ? incidents[0].stage
                    : "None"}
                </strong>

                <p>Based on active SLA incidents</p>
              </div>

              <div className="kpi-card">
                <div className="kpi-top">
                  <span>System Status</span>

                  <div className="kpi-icon">
                    <CheckCircle2 size={19} />
                  </div>
                </div>

                <strong>Connected</strong>

                <p>FastAPI and PostgreSQL operational</p>
              </div>
            </section>

            <section className="panel incidents-panel">
              <div className="panel-header">
                <div>
                  <h3>Active SLA Incidents</h3>

                  <p>
                    Operational stages currently exceeding
                    defined SLA thresholds.
                  </p>
                </div>

                <div className="incident-count">
                  {incidents.length} Open
                </div>
              </div>

              {incidents.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle2 size={30} />

                  <p>No active SLA incidents.</p>
                </div>
              ) : (
                <div className="incident-list">
                  {incidents.map((incident) => (
                    <div
                      className="incident"
                      key={incident.incident_id}
                    >
                      <div className="incident-icon">
                        <AlertTriangle size={18} />
                      </div>

                      <div className="incident-content">
                        <div className="incident-title">
                          <strong>{incident.stage}</strong>

                          <span className="open-badge">
                            {incident.status}
                          </span>
                        </div>

                        <p>
                          {Number(
                            incident.sla_breaches || 0
                          ).toLocaleString()}{" "}
                          SLA breaches detected. Average
                          processing time is{" "}
                          {incident.avg_processing_hours} hours,
                          with a maximum of{" "}
                          {incident.max_processing_hours} hours.
                        </p>

                        <small>
                          Detected:{" "}
                          {incident.detected_at
                            ? new Date(
                                incident.detected_at
                              ).toLocaleString()
                            : "N/A"}
                        </small>
                      </div>

                      <div className="incident-metric">
                        <strong>
                          {incident.sla_breach_rate}%
                        </strong>

                        <span>Breach rate</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <h3>Incident Summary</h3>

                  <p>
                    Breakdown of stages contributing to SLA
                    violations.
                  </p>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>Breaches</th>
                      <th>Breach Rate</th>
                      <th>Avg Processing</th>
                      <th>Max Processing</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                  {incidents.map((incident) => (
                  <tr key={incident.incident_id}>
                  <td className="stage-name">
                    {incident.stage}
                  </td>

                <td>
        {Number(incident.sla_breaches || 0).toLocaleString()}
      </td>

      <td>
        {Number(incident.sla_breach_rate || 0).toFixed(2)}%
      </td>

      <td>
        {Number(incident.avg_processing_hours || 0).toFixed(2)} hrs
      </td>

      <td>
        {Number(incident.max_processing_hours || 0).toFixed(0)} hrs
      </td>

      <td>
        <span
          className={
            incident.status === "Open"
              ? "status-badge status-open"
              : "status-badge"
          }
        >
          {incident.status}
        </span>
      </td>
    </tr>
  ))}
</tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </>
    );
  };

  // =========================
  // MAIN APP
  // =========================

  return (
    <div className="app">
      {renderSidebar()}

      <main className="main">
        {activePage === "Dashboard" && renderDashboard()}

        {activePage === "Performance" && renderPerformance()}

        {activePage === "SLA Incidents" && renderIncidents()}
      </main>
    </div>
  );
}

export default App;