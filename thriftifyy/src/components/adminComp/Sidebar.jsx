import React from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

export function Sidebar({ activeSection, setActiveSection }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "User Management", icon: Users },
    { id: "payments", label: "Payments & Commission", icon: CreditCard },
    { id: "orders", label: "Orders", icon: Package },
    { id: "complaints", label: "Complaints", icon: MessageSquare },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#19535F] to-[#0B7A75] border-r border-[#D7C9AA]/20 shadow-2xl z-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#D7C9AA] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#0B7A75] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="p-6 border-b border-[#D7C9AA]/20 bg-[#19535F]/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-[#D7C9AA] to-[#c5b499] rounded-lg transform hover:rotate-180 transition-transform duration-700">
              <LayoutDashboard className="text-[#19535F] w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#F0F3F5] animate-fade-in">
              Admin CMS
            </h1>
          </div>
          <p className="text-sm text-[#F0F3F5]/70 ml-12 transform hover:translate-x-1 transition-transform duration-300">
            C2C Ecommerce
          </p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`relative w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-500 group overflow-hidden ${
                  isActive
                    ? "bg-gradient-to-r from-[#D7C9AA] to-[#c5b499] text-[#19535F] shadow-lg transform scale-105"
                    : "text-[#F0F3F5] hover:bg-[#19535F]/50 hover:transform hover:scale-105 hover:shadow-lg"
                } animate-slide-in-left`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Active state glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-[#D7C9AA] rounded-xl opacity-20 animate-pulse"></div>
                )}
                
                {/* Hover background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#D7C9AA] to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"></div>
                
                {/* Icon container */}
                <div className={`relative z-10 p-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? "bg-[#19535F] text-[#D7C9AA] transform rotate-12" 
                    : "bg-[#D7C9AA]/10 text-[#F0F3F5] group-hover:bg-[#D7C9AA] group-hover:text-[#19535F] group-hover:transform group-hover:rotate-12"
                }`}>
                  <Icon size={20} />
                </div>
                
                {/* Label */}
                <span className={`relative z-10 font-medium transition-all duration-300 ${
                  isActive ? "font-semibold" : "group-hover:font-semibold"
                }`}>
                  {item.label}
                </span>
                
                {/* Animated chevron */}
                <ChevronRight 
                  className={`ml-auto w-4 h-4 transition-all duration-500 ${
                    isActive 
                      ? "text-[#19535F] transform translate-x-0 opacity-100" 
                      : "text-[#F0F3F5]/50 transform -translate-x-2 opacity-0 group-hover:transform group-hover:translate-x-0 group-hover:opacity-100"
                  }`}
                />
                
                {/* Active indicator bar */}
                <div className={`absolute left-0 top-1/2 w-1 h-8 bg-[#D7C9AA] rounded-r-full transform -translate-y-1/2 transition-all duration-500 ${
                  isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 group-hover:opacity-50 group-hover:scale-y-100"
                }`}></div>
                
                {/* Ripple effect on click */}
                <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-active:opacity-20 group-active:animate-ping transition-all duration-200"></div>
              </button>
            );
          })}
        </nav>
        
        {/* Footer decoration */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex justify-center space-x-1">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className="w-1 h-1 bg-[#D7C9AA]/30 rounded-full animate-bounce"
                style={{ animationDelay: `${dot * 200}ms` }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out both;
        }
        .animate-ping {
          animation: ping 0.5s ease-out;
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </aside>
  );
}