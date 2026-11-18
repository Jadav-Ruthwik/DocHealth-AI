import { useCallback, useEffect, useState } from "react";

import ReportUpload from "./components/ReportUpload";
import MedicalResults from "./components/MedicalResults";
import api from "./services/api";

import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Activity,
  HeartPulse,
  Settings,
  Bell,
  Clock,
  ChevronRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";

const navigation = [
  [LayoutDashboard, "Dashboard"],
  [FileText, "Medical Reports"],
  [MessageSquare, "AI Assistant"],
  [Activity, "Health Analytics"],
  [HeartPulse, "Medical History"],
  [Settings, "Settings"],
];

function App() {
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");

  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");

  // Fetch saved reports from SQLite
  const loadReports = useCallback(async () => {
    try {
      setReportsError("");

      const response = await api.get("/api/reports");

      setReports(response.data);
    } catch (error) {
      console.error("Report history error:", error);

      setReportsError("Unable to load saved reports. Please try again.");
    } finally {
      setReportsLoading(false);
    }
  }, []);

  // Load reports when dashboard opens
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Open an existing report
  const openReport = async (reportId) => {
    setDetailLoading(true);
    setSelectedReport(null);

    try {
      const response = await api.get(`/api/reports/${reportId}`);

      setSelectedReport(response.data);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Report details error:", error);

      alert("Unable to open this report. Please try again.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Delete a saved medical report
  const deleteReport = async (reportId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this medical report? This action cannot be undone.",
    );

    if (!confirmed) return;

    setDeletingId(reportId);
    setDeleteError("");
    setDeleteSuccess("");

    try {
      await api.delete(`/api/reports/${reportId}`);

      // Close report details if the deleted report was open
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }

      // Refresh dashboard and report history
      await loadReports();

      setDeleteSuccess("Medical report deleted successfully.");
    } catch (error) {
      console.error("Delete report error:", error);

      setDeleteError(
        error.response?.data?.detail ||
          "Unable to delete this report. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Dashboard statistics
  const stats = [
    {
      title: "Total Reports",
      value: reports.length.toString(),
      description: "Saved medical reports",
      icon: FileText,
      color: "blue",
    },
    {
      title: "Health Records",
      value: "08",
      description: "Demo statistic",
      icon: HeartPulse,
      color: "purple",
    },
    {
      title: "AI Analyses",
      value: "24",
      description: "Demo statistic",
      icon: Activity,
      color: "green",
    },
    {
      title: "Last Updated",
      value: reports.length
        ? new Date(reports[0].created_at).toLocaleDateString()
        : "Not yet",
      description: "Latest saved report",
      icon: Clock,
      color: "orange",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* ================= SIDEBAR ================= */}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <HeartPulse size={25} />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              DocHealth AI
            </h1>

            <p className="text-xs text-slate-400">Healthcare Intelligence</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 pt-8">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map(([Icon, name], index) => (
              <button
                key={name}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  index === 0
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={19} />
                {name}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-600">
              <HeartPulse size={20} />
            </div>

            <h3 className="text-sm font-semibold text-slate-800">
              Your health matters
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Keep your medical records organized in one workspace.
            </p>
          </div>

          <p className="mt-5 text-center text-[11px] text-slate-400">
            DocHealth AI · Version 1.0
          </p>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <main className="min-w-0 lg:ml-64">
        {/* Top Navigation */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <HeartPulse className="text-blue-600" size={24} />

            <span className="font-bold text-slate-900">DocHealth AI</span>
          </div>

          <p className="hidden text-sm text-slate-500 lg:block">
            Healthcare workspace
          </p>

          <div className="ml-auto flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
            >
              <Bell size={18} />
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                U
              </div>

              <span className="text-sm font-medium">User</span>
            </div>
          </div>
        </header>

        {/* Dashboard Container */}
        <div className="mx-auto max-w-[1600px] space-y-8 p-5 md:p-8">
          {/* ================= PAGE HEADING ================= */}

          <section>
            <p className="text-sm font-medium text-blue-600">Overview</p>

            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Welcome back! Here's your health overview.
            </p>
          </section>

          {/* ================= STATISTICS ================= */}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => {
              const Icon = item.icon;

              const iconColors = {
                blue: "bg-blue-50 text-blue-600",
                purple: "bg-purple-50 text-purple-600",
                green: "bg-emerald-50 text-emerald-600",
                orange: "bg-orange-50 text-orange-600",
              };

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">
                      {item.title}
                    </p>

                    <div
                      className={`rounded-xl p-2.5 ${iconColors[item.color]}`}
                    >
                      <Icon size={20} />
                    </div>
                  </div>

                  <h3 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                    {item.value}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </section>

          {/* ================= SAVED REPORT DETAILS ================= */}

          {selectedReport && (
            <section className="space-y-5">
              <button
                onClick={() => setSelectedReport(null)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                <ArrowLeft size={17} />
                Back to dashboard
              </button>

              <MedicalResults data={selectedReport} />
            </section>
          )}

          {/* Loading Report Details */}
          {detailLoading && (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-10 text-sm text-slate-500">
              <Loader2 className="animate-spin" size={20} />
              Loading saved report...
            </div>
          )}

          {/* ================= REPORT UPLOAD ================= */}

          {!selectedReport && (
            <section className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Medical Report Center
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Upload, extract and review your medical test results.
                </p>
              </div>

              <div className="min-w-0">
                <ReportUpload onReportUploaded={loadReports} />
              </div>
            </section>
          )}

          {/* ================= RECENT REPORTS ================= */}

          {!selectedReport && (
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Section Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Recent Medical Reports
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Saved documents from your database
                  </p>
                </div>

                <button
                  onClick={loadReports}
                  disabled={reportsLoading}
                  className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  <RefreshCw
                    size={15}
                    className={reportsLoading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              {/* Delete Success */}
              {deleteSuccess && (
                <div className="mx-6 mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  {deleteSuccess}
                </div>
              )}

              {/* Delete Error */}
              {deleteError && (
                <div className="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {deleteError}
                </div>
              )}

              {/* Loading */}
              {reportsLoading ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  <Loader2 className="mx-auto mb-3 animate-spin" size={22} />
                  Loading saved reports...
                </div>
              ) : reportsError ? (
                <div className="p-10 text-center text-sm text-red-600">
                  {reportsError}

                  <button
                    onClick={loadReports}
                    className="ml-2 font-semibold underline"
                  >
                    Retry
                  </button>
                </div>
              ) : reports.length === 0 ? (
                <div className="p-10 text-center">
                  <FileText className="mx-auto mb-3 text-slate-300" size={36} />

                  <p className="font-semibold text-slate-700">
                    No medical reports yet
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Upload a PDF to create your first report.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 transition hover:bg-slate-50"
                    >
                      {/* Report Details */}
                      <button
                        onClick={() => openReport(report.id)}
                        className="flex min-w-0 flex-1 items-center gap-4 text-left"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <FileText size={21} />
                        </div>

                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-semibold text-slate-800">
                            {report.filename}
                          </h4>

                          <p className="mt-1 text-xs text-slate-400">
                            {new Date(report.created_at).toLocaleString()}
                            {" · "}
                            {report.total_pages} page(s)
                            {" · "}
                            {report.total_tests_extracted} tests
                          </p>
                        </div>
                      </button>

                      {/* Report Actions */}
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                          Saved
                        </span>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteReport(report.id)}
                          disabled={deletingId === report.id}
                          aria-label={`Delete ${report.filename}`}
                          title="Delete report"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === report.id ? (
                            <Loader2 size={17} className="animate-spin" />
                          ) : (
                            <Trash2 size={17} />
                          )}
                        </button>

                        {/* Open Report */}
                        <button
                          onClick={() => openReport(report.id)}
                          aria-label="Open report"
                          title="Open report"
                          className="text-slate-400 transition hover:text-blue-600"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ================= AI ASSISTANT ================= */}

          {!selectedReport && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <MessageSquare size={23} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    DocHealth AI Assistant
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Ask questions about your uploaded medical reports.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  disabled
                  placeholder="AI assistant will be available in a future milestone..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                />

                <button
                  disabled
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white opacity-50"
                >
                  Ask AI
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-400">
                AI assistant functionality is not connected yet.
              </p>
            </section>
          )}

          {/* ================= FOOTER ================= */}

          <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-400">
            © 2026 DocHealth AI · Healthcare information and report organization
            platform
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
