// src/utilities/coreEvents.js — центральный хаб для onCoreStateChanged от ядра.
// Ядро шлёт это событие при смене темы, языка, появлении обновления и т.д.
// Все компоненты подписываются через subscribe() вместо прямого присваивания window.onCoreStateChanged.
//
// Дополнительно хаб отслеживает возврат оболочки на экран (visibilitychange/pageshow/focus).
// Ядро НЕ шлёт onCoreStateChanged при смене цветовой схемы (она применяется только к
// SettingsActivity), поэтому оболочка сама перечитывает GetCoreState при возврате.

import { devConsole } from './devConsole'

const listeners = new Set()
const resumeListeners = new Set()

let resumeInitialized = false
let resumeTimer = null

/* Дебаунс: pageshow + focus + visibilitychange приходят пачкой при одном возврате */
function scheduleResume(reason) {
  if (resumeTimer) clearTimeout(resumeTimer)
  resumeTimer = setTimeout(() => {
    resumeTimer = null
    devConsole.info(`🔄 Оболочка вернулась на экран (${reason})`)
    resumeListeners.forEach((fn) => {
      try {
        fn(reason)
      } catch (e) {
        devConsole.error('onShellResume handler error:', e)
      }
    })
  }, 300)
}

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

/** Подписка на возврат оболочки на экран. Возвращает функцию отписки. */
export function subscribeShellResume(handler) {
  if (!resumeInitialized) {
    resumeInitialized = true

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') scheduleResume('visibilitychange')
    })

    window.addEventListener('pageshow', (event) => {
      /* persisted=true — возврат из back/forward cache */
      scheduleResume(event.persisted ? 'pageshow(bfcache)' : 'pageshow')
    })

    window.addEventListener('focus', () => scheduleResume('focus'))
  }

  resumeListeners.add(handler)
  return () => resumeListeners.delete(handler)
}
