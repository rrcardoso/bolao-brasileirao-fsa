import { useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import Ranking from "./pages/Ranking";
import Classificacao from "./pages/Classificacao";
import Apostadores from "./pages/Apostadores";
import Historico from "./pages/Historico";
import Admin from "./pages/Admin";
import Sobre from "./pages/Sobre";
import { useAuth } from "./contexts/AuthContext";

const navItems = [
  { to: "/", label: "Ranking" },
  { to: "/classificacao", label: "Classificação" },
  { to: "/apostadores", label: "Apostadores" },
  { to: "/historico", label: "Histórico" },
  { to: "/sobre", label: "Sobre" },
  { to: "/admin", label: "Admin", protected: true },
];

export default function App() {
  const { authenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5" onClick={closeMenu}>
            <img src="/logo.png" alt="" className="w-8 h-8 rounded-lg" />
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Bolão Brasileirão 2026
            </h1>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                {item.label}
                {item.protected && (
                  <LockIcon authenticated={authenticated} />
                )}
              </NavLink>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 rounded-md hover:bg-white/10"
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <nav className="md:hidden border-t border-white/10 px-4 pb-3 pt-1 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={closeMenu}
                className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.to ||
                  (item.to === "/" && location.pathname === "/")
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="flex items-center gap-2">
                  {item.label}
                  {item.protected && (
                    <LockIcon authenticated={authenticated} />
                  )}
                </span>
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Routes>
          <Route path="/" element={<Ranking />} />
          <Route path="/classificacao" element={<Classificacao />} />
          <Route path="/apostadores" element={<Apostadores />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t">
        Bolão Brasileirão 2026 &mdash; Dados: Sofascore API
      </footer>
    </div>
  );
}

function LockIcon({ authenticated }: { authenticated: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ${authenticated ? "text-green-300" : "text-white/40"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      {authenticated ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      )}
    </svg>
  );
}
