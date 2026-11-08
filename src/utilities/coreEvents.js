// src/utilities/coreEvents.js — центральный хаб для onCoreStateChanged от ядра.
// Ядро шлёт это событие при смене темы, языка, появлении обновления и т.д.
// Все компоненты подписываются через subscribe() вместо прямого присваивания window.onCoreStateChanged.

import { devConsole } from './devConsole'

const listeners = new Set()

function onCoreStateChanged() {
  devConsole.info('🔔 onCoreStateChanged')
  listeners.forEach((fn) => {
    try {
      fn()
    } catch (e) {
      devConsole.error('onCoreStateChanged handler error:', e)
    }
  })
}

export function initCoreEvents() {
  window.onCoreStateChanged = onCoreStateChanged
}

export function subscribeCoreEvent(handler) {
  if (!window.onCoreStateChanged) initCoreEvents()
  listeners.add(handler)
  return () => listeners.delete(handler)
}
