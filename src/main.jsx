import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.jsx'
import './styles/global.css'

const root = createRoot(document.getElementById('root'))

async function iniciarAplicacion() {
  if (import.meta.env.DEV && import.meta.env.VITE_MSW === 'true') {
    try {
      const { iniciarMock } = await import('./mocks/browser.js')
      await iniciarMock(import.meta.env.BASE_URL)
    } catch (error) {
      console.error('Error al iniciar Mock Service Worker:', error)
      root.render(
        <main className="contenedor contenido">
          <h1>Librería</h1>
          <p role="alert">
            No se pudo iniciar el servicio simulado. Comprueba la instalación de
            MSW y vuelve a cargar la página.
          </p>
        </main>,
      )
      return
    }
  }

  root.render(
    <StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}

void iniciarAplicacion()
