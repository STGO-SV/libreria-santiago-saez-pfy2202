import { http, HttpResponse } from 'msw/http'
import { handlersCatalogo } from './catalogo.js'

// Ruta provisional para comprobar la interceptación durante la Etapa 1.
export const rutaDiagnostico = '/api/diagnostico-msw'

export const handlers = [
  ...handlersCatalogo,
  http.get(`*${rutaDiagnostico}`, () =>
    HttpResponse.json({ disponible: true, origen: 'msw' }),
  ),
]
