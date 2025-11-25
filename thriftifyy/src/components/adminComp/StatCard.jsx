import React from "react";
import { Box, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

export function StatCard({ title, value,  trend, trendUp }) {
  return (
    <div className="group relative">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#19535F] to-[#0B7A75] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl group-hover:blur-0 animate-pulse-slow"></div>
      
      {/* Main card */}
      <div className="relative bg-[#19535F] rounded-2xl p-6 border border-[#D7C9AA]/20 shadow-2xl transform group-hover:scale-105 group-hover:shadow-2xl transition-all duration-500 hover:border-[#D7C9AA]/40 animate-slide-in-up">
        {/* Floating particles */}
        <div className="absolute top-2 right-2 w-2 h-2 bg-[#D7C9AA] rounded-full opacity-0 group-hover:opacity-100 animate-bounce animation-delay-100"></div>
        <div className="absolute bottom-2 left-2 w-1 h-1 bg-[#D7C9AA] rounded-full opacity-0 group-hover:opacity-100 animate-bounce animation-delay-300"></div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-[#D7C9AA] to-[#c5b499] rounded-xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg">
              <Icon className="text-[#19535F]" size={24} />
            </div>
            {/* Icon glow effect */}
            <div className="absolute inset-0 p-3 bg-[#D7C9AA] rounded-xl opacity-0 group-hover:opacity-30 blur-md group-hover:animate-pulse transition-all duration-500"></div>
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full border backdrop-blur-sm transition-all duration-300 transform group-hover:scale-110 ${
              trendUp 
                ? "bg-green-500/20 text-green-300 border-green-500/30" 
                : "bg-red-500/20 text-red-300 border-red-500/30"
            }`}>
              {trendUp ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{trend}</span>
            </div>
          )}
        </div>
        
        <h3 className="text-[#F0F3F5]/70 text-sm font-medium mb-2 transform group-hover:translate-x-1 transition-transform duration-300">
          {title}
        </h3>
        
        <p className="text-3xl font-bold text-[#F0F3F5] transform group-hover:scale-105 transition-transform duration-300">
          {value}
        </p>
        
        {/* Animated underline */}
        <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-[#D7C9AA] to-transparent group-hover:w-full transition-all duration-700 rounded-full"></div>
      </div>

      <style jsx>{`
        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        .animate-slide-in-up {
          animation: slide-in-up 0.6s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        .animation-delay-100 {
          animation-delay: 100ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}