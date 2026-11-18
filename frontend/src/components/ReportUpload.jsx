import { useState } from "react";

import {
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import api from "../services/api";
import MedicalResults from "./MedicalResults";

export default function ReportUpload({ onReportUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshWarning, setRefreshWarning] = useState("");
  const [reportData, setReportData] = useState(null);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setLoading(true);
    setError("");
    setRefreshWarning("");
    setReportData(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Step 1: Upload and process the report
      const response = await api.post("/api/reports/upload", formData);

      // A successful HTTP response means upload succeeded
      setReportData(response.data);
      setFile(null);

      // Step 2: Refresh dashboard separately
      if (onReportUploaded) {
        try {
          await onReportUploaded();
        } catch (refreshError) {
          console.error("Dashboard refresh error:", refreshError);
          setRefreshWarning(
            "Report saved successfully, but the dashboard could not refresh. Please reload the page.",
          );
        }
      }
    } catch (err) {
      console.error("Upload error:", err);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to upload the report. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
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

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {reportData && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle size={18} />
            Report processed and saved successfully!
          </div>
        )}

        {refreshWarning && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            <AlertCircle size={18} />
            {refreshWarning}
          </div>
        )}

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

      {reportData && <MedicalResults data={reportData} />}
    </div>
  );
}
