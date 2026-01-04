"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * HeaderLogoutButton Component
 * A reusable animated logout button for the top-right header area.
 * Includes confirmation modal matching the app's dark theme.
 */
export default function HeaderLogoutButton() {
  const { logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
  };

  return (
    <>
      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div 
            className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-2xl border border-slate-700"
            style={{
              animation: "slideInLeft 0.2s ease-out"
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Logout Confirmation</h3>
              <p className="mb-6 text-slate-400">Are you sure you want to end your session?</p>
              <div className="flex w-full gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-slate-600 bg-transparent text-white hover:bg-slate-700 transition-all duration-200" 
                  onClick={() => setIsLogoutModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 transition-all duration-200" 
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER LOGOUT BUTTON */}
      <button
        onClick={() => setIsLogoutModalOpen(true)}
        className="header-logout-btn flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600/20 to-red-500/10 border border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-400/50 font-medium text-sm"
        title="Logout"
      >
        <LogOut size={18} className="transition-transform duration-200 group-hover:rotate-12" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </>
  );
}
