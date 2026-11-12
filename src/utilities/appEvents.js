// src/utilities/appEvents.js — центральный хаб для onAppStateChanged от ядра.
// Ядро шлёт это событие при смене темы, языка, появлении обновления и т.д.
// Все компоненты подписываются через subscribe() вместо прямого присваивания window.onAppStateChanged.
//
// Дополнительно хаб отслеживает возврат оболочки на экран (visibilitychange/pageshow/focus).
// Ядро НЕ шлёт onAppStateChanged при смене цветовой схемы (она применяется только к
// SettingsActivity), поэтому оболочка сама перечитывает GetAppState при возврате.

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

function onAppStateChanged() {
  devConsole.info('🔔 onAppStateChanged')
  listeners.forEach((fn) => {
    try {
      fn()
    } catch (e) {
      devConsole.error('onAppStateChanged handler error:', e)
    }
  })
}

export function initAppEvents() {
  window.onAppStateChanged = onAppStateChanged
}

export function subscribeAppEvent(handler) {
  if (!window.onAppStateChanged) initAppEvents()
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
