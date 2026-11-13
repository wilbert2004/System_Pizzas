import { sign } from "node:crypto";
import { readFileSync } from "node:fs";

const [hardwareId, ...partesCliente] = process.argv.slice(2);
const cliente = partesCliente.join(" ").slice(0, 100);
if (!/^ST-(?:[A-F0-9]{4}-){7}[A-F0-9]{4}$/.test(hardwareId || "")) {
  console.error("Uso: node tools/licencias/generar.js ST-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX [cliente]");
  process.exitCode = 1;
} else {
  const key = readFileSync(".license-issuer/vendor-private.pem", "utf8");
  const datos = { producto: "starmy-pizzeria", version: 1, tipo: "completa", hardwareId, cliente, emitidaEn: new Date().toISOString() };
  const contenido = Buffer.from(JSON.stringify(datos));
  const token = `STARMY1.${contenido.toString("base64url")}.${sign(null, contenido, key).toString("base64url")}`;
  console.log(token);
}
