// src/stores/appTheme.js — singleton-хранилище темы приложения.
// Загружает GetAppState, применяет тему к CSS, подписывается на onAppStateChanged.
// Все компоненты получают тему через useAppTheme(), не дублируя запросы к ядру.

import { ref, computed } from 'vue'
import { getAppState } from '@/api/getAppState'
import { applyAppTheme } from '@/utilities/theme'
import { subscribeAppEvent, subscribeShellResume } from '@/utilities/appEvents'
import { isAndroidAvailable } from '@/utilities/androidApi'

/* Цветовые схемы ядра (ColorSchemeModel.getAllSchemes) — для dev-превью в браузере */
export const APP_SCHEMES = [
  { id: 'red', primary: '#F44336', accent: '#EF5350' },
  { id: 'orange', primary: '#FF9800', accent: '#FF5722' },
  { id: 'lime', primary: '#CDDC39', accent: '#D4E157' },
  { id: 'green', primary: '#4CAF50', accent: '#8BC34A' },
  { id: 'teal', primary: '#009688', accent: '#4CAF50' },
  { id: 'cyan', primary: '#00BCD4', accent: '#26C6DA' },
  { id: 'blue', primary: '#2196F3', accent: '#03A9F4' },
  { id: 'purple', primary: '#9C27B0', accent: '#E040FB' },
  { id: 'pink', primary: '#E91E63', accent: '#F06292' },
]

const { state, loadState } = getAppState()

const ready = ref(false)
let initialized = false
let loading = false

function apply() {
  applyAppTheme(state.value)
}

async function refresh(force = true) {
  /* Защита от параллельных вызовов (resume + poll + push могут сработать вместе) */
  if (loading) return
  loading = true

  /* В браузере ядра нет: мок применяем один раз при init,
     иначе периодические обновления сбрасывали бы dev-превью темы/схемы */
  if (!isAndroidAvailable()) {
    if (!ready.value) {
      await loadState(force)
      apply()
      ready.value = true
    }
    loading = false
    return
  }

  await loadState(force)
  apply()
  ready.value = true
  loading = false
}

export function useAppTheme() {
  const init = () => {
    if (initialized) return
    initialized = true

    /* Стартовое применение (дефолт/мок) до ответа ядра */
    apply()

    /* Ядро шлёт onAppStateChanged при смене темы/языка/схемы в Настройках */
    subscribeAppEvent(() => refresh(true))

    /* Ядро НЕ уведомляет о смене цветовой схемы (она перекрашивает только
       SettingsActivity), поэтому перечитываем GetAppState при возврате на оболочку.
       Первый pageshow происходит и при стартовой загрузке — до готовности
       игнорируем, иначе был бы дублирующий запрос сразу после init */
    subscribeShellResume(() => {
      if (!ready.value) return
      refresh(true)
    })

    /* Страховка: MainActivity не вызывает webView.onPause(), поэтому DOM-событие
       о возврате может не прийти. Периодически перечитываем состояние,
       пока оболочка видима. GetAppState дешёвый, интервал 30 сек — компромисс
       между отзывчивостью смены цветовой схемы и нагрузкой на IPC */
    if (isAndroidAvailable()) {
      setInterval(() => {
        if (document.visibilityState === 'visible') refresh(true)
      }, 30_000)
    }

    refresh(true)
  }

  /* Только для dev-режима (браузер): превью светлой темы */
  const devSetTheme = (theme) => {
    if (isAndroidAvailable()) return
    state.value = { ...state.value, theme }
    apply()
  }

  /* Только для dev-режима (браузер): превью цветовой схемы */
  const devSetScheme = (id) => {
    if (isAndroidAvailable()) return
    const scheme = APP_SCHEMES.find((s) => s.id === id)
    if (!scheme) return
    state.value = {
      ...state.value,
      colorScheme: { id: scheme.id, primary: scheme.primary, accent: scheme.accent },
    }
    apply()
  }

  return {
    state,
    ready: computed(() => ready.value),
    theme: computed(() => state.value.theme || 'dark'),
    themeMode: computed(() => state.value.themeMode || 'system'),
    colorScheme: computed(() => state.value.colorScheme || {}),
    init,
    refresh,
    devSetTheme,
    devSetScheme,
    isDev: !isAndroidAvailable(),
  }
}
