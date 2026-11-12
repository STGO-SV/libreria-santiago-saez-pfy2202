export const rutaCategorias = '/api/categorias'

export class ErrorPeticion extends Error {
  constructor(tipo, { status, cause } = {}) {
    super(tipo, { cause })
    this.name = 'ErrorPeticion'
    this.tipo = tipo
    this.status = status
  }
}

export async function obtenerJson(url, { signal } = {}) {
  let respuesta
  try {
    respuesta = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    })
  } catch (cause) {
    signal?.throwIfAborted()
    throw new ErrorPeticion('red', { cause })
  }

  if (!respuesta.ok) {
    throw new ErrorPeticion('http', { status: respuesta.status })
  }

  try {
    return await respuesta.json()
  } catch (cause) {
    signal?.throwIfAborted()
    throw new ErrorPeticion('json', { cause })
  }
}
