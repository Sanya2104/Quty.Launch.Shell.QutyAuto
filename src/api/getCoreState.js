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

    if (!isAndroidAvailable()) {
      devConsole.log('🛠️ Режим разработки: используются тестовые данные')
      state.value = { ...mockCoreState }
      loading.value = false
      return
    }

    /* AndroidApiCall колбэк-ориентирован: оборачиваем в Promise с timeout 5 сек,
       чтобы await loadState() реально дожидался данных и не зависал вечно */
    const timeoutMs = 5000
    try {
      const data = await Promise.race([
        new Promise((resolve, reject) => {
          AndroidApiCall('GetCoreState', null, resolve, reject)
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`GetCoreState timeout (${timeoutMs}ms)`)), timeoutMs)
        }),
      ])

      state.value = data || mockCoreState
      devConsole.log('✅ CoreState загружен')
    } catch (err) {
      devConsole.error('❌ Ошибка загрузки CoreState:', err)
      error.value = err.message || 'Не удалось загрузить состояние ядра'

      if (import.meta.env.DEV) {
        state.value = { ...mockCoreState }
        error.value = null
      }
    } finally {
      loading.value = false
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
