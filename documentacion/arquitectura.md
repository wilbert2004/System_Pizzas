# Arquitectura del sistema de gestión para pizzería

## 1. Arquitectura general
Aplicación de escritorio desarrollada con Electron, React, Vite y JavaScript.
La base de datos será SQLite mediante `better-sqlite3`.

## 2. Organización modular
Cada módulo funcional tendrá su propia carpeta dentro de `src/modulos`.
Cada módulo administrará sus propios componentes, páginas, servicios, hooks, validaciones y estado.

## 3. Base de datos
Existirá una única base de datos SQLite.
Las consultas y operaciones estarán organizadas por módulo dentro de `electron/proceso-principal`.

## 4. Comunicación
React se comunicará con Electron mediante IPC.
La precarga (`preload`) expondrá únicamente las funciones autorizadas para cada operación.
React no tendrá acceso directo a SQLite.

## 5. Componentes compartidos
La carpeta `compartidos` contendrá únicamente elementos reutilizables por varios módulos.
No se colocará allí lógica exclusiva de un módulo.

## 6. Reglas de desarrollo
- Utilizar JavaScript en todo el proyecto.
- Nombrar carpetas y archivos en español.
- Mantener cada módulo independiente.
- Evitar duplicar código.
- Evitar dependencias circulares.
- No acceder directamente a SQLite desde React.
- Documentar los cambios importantes.
- Validar cada módulo antes de avanzar.