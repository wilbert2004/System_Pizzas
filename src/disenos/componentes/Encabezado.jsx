import { Bell, CircleUserRound } from "lucide-react";

function Encabezado() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">
          Panel de administración
        </h2>
        <p className="text-xs text-slate-500">
          Sistema de gestión para pizzería
        </p>
      </div>

      <div className="flex items-center gap-5">
        <button className="text-slate-500 hover:text-slate-800">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-2">
          <CircleUserRound size={24} className="text-slate-600" />
          <div>
            <p className="text-sm font-medium text-slate-800">Usuario</p>
            <p className="text-xs text-slate-500">Sesión de prueba</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Encabezado;
