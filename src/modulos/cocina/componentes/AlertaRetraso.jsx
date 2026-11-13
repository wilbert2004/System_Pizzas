export default function AlertaRetraso({ cantidad }) {
  if (!cantidad) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
      <span className="text-2xl">⚠️</span>
      <div>
        <p className="font-bold">
          {cantidad}{" "}
          {cantidad === 1 ? "pedido retrasado" : "pedidos retrasados"}
        </p>
        <p className="text-sm">Revisa los pedidos marcados en rojo.</p>
      </div>
    </div>
  );
}
