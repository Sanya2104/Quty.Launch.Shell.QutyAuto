// src/api/getCoreState.js
import { ref } from 'vue'
import { isAndroidAvailable, AndroidApiCall, mockCoreState } from '@/utilities/androidApi'
import { devConsole } from '@/utilities/devConsole'

export function getCoreState() {
  const state = ref({
    theme: null,
    themeMode: null,
    language: null,
    locale: null,
    orientation: null,
    fullscreen: null,
    strictMode: null,
    animationsEnabled: null,
    updateBadge: null,
    updateBadgeColor: null,
    updateBadgeColorHex: null,
    safeModeActive: null,
    colorScheme: { id: null, primary: null, accent: null },
    shell: { name: null, displayName: null, version: null, author: null, orientation: null },
    app: { version: null, versionCode: null },
  })

  const loading = ref(true)
  const error = ref(null)

  const loadState = async (force = false) => {
    if (!force && !loading.value && state.value.theme !== null) return

    loading.value = true
    error.value = null

    try {
      if (!isAndroidAvailable()) {
        devConsole.log('🛠️ Режим разработки: используются тестовые данные')
        state.value = mockCoreState
        loading.value = false
        return
      }

      AndroidApiCall(
        'GetCoreState',
        null,
        (data) => {
          state.value = data || mockCoreState
          devConsole.log('✅ CoreState загружен')
          loading.value = false
        },
        (err) => {
          devConsole.error('❌ Ошибка загрузки CoreState:', err)
          error.value = err || 'Не удалось загрузить состояние ядра'
          loading.value = false

          if (import.meta.env.DEV && !isAndroidAvailable()) {
            state.value = mockCoreState
            error.value = null
          }
        }
      )
    } catch (err) {
      devConsole.error('❌ Ошибка загрузки CoreState:', err)
      error.value = err.message || 'Не удалось загрузить состояние ядра'
      loading.value = false

      if (import.meta.env.DEV && !isAndroidAvailable()) {
        state.value = mockCoreState
        error.value = null
      }
    }
  }

  const updateState = (key, value) => {
    state.value[key] = value
  }

  return {
    state,
    loading,
    error,
    loadState,
    updateState,
  }
}
