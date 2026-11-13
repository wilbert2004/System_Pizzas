import { useState } from "react";
import { Outlet } from "react-router-dom";
import BarraLateral from "../componentes/BarraLateral";
import Encabezado from "../componentes/Encabezado";

function DisenoPrincipal() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  return (
    <div className="flex h-[100dvh] min-w-0 overflow-hidden bg-slate-100">
      {menuAbierto && <button type="button" aria-label="Cerrar menú" onClick={() => setMenuAbierto(false)} className="fixed inset-0 z-30 bg-slate-950/50 md:hidden" />}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-200 md:translate-x-0 ${menuAbierto ? "translate-x-0" : "-translate-x-full"}`}>
        <BarraLateral onNavigate={() => setMenuAbierto(false)} />
      </div>

      <div className="flex h-[100dvh] min-w-0 flex-1 flex-col md:ml-64">
        <Encabezado onMenu={() => setMenuAbierto(true)} />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DisenoPrincipal;
