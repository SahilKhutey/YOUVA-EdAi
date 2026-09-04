"use client";

import { UploadCloud, FileText, X } from "lucide-react";
import { useState } from "react";

export default function DocumentUpload({
  onUploadComplete,
}: {
  onUploadComplete?: (fileName: string) => void;
}) {
  const [isSummarizing, setIsSummarizing] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          if (onUploadComplete) onUploadComplete(file.name);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="h-[120px] bg-white rounded-2xl shadow-sm border border-border p-4 flex gap-4 shrink-0">
      {/* Drag & Drop Area */}
      <label className="flex-1 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group relative overflow-hidden">
        <input
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 w-full px-4">
            <span className="text-xs font-medium text-primary">
              Uploading... {uploadProgress}%
            </span>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
              Click to upload or drag files
            </span>
          </>
        )}
      </label>

      {/* Recent Uploads / Status */}
      <div className="w-1/3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Recent</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSummarizing}
              onChange={(e) => setIsSummarizing(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            AI Auto-Summary
          </label>
        </div>

        <div className="flex-1 bg-muted/30 rounded-lg p-2 flex items-center gap-2 border border-border/50">
          <div className="p-1.5 bg-white rounded-md shadow-sm text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              Chapter_4_Physics.pdf
            </p>
            <p className="text-[10px] text-muted-foreground">
              2.4 MB • Just now
            </p>
          </div>
          <button className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-white">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
