import React from "react";
import { Box } from "lucide-react";

export function StatCard({ title, value, icon: Icon = Box, trend, trendUp }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="text-blue-600" size={24} />
        </div>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trendUp ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
