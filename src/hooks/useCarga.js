import { useSyncExternalStore } from 'react'

export function useCarga(carga) {
  return useSyncExternalStore(
    carga.observar,
    carga.obtenerEstado,
    carga.obtenerEstado,
  )
}
