import { useMemo, useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  Activity,
  FileText,
  Filter,
} from "lucide-react";

export default function MedicalResults({ data }) {
  const [filter, setFilter] = useState("All");

  if (!data || !Array.isArray(data.medical_results)) {
    return null;
  }

  const results = data.medical_results;

  const isAbnormal = (item) =>
    item.status === "Above reference range" ||
    item.status === "Below reference range";

  const normal = results.filter((item) => !isAbnormal(item)).length;
  const abnormal = results.length - normal;

  const filteredResults = useMemo(() => {
    if (filter === "Normal") {
      return results.filter((item) => !isAbnormal(item));
    }

    if (filter === "Outside Range") {
      return results.filter(isAbnormal);
    }

    return results;
  }, [filter, data]);

  const filters = [
    { label: "All", count: results.length },
    { label: "Normal", count: normal },
    { label: "Outside Range", count: abnormal },
  ];

  return (
    <section className="space-y-5">
      {/* Analysis Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Activity size={21} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Medical Report Analysis
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Automated report extraction and reference comparison
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <FileText size={14} />
            <span className="break-all">{data.filename}</span>
            <span>·</span>
            <span>{data.total_pages} page(s)</span>
          </div>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          Processing complete
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Tests"
          value={results.length}
          icon={<Activity size={20} />}
          color="blue"
        />

        <SummaryCard
          title="Within Range"
          value={normal}
          icon={<CheckCircle size={20} />}
          color="green"
        />

        <SummaryCard
          title="Outside Range"
          value={abnormal}
          icon={<AlertTriangle size={20} />}
          color="red"
        />
      </div>

      {/* Results Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 md:px-6">
          <div>
            <h3 className="font-bold text-slate-900">Extracted Test Results</h3>
            <p className="mt-1 text-xs text-slate-500">
              {filteredResults.length} of {results.length} tests displayed
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter size={15} />
            Filter results
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3 md:px-6">
          {filters.map((item) => (
            <button
              key={item.label}
              onClick={() => setFilter(item.label)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                filter === item.label
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label}
              <span className="ml-2 opacity-75">{item.count}</span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4">Test Name</th>
                <th className="px-6 py-4">Result</th>
                <th className="px-6 py-4">Reference Range / Limit</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredResults.map((item, index) => {
                const abnormalResult = isAbnormal(item);

                const reference =
                  item.reference_min === null
                    ? `Below ${item.reference_max}`
                    : `${item.reference_min} – ${item.reference_max}`;

                return (
                  <tr
                    key={`${item.test_name}-${index}`}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-5">
                      <span className="font-semibold text-slate-800">
                        {item.test_name}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`font-bold ${
                          abnormalResult ? "text-red-600" : "text-slate-800"
                        }`}
                      >
                        {item.value}
                      </span>
                      <span className="ml-1 text-sm text-slate-500">
                        {item.unit}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-500">
                      {reference} {item.unit}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${
                          abnormalResult
                            ? "bg-red-50 text-red-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {abnormalResult ? (
                          <AlertTriangle size={13} />
                        ) : (
                          <CheckCircle size={13} />
                        )}

                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredResults.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No test results found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
          <p className="text-xs text-slate-500">
            Showing {filteredResults.length} test results
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />

        <p className="text-xs leading-5 text-amber-800">
          Results are automatically extracted and compared with the reference
          limits stated in the uploaded report. This information is not a
          diagnosis and should not replace professional medical advice.
          Extraction accuracy should be verified against the original document.
        </p>
      </div>
    </section>
  );
}

function SummaryCard({ title, value, icon, color }) {
  const styles = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      number: "text-slate-900",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600",
      number: "text-emerald-700",
    },
    red: {
      icon: "bg-red-50 text-red-600",
      number: "text-red-700",
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[color].icon}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>

      <h3 className={`mt-1 text-3xl font-bold ${styles[color].number}`}>
        {value}
      </h3>
    </div>
  );
}
