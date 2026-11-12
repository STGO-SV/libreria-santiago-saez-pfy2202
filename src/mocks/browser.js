import { setupWorker } from 'msw/browser'
import { handlers } from './handlers/index.js'

export const worker = setupWorker(...handlers)

export function iniciarMock(base) {
  return worker.start({
    onUnhandledFrame: 'bypass',
    serviceWorker: { url: `${base}mockServiceWorker.js` },
  })
}
