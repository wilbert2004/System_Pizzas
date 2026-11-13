# Emisión de licencias STARMY

1. Abre el sistema ya activado y entra a **Licencias** como administrador.
2. El cliente debe enviarte el **ID de hardware** que aparece en su pantalla de activación.
3. Escribe ese ID, el nombre del negocio si quieres, y carga `.license-issuer/vendor-private.pem` para generar la clave.
4. Envíale al cliente solo la licencia generada. En su equipo, debe pegarla en la pantalla de activación.

La clave privada vive en `.license-issuer/`, está excluida de Git y no se incluye en el instalador. No la compartas ni la cargues en un equipo del cliente. Haz una copia de seguridad privada: si se pierde, las instalaciones nuevas necesitarán una nueva clave pública y una actualización del programa.

Para activar esta copia del sistema por primera vez, antes de que exista acceso al módulo, genera una licencia en esta computadora con:

```powershell
node tools/licencias/generar.js ST-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX "Pizzería"
```

Pega el resultado en la pantalla de activación. El sistema inicia una prueba de 10 días la primera vez que se ejecuta. Al terminar, bloquea las pantallas operativas hasta activar una licencia completa. La licencia completa no caduca y solo coincide con el ID de hardware indicado.
