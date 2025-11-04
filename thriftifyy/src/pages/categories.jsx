import React from "react";
import Navbar from "../components/navbar/navbar.jsx";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-3xl font-bold mb-4">Wcategories 🛍️</h1>
        <p className="text-gray-600">You are now on the Home Page.</p>
      </div>
    </>
  );
}
