import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function CampoContrasena({
  value,
  onChange,
  placeholder = "Contraseña",
  autoComplete = "current-password",
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3.5 pl-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100/70"
      />

      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}
