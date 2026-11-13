export default function ResumenProductosTV({ productos = [] }) {
  if (!productos.length) return null;

  const resumen = productos
    .map((producto) => {
      const nombre = producto.nombre || "Producto";
      const presentacion = producto.presentacion
        ? ` (${producto.presentacion})`
        : "";
      return `${producto.cantidad}× ${nombre}${presentacion}`;
    })
    .join(" · ");

  return (
    <p className="line-clamp-2 text-[10px] font-semibold leading-4 text-white/75 sm:text-xs">
      {resumen}
    </p>
  );
}
