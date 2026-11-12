import { crearCarga } from './carga.js'
import { ErrorPeticion, obtenerJson, rutaCategorias } from './http.js'

function entidadValida(dato, campos) {
  return (
    dato !== null &&
    typeof dato === 'object' &&
    !Array.isArray(dato) &&
    campos.every(
      (campo) => typeof dato[campo] === 'string' && dato[campo].trim(),
    ) &&
    (dato.descripcion === undefined || typeof dato.descripcion === 'string')
  )
}

const esCategoria = (dato) => entidadValida(dato, ['id', 'nombre'])
const esLibro = (dato) =>
  entidadValida(dato, ['id', 'titulo', 'autor', 'categoriaId'])
const esLista = (validar) => (datos) =>
  Array.isArray(datos) && datos.every(validar)

export function crearCatalogo(origen = '') {
  const carga = (ruta, validar) =>
    crearCarga(async (signal) => {
      const datos = await obtenerJson(`${origen}${ruta}`, { signal })
      if (!validar(datos)) throw new ErrorPeticion('json')
      return datos
    })

  const listas = new Map()

  return {
    categorias: carga(rutaCategorias, esLista(esCategoria)),
    librosPorCategoria(id) {
      if (!listas.has(id)) {
        listas.set(
          id,
          carga(
            `/api/libros?categoriaId=${encodeURIComponent(id)}`,
            esLista(esLibro),
          ),
        )
      }
      return listas.get(id)
    },
    libro: (id) => carga(`/api/libros/${encodeURIComponent(id)}`, esLibro),
  }
}
