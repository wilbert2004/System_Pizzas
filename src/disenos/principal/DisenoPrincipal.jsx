import { Outlet } from "react-router-dom";
import BarraLateral from "../componentes/BarraLateral";
import Encabezado from "../componentes/Encabezado";

function DisenoPrincipal() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <div className="fixed inset-y-0 left-0 z-30 w-64">
        <BarraLateral />
      </div>

      <div className="ml-64 flex h-screen min-w-0 flex-1 flex-col">
        <Encabezado />

        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DisenoPrincipal;
