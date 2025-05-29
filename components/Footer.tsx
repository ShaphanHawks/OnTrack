import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-white mt-auto">
      {/* Orange divider bar */}
      <div className="w-full h-1 bg-[#F26D4B] mb-6"></div>
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Site Links</h3>
          <ul className="space-y-1">
            <li><a href="/about" className="text-gray-700 hover:text-[#F26D4B]">About us</a></li>
            <li><a href="/privacy" className="text-gray-700 hover:text-[#F26D4B]">Privacy Policy</a></li>
            <li><a href="/terms" className="text-gray-700 hover:text-[#F26D4B]">Terms of Service</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Free Tools</h3>
          <ul className="space-y-1">
            <li><a href="#" className="text-gray-700 hover:text-[#F26D4B]">Business Name Generator</a></li>
            <li><a href="#" className="text-gray-700 hover:text-[#F26D4B]">Theme Detector</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Resources</h3>
          <ul className="space-y-1">
            <li><a href="#" className="text-gray-700 hover:text-[#F26D4B]">Courses</a></li>
            <li><a href="#" className="text-gray-700 hover:text-[#F26D4B]">Glossary</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-gray-400 mt-8 pb-4">
        &copy; {new Date().getFullYear()} OnTrack Tools. All rights reserved.
      </div>
    </footer>
  );
} 