"use client";

import { Send, Mic, Paperclip, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

export default function InputBar({
  onSearch,
  isLoading,
}: {
  onSearch: (query: string) => void;
  isLoading: boolean;
}) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      onSearch(input);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 lg:left-[240px] right-0 h-[88px] bg-white border-t border-border flex items-center px-6 gap-4 z-40">
      {/* Input Controls */}
      <div className="w-[160px] flex items-center gap-2 text-muted-foreground">
        <button
          className="p-2 hover:bg-muted rounded-full transition-colors"
          title="Upload Image"
        >
          <ImageIcon className="h-5 w-5" />
        </button>
        <button
          className="p-2 hover:bg-muted rounded-full transition-colors"
          title="Attach File"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <button
          className="p-2 hover:bg-muted rounded-full transition-colors"
          title="Voice Input"
        >
          <Mic className="h-5 w-5" />
        </button>
      </div>

      {/* Text Box */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading}
          placeholder={
            isLoading
              ? "AI is thinking..."
              : "Ask a question or type '/' for commands..."
          }
          className="w-full h-12 bg-muted/30 border border-border rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground font-medium disabled:opacity-50"
        />
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={isLoading || !input.trim()}
        className="w-14 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary-hover shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all duration-200 active:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  );
}
