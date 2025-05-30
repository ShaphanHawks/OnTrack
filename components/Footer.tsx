import React from "react";
import { ScanCounter } from "./scan-counter";

export default function Footer() {
  return (
    <footer className="w-full bg-white mt-auto">
      {/* Orange divider bar with larger gap above */}
      <div className="mt-[10vw] w-full h-px bg-[#F26D4B] mb-6"></div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-center">
          <ScanCounter />
        </div>
      </div>
      <div className="text-center text-xs text-gray-400 mt-8 pb-4">
        &copy; {new Date().getFullYear()} OnTrack Tools. All rights reserved.
      </div>
    </footer>
  );
} 