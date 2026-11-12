# Librería

Desarrollo Frontend II (PFY2202) · Experiencia 2, Semana 4 · Forma B.

Aplicación React para explorar categorías de libros mediante una API REST simulada con Mock Service Worker (MSW). El listado de categorías por REST y la navegación con React Router corresponden a la actividad. El listado filtrado y la ficha amplían el recorrido del catálogo.

## Entorno y ejecución

| Tecnología        | Versión |
| ----------------- | ------- |
| Node.js           | 24.11.0 |
| npm               | 11.20.0 |
| React y React DOM | 19.3.1  |
| React Router      | 8.5.0   |
| Vite              | 8.3.5   |
| MSW               | 3.0.5   |
| ESLint            | 10.13.0 |
| Prettier          | 3.9.10  |

El proyecto utiliza JavaScript ESM y CSS propio. Las versiones de Node compatibles figuran en `package.json`.

```powershell
npm ci
$env:VITE_MSW = 'true'
npm run dev
```

Abrir la URL indicada por Vite. En desarrollo, con esta variable activa, React espera el registro del worker antes de renderizar. `npm run msw:init` regenera `public/mockServiceWorker.js`.

## Arquitectura y estructura

React Router conecta las vistas con el layout compartido. Las vistas se suscriben a cargas del servicio de catálogo, que consulta mediante fetch y valida el contrato JSON. MSW intercepta las solicitudes en desarrollo. Los componentes de presentación reciben los datos desde el servicio.

| Ruta de archivos             | Responsabilidad                                           |
| ---------------------------- | --------------------------------------------------------- |
| src/pages/, src/layouts/     | Vistas, navegación y cargas compartidas.                  |
| src/components/, src/hooks/  | Presentación y suscripción a los estados de carga.        |
| src/services/                | Acceso HTTP, validación, deduplicación y cancelación.     |
| src/mocks/                   | Arranque del worker, handlers y datos demostrativos.      |
| src/styles/                  | Estilos de la interfaz.                                   |
| public/mockServiceWorker.js  | Worker requerido para reproducir la demostración.         |
| tests/                       | Pruebas de contratos, servicios y render estático.        |
| scripts/escenarios-chrome.js | Overrides temporales para pruebas manuales en desarrollo. |

## Rutas

| Ruta              | Vista                  |
| ----------------- | ---------------------- |
| `/`               | Inicio                 |
| `/categorias`     | Categorías             |
| `/categorias/:id` | Libros de la categoría |
| `/libros/:id`     | Ficha del libro        |
| Cualquier otra    | Página no encontrada   |

## Contrato REST

| GET                           | HTTP 200                                                    | HTTP 404                    |
| ----------------------------- | ----------------------------------------------------------- | --------------------------- |
| `/api/categorias`             | Arreglo de categorías                                       | —                           |
| `/api/libros`                 | Arreglo de libros                                           | —                           |
| `/api/libros?categoriaId=...` | Arreglo filtrado. `[]` para una categoría válida sin libros | ID de categoría desconocido |
| `/api/libros/:id`             | Objeto libro                                                | ID de libro desconocido     |
| `/api/diagnostico-msw`        | `{ disponible: true, origen: 'msw' }`                       | —                           |

Las categorías tienen `id`, `nombre` y `descripcion` opcional. Los libros tienen `id`, `titulo`, `autor`, `categoriaId` y `descripcion` opcional. Las respuestas 404 usan un objeto JSON con la propiedad `error`.

Los datos demostrativos incluyen seis categorías y seis libros. Poesía es una categoría válida sin libros. El frontend obtiene los datos mediante `fetch`. Las vistas anuncian la carga y los resultados vacíos, distinguen los recursos inexistentes y permiten reintentar fallos HTTP recuperables, de red o de formato. Las categorías y listas exitosas se reutilizan en memoria durante la sesión de la aplicación. Una carga en curso se comparte y se cancela cuando se queda sin suscriptores.

## Validación

```powershell
npm test
npm run lint
npm run format:check
npm run build
```

Las 22 pruebas automatizadas aprobadas usan Node y MSW con los handlers compartidos. Cubren contratos, navegación y marcado accesible, errores HTTP y de red, JSON mal formado o incompatible con el contrato, reintentos y cancelación.

Se informaron 18 comprobaciones manuales satisfactorias en Chrome. Nueve cubrieron navegación y catálogo y nueve verificaron errores, recuperación, carga y eficiencia. En el recorrido Inicio → Categorías → Ciencia Ficción → Dune → regreso a categorías, el panel Red mostró tres GET con HTTP 200 del Service Worker. Volver a Categorías reutilizó los datos sin emitir otro GET.

El módulo scripts/escenarios-chrome.js permite activar y restaurar escenarios de prueba desde la consola de Vite. Se importa solo para las comprobaciones manuales y queda fuera de la compilación.

## Distribución

La demostración requiere el servidor de desarrollo y VITE_MSW=true. npm run build genera dist/ con el arranque de MSW desactivado. Para ejecutar esa compilación se requiere una API compatible y fallback a index.html para entradas directas de React Router. La entrega en GitHub corresponde al código fuente. La aplicación no está desplegada en GitHub Pages.

[Guía de MSW para navegador](https://mswjs.io/guides/integrations/browser/) · [Guía de MSW para Node](https://mswjs.io/guides/integrations/node/)

## Procedencia

La arquitectura toma como referencia el layout y las protecciones de carga de Despensa Verde. [Repositorio de origen y commit de referencia](https://github.com/STGO-SV/supermercado-santiago-saez-pfy2202/tree/c9ed9562bd4b490edffd4eb70382dc56221a3100)
