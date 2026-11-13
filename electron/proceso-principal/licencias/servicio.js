import { app } from "electron";
import { createHash, verify } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cpus, hostname, networkInterfaces, platform, arch } from "node:os";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { CLAVE_PUBLICA_LICENCIAS } from "./clave-publica.js";

function obtenerHuellaHardware() {
  let semilla = "";
  if (platform() === "win32") {
    try {
      const salida = execFileSync("reg", ["query", "HKLM\\SOFTWARE\\Microsoft\\Cryptography", "/v", "MachineGuid"], { encoding: "utf8", windowsHide: true });
      semilla = salida.match(/MachineGuid\s+REG_SZ\s+([^\s]+)/i)?.[1] || "";
    } catch { /* fallback compatible con otros entornos */ }
  }
  if (!semilla) {
    const macs = Object.values(networkInterfaces()).flat().filter((item) => item && !item.internal && item.mac !== "00:00:00:00:00:00").map((item) => item.mac).sort();
    semilla = [hostname(), platform(), arch(), cpus()[0]?.model || "", ...macs].join("|");
  }
  return `ST-${createHash("sha256").update(`starmy-pizzeria:${semilla}`).digest("hex").slice(0, 32).toUpperCase().match(/.{1,4}/g).join("-")}`;
}

function decodificar(licencia) {
  const partes = String(licencia || "").trim().split(".");
  if (partes.length !== 3 || partes[0] !== "STARMY1") throw new Error("La licencia no tiene un formato válido.");
  const contenido = Buffer.from(partes[1], "base64url");
  const firma = Buffer.from(partes[2], "base64url");
  if (!verify(null, contenido, CLAVE_PUBLICA_LICENCIAS, firma)) throw new Error("La firma de la licencia no es válida.");
  const datos = JSON.parse(contenido.toString("utf8"));
  if (datos.producto !== "starmy-pizzeria" || datos.version !== 1) throw new Error("La licencia no corresponde a este sistema.");
  return datos;
}

function archivoLicencia() { return join(app.getPath("userData"), "licencia.json"); }
function archivoDemo() { return join(app.getPath("userData"), "demo.json"); }
const DURACION_DEMO_MS = 10 * 24 * 60 * 60 * 1000;
const RUTA_REGISTRO_DEMO = "HKCU\\Software\\STARMY\\Pizzeria";

function leerDemoRegistrado() {
  let archivo = null;
  try {
    archivo = JSON.parse(readFileSync(archivoDemo(), "utf8"));
  } catch { /* usar el respaldo del registro de Windows */ }
  if (platform() !== "win32") return archivo;
  try {
    const salida = execFileSync("reg", ["query", RUTA_REGISTRO_DEMO], { encoding: "utf8", windowsHide: true });
    const inicio = salida.match(/DemoInicio\s+REG_SZ\s+(\S+)/i)?.[1];
    const ultimo = salida.match(/DemoUltimoUso\s+REG_SZ\s+(\S+)/i)?.[1];
    const registro = inicio ? { inicio, ultimoUso: ultimo || inicio } : null;
    if (!archivo) return registro;
    return {
      inicio: [archivo.inicio, registro?.inicio].filter(Boolean).sort((a, b) => Date.parse(a) - Date.parse(b))[0],
      ultimoUso: [archivo.ultimoUso, registro?.ultimoUso].filter(Boolean).sort((a, b) => Date.parse(b) - Date.parse(a))[0],
    };
  } catch { return archivo; }
}

function guardarDemo(registro) {
  const ruta = archivoDemo();
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, JSON.stringify(registro), { mode: 0o600 });
  if (platform() !== "win32") return;
  try {
    execFileSync("reg", ["add", RUTA_REGISTRO_DEMO, "/v", "DemoInicio", "/t", "REG_SZ", "/d", registro.inicio, "/f"], { windowsHide: true, stdio: "ignore" });
    execFileSync("reg", ["add", RUTA_REGISTRO_DEMO, "/v", "DemoUltimoUso", "/t", "REG_SZ", "/d", registro.ultimoUso, "/f"], { windowsHide: true, stdio: "ignore" });
  } catch { /* el respaldo local sigue disponible si Windows no permite guardar el marcador */ }
}

export function crearServicioLicencias(obtenerSesion) {
  function estado() {
    const hardwareId = obtenerHuellaHardware();
    let guardada = "";
    try {
      guardada = JSON.parse(readFileSync(archivoLicencia(), "utf8")).licencia;
    } catch { /* licencia pendiente de activación */ }
    if (guardada) {
      try {
      const datos = decodificar(guardada);
      if (datos.hardwareId === hardwareId && datos.tipo === "completa") return { hardwareId, activa: true, demo: false, diasRestantes: 0, licencia: guardada, cliente: datos.cliente || "" };
      } catch { /* licencia inválida: consultar el periodo de prueba */ }
    }
    const ahora = Date.now();
    let registro = leerDemoRegistrado();
    if (!registro) registro = { inicio: new Date(ahora).toISOString(), ultimoUso: new Date(ahora).toISOString(), hardwareId };
    const inicio = Date.parse(registro.inicio);
    const ultimoUso = Date.parse(registro.ultimoUso || registro.inicio);
    const relojAtrasado = ahora + 5 * 60 * 1000 < ultimoUso;
    const ultimoUsoSeguro = new Date(Math.max(ahora, ultimoUso)).toISOString();
    registro = { ...registro, inicio: Number.isFinite(inicio) ? new Date(inicio).toISOString() : new Date(ahora).toISOString(), ultimoUso: ultimoUsoSeguro };
    guardarDemo(registro);
    const transcurrido = Math.max(0, ahora - Date.parse(registro.inicio));
    const diasRestantes = Math.max(0, Math.ceil((DURACION_DEMO_MS - transcurrido) / (24 * 60 * 60 * 1000)));
    const demoVigente = !relojAtrasado && transcurrido < DURACION_DEMO_MS;
    return { hardwareId, activa: demoVigente, demo: demoVigente, expirado: !demoVigente, diasRestantes, licencia: "", cliente: "" };
  }

  function activar({ licencia }) {
    const actual = estado();
    const datos = decodificar(licencia);
    if (datos.hardwareId !== actual.hardwareId) throw new Error("Esta licencia fue generada para otro equipo.");
    if (datos.tipo !== "completa") throw new Error("La licencia no habilita la versión completa.");
    const ruta = archivoLicencia();
    mkdirSync(dirname(ruta), { recursive: true });
    writeFileSync(ruta, JSON.stringify({ licencia: String(licencia).trim() }), { mode: 0o600 });
    return { activa: true, cliente: datos.cliente || "" };
  }

  return { estado, activar };
}
