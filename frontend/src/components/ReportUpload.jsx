import { useEffect, useState } from "react";

import {
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  ScanText,
  Database,
  FileSearch,
  Sparkles,
} from "lucide-react";

import api from "../services/api";
import MedicalResults from "./MedicalResults";

const stages = [
  {
    progress: 15,
    label: "Uploading your medical report...",
    icon: Upload,
  },
  {
    progress: 35,
    label: "Reading PDF pages...",
    icon: FileSearch,
  },
  {
    progress: 60,
    label: "Extracting text using OCR...",
    icon: ScanText,
  },
  {
    progress: 80,
    label: "Identifying medical test results...",
    icon: Sparkles,
  },
  {
    progress: 90,
    label: "Saving report to database...",
    icon: Database,
  },
];

export default function ReportUpload({ onReportUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [refreshWarning, setRefreshWarning] = useState("");
  const [reportData, setReportData] = useState(null);

  // Simulated progress estimate while the server processes the request.
  useEffect(() => {
    if (!loading) return;

    const timer = setInterval(() => {
      setProgress((previous) => {
        if (previous >= 90) return 90;

        const next = previous + (previous < 60 ? 2 : 1);
        return Math.min(next, 90);
      });
    }, 700);

    return () => clearInterval(timer);
  }, [loading]);

  const currentStage =
    [...stages].reverse().find((stage) => progress >= stage.progress) ||
    stages[0];

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setLoading(true);
    setProgress(5);
    setError("");
    setRefreshWarning("");
    setReportData(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/api/reports/upload", formData);

      // Actual server response received
      setProgress(100);
      setReportData(response.data);
      setFile(null);

      // Refresh dashboard separately
      if (onReportUploaded) {
        try {
          await onReportUploaded();
        } catch (refreshError) {
          console.error("Dashboard refresh error:", refreshError);

          setRefreshWarning(
            "Report saved successfully, but dashboard refresh failed. Please reload the page.",
          );
        }
      }
    } catch (err) {
      console.error("Upload error:", err);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to process the report. Please try again.",
      );

      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const StageIcon = currentStage.icon;

  return (
    <div className="space-y-8">
      {/* Upload Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Upload size={22} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Upload Medical Report
            </h2>

            <p className="text-sm text-slate-500">
              Upload a PDF to extract medical test results.
            </p>
          </div>
        </div>

        {/* File Selection */}
        <label className="block cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-blue-500 hover:bg-blue-50/30">
          <FileText className="mx-auto mb-3 text-blue-500" size={35} />

          <p className="font-medium text-slate-800">
            {file ? file.name : "Choose your PDF report"}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            PDF format · Maximum size 10 MB
          </p>

          <input
            type="file"
            accept=".pdf,application/pdf"
            disabled={loading}
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];

              setError("");
              setRefreshWarning("");
              setReportData(null);

              if (!selected) {
                setFile(null);
                return;
              }

              if (
                selected.type !== "application/pdf" &&
                !selected.name.toLowerCase().endsWith(".pdf")
              ) {
                setFile(null);
                setError("Please select a PDF file.");
                return;
              }

              if (selected.size > 10 * 1024 * 1024) {
                setFile(null);
                setError("File size must not exceed 10 MB.");
                return;
              }

              setFile(selected);
            }}
          />
        </label>

        {/* Processing Progress */}
        {loading && (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Analyzing Medical Report
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Please wait while DocHealth AI processes your file.
                </p>
              </div>

              <span className="text-2xl font-bold tabular-nums text-blue-600">
                {progress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Current Stage */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600">
                <StageIcon size={21} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {currentStage.label}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Processing may take a little longer for scanned PDFs.
                </p>
              </div>

              <Loader2
                size={19}
                className="ml-auto animate-spin text-blue-600"
              />
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              Estimated progress · Actual completion is confirmed by the server.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Success */}
        {reportData && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle size={18} />
            Report processed and saved successfully!
          </div>
        )}

        {/* Dashboard Refresh Warning */}
        {refreshWarning && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            <AlertCircle size={18} />
            {refreshWarning}
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Processing Report...
            </>
          ) : (
            <>
              <Upload size={18} />
              Analyze Medical Report
            </>
          )}
        </button>
      </div>

      {/* Medical Analysis */}
      {reportData && <MedicalResults data={reportData} />}
    </div>
  );
}
