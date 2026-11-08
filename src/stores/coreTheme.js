// src/stores/coreTheme.js —singleton-хранилище темы ядра.
// Загружает GetCoreState, применяет тему к CSS, подписывается на onCoreStateChanged.
// Все компоненты получают тему через useCoreTheme(), не дублируя запросы к ядру.

import { ref, computed } from 'vue'
import { getCoreState } from '@/api/getCoreState'
import { applyCoreTheme } from '@/utilities/theme'
import { subscribeCoreEvent } from '@/utilities/coreEvents'
import { isAndroidAvailable } from '@/utilities/androidApi'

/* Цветовые схемы ядра (ColorSchemeModel.getAllSchemes) — для dev-превью в браузере */
export const CORE_SCHEMES = [
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

const { state, loadState } = getCoreState()

const ready = ref(false)
let initialized = false

function apply() {
  applyCoreTheme(state.value)
}

async function refresh(force = true) {
  await loadState(force)
  apply()
  ready.value = true
}

export function useCoreTheme() {
  const init = () => {
    if (initialized) return
    initialized = true

    /* Стартовое применение (дефолт/мок) до ответа ядра */
    apply()

    /* Ядро шлёт onCoreStateChanged при смене темы/языка/схемы в Настройках */
    subscribeCoreEvent(() => refresh(true))

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
    const scheme = CORE_SCHEMES.find((s) => s.id === id)
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
