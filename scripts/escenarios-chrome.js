import { http, HttpResponse } from 'msw/http'
import { worker } from '../src/mocks/browser.js'

const respuestas = {
  503: () =>
    HttpResponse.json({ error: 'Indisponibilidad de prueba' }, { status: 503 }),
  red: () => HttpResponse.error(),
  json: () =>
    new HttpResponse('{', { headers: { 'Content-Type': 'application/json' } }),
  contrato: () => HttpResponse.json({ categorias: [] }),
  vacio: () => HttpResponse.json([]),
}

let terminarDemora

export function restaurar() {
  worker.resetHandlers()
  terminarDemora?.()
  terminarDemora = undefined
}

export function liberar() {
  terminarDemora?.()
}

export function activar(caso) {
  restaurar()

  if (caso === 'demora' || caso === 'cancelar-reintento') {
    const demora = new Promise((resolve) => {
      terminarDemora = resolve
    })
    let intentos = 0
    worker.use(
      http.get('/api/libros', async ({ request }) => {
        if (
          new globalThis.URL(request.url).searchParams.get('categoriaId') !==
          'ciencia-ficcion'
        )
          return
        intentos += 1
        if (caso === 'cancelar-reintento' && intentos === 1)
          return respuestas['503']()
        await demora
        // Continuar al handler normal. El resultado tardío permite observar la cancelación.
      }),
    )
    return
  }

  if (!Object.hasOwn(respuestas, caso)) throw new Error('Escenario desconocido')
  worker.use(http.get('/api/categorias', respuestas[caso]))
}
