import React from "react";
import { StatCard } from "../components/adminComp/StatCard";
import {
  Users,
  CreditCard,
  Package2 as Package,
  MessageSquare,
} from "lucide-react";

export function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value="2,847"
          icon={Users}
          trend="+12.5%"
          trendUp={true}
        />
        <StatCard
          title="Total Revenue"
          value="$48,392"
          icon={CreditCard}
          trend="+8.2%"
          trendUp={true}
        />
        <StatCard
          title="Active Orders"
          value="156"
          icon={Package}
          trend="-3.1%"
          trendUp={false}
        />
        <StatCard
          title="Open Complaints"
          value="23"
          icon={MessageSquare}
          trend="-15.4%"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Section */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Orders
          </h2>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">Order #{1000 + i}</p>
                  <p className="text-sm text-gray-500">Customer {i}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  Completed
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Commission Summary Section */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Commission Summary
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Commission Earned</span>
              <span className="text-lg font-bold text-gray-900">$4,839</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Payouts</span>
              <span className="text-lg font-bold text-gray-900">$1,234</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Commission Rate</span>
              <span className="text-lg font-bold text-gray-900">10%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
