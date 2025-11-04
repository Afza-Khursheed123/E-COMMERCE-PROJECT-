import React, { useState } from "react";
import { Sidebar } from "../components/adminComp/Sidebar";
import { Dashboard } from "../pages/Dashboard";
import { OrderMgt } from "../pages/OrderMgt";
import { UserMgt } from "../pages/UserMgt";
import { PaymentMgt } from "../pages/PaymentMgt";
import { ComplaintMgt } from "../pages/ComplaintMgt";

export default function AdminLayout() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />
      case 'users':
        return <UserMgt />
      case 'payments':
        return <PaymentMgt />
      case 'orders':
        return <OrderMgt />
      case 'complaints':
        return <ComplaintMgt />
      default:
        return <Dashboard />
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen text-gray-900">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Main Content Area */}
      <main className="ml-64 flex-1 p-8 bg-gray-50">
        {renderContent()}
      </main>
    </div>
  );
}
