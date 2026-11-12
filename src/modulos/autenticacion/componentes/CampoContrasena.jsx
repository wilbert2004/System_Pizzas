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
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
      />

      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}
