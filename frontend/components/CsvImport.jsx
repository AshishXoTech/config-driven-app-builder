import { useState, useRef, useCallback } from "react";
import { importCSV, getJobStatus } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import Spinner from "./Spinner";

/**
 * Parse CSV text into { headers, rows } for preview.
 */
function parseCSVPreview(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * CSV Import component with 3 phases:
 * 1. Upload — drag-and-drop + file picker
 * 2. Preview — parsed data table
 * 3. Result — inserted/failed summary
 */
export default function CsvImport({ schema, modelName, onImported, onError }) {
  const fields = schema?.fields || [];
  const fieldNames = new Set(fields.map((f) => f.name.toLowerCase()));

  const [csvText, setCsvText] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const [fileObj, setFileObj] = useState(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    setFileObj(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setCsvText(text);
        setPreview(parseCSVPreview(text));
        setResult(null);
      }
    };
    // Slicing the file prevents the browser from crashing on massive CSV files.
    // We only need the first few lines for the preview table anyway.
    const slice = file.slice(0, 1024 * 50); // Read only first 50KB
    reader.readAsText(slice);
  }, []);

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  }

  function onFileChange(e) {
    const file = e.target?.files?.[0];
    handleFile(file);
  }

  async function doImport() {
    if (!fileObj) return;
    setImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", fileObj);
      const res = await importCSV(modelName, formData);

      // Async job pattern: backend returns { jobId, status: "processing" }
      if (res.jobId) {
        // Poll for completion
        let job = res;
        while (job.status === "processing") {
          await new Promise((r) => setTimeout(r, 1000));
          job = await getJobStatus(res.jobId);
        }
        setResult(job);
      } else {
        // Fallback for synchronous response
        setResult(res);
      }
      onImported?.();
    } catch (err) {
      onError?.(err);
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFileObj(null);
    setCsvText(null);
    setPreview(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  // ── Upload zone ──
  if (!preview) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-gray-600">
            Import CSV → {modelName}
          </p>
        </div>
        <div className="p-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-all ${
              dragOver
                ? "border-purple-600 bg-purple-100"
                : "border-gray-300 bg-white hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="rounded-lg bg-purple-100 p-2 text-purple-600">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-purple-600">Click to upload</span> or drag &amp; drop
            </p>
            <p className="text-xs text-gray-600">.csv files only</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </div>
    );
  }

  // ── Preview + Confirm ──
  const matchedHeaders = preview.headers.filter((h) => fieldNames.has(h.toLowerCase()));
  const unmatchedHeaders = preview.headers.filter((h) => !fieldNames.has(h.toLowerCase()));

  // Empty or invalid CSV handling
  if (matchedHeaders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm transition hover:shadow-md">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 rounded-lg bg-purple-100 p-2 text-purple-600">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <p className="text-sm font-semibold text-gray-900">Invalid CSV structure</p>
        <p className="mt-1 text-xs text-gray-600">No columns matched the {modelName} schema.</p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 hover:shadow-md"
        >
          Try another file
        </button>
      </div>
    );
  }

  // Create an error map for quick row lookup (1-indexed rows)
  const errorMap = new Map();
  if (result?.errors) {
    result.errors.forEach(err => {
      // Store the first error for each row
      if (!errorMap.has(err.row)) {
        errorMap.set(err.row, err);
      }
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <p className="text-xs font-semibold tracking-wide text-gray-600">
          CSV Preview → {modelName}
          <span className="ml-2 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
            {preview.rows.length} rows
          </span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 hover:shadow-md"
            onClick={reset}
          >
            {result ? "Close" : "Cancel"}
          </button>
          {!result && (
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700 hover:shadow-md disabled:opacity-50"
              onClick={doImport}
              disabled={importing || preview.rows.length === 0}
            >
              {importing && <Spinner size="sm" />}
              {importing ? "Importing…" : `Import ${preview.rows.length} rows`}
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Column match info */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {matchedHeaders.map((h) => (
            <span key={h} className="rounded-full border border-purple-200 bg-purple-100 px-2 py-0.5 text-[11px] text-purple-600">
              ✓ {h}
            </span>
          ))}
          {unmatchedHeaders.map((h) => (
            <span key={h} className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600 line-through">
              {h}
            </span>
          ))}
        </div>

        {/* Result summary */}
        {result && (
          <div className={`mb-3 rounded-xl border px-3 py-2 text-sm ${
            result.failedCount === 0
              ? "border-purple-200 bg-purple-100 text-gray-900"
              : "border-gray-200 bg-gray-50 text-gray-900"
          }`}>
            {result.successCount} users imported successfully, {result.failedCount} failed
          </div>
        )}

        {/* Preview table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-2 pr-3 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-600">#</th>
                {preview.headers.map((h) => (
                  <th
                    key={h}
                    className={`py-2 pr-3 text-left text-[11px] font-semibold uppercase tracking-wide ${
                      fieldNames.has(h.toLowerCase()) ? "text-gray-600" : "text-gray-600 line-through"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, idx) => {
                const rowNum = idx + 1;
                const rowError = errorMap.get(rowNum);
                const hasError = !!rowError;
                
                // Show first 10 rows, OR rows that have errors if a result exists
                if (!result && idx >= 10) return null;
                if (result && !hasError && idx >= 10) return null;

                return (
                  <tr 
                    key={idx} 
                    className={`border-b transition hover:bg-gray-50 ${hasError ? 'border-gray-200 bg-purple-100' : 'border-gray-200'}`}
                  >
                    <td className="py-2 pr-3 text-xs text-gray-600 align-top">
                      {rowNum}
                    </td>
                    {preview.headers.map((h) => {
                      const isMatch = fieldNames.has(h.toLowerCase());
                      const isErrorField = hasError && rowError.field && h.toLowerCase() === rowError.field.toLowerCase();
                      return (
                        <td
                          key={h}
                          className={`py-2 pr-3 text-sm align-top ${
                            isMatch ? "text-gray-900" : "text-gray-600"
                          } ${isErrorField ? "font-bold text-purple-600" : ""}`}
                        >
                          <div className="flex flex-col">
                            <span>{row[h] ?? ""}</span>
                            {isErrorField && (
                              <span className="mt-0.5 text-[10px] leading-tight text-purple-600">
                                {rowError.message}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    {hasError && !rowError.field && (
                      <td className="py-2 pl-3 text-[10px] text-purple-600 align-top">
                        {rowError.message}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {preview.rows.length > 10 && !result && (
            <p className="mt-2 text-xs text-gray-600">
              Showing 10 of {preview.rows.length} rows…
            </p>
          )}
          {result && errorMap.size === 0 && preview.rows.length > 10 && (
            <p className="mt-2 text-xs text-gray-600">
              Showing 10 of {preview.rows.length} rows (All successful!)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
