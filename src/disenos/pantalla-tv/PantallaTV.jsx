function PantallaTV() {
  return (
    <main className="min-h-screen bg-slate-950 text-white grid grid-cols-2">
      <section className="p-8 border-r border-slate-800">
        <h1 className="text-3xl font-bold">PEDIDOS</h1>

        <div className="mt-8 text-center text-slate-400">
          Aquí aparecerán los pedidos para recoger.
        </div>
      </section>

      <section className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">PUBLICIDAD</h2>

          <p className="mt-4 text-slate-400">
            Espacio para imágenes y videos promocionales.
          </p>
        </div>
      </section>
    </main>
  );
}

export default PantallaTV;
