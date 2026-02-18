import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-gray-600 mb-6">Page not found.</p>
        <Link to="/" className="px-4 py-2 rounded-md bg-indigo-600 text-white">
          Go home
        </Link>
      </div>
    </div>
  );
}
