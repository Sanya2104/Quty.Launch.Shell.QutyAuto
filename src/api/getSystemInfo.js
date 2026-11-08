// src/api/getSystemInfo.js
import { ref } from 'vue'
import { isAndroidAvailable, AndroidApiCall, mockSystemInfo } from '@/utilities/androidApi'
import { devConsole } from '@/utilities/devConsole'

export function getSystemInfo() {
  const info = ref({
    device: null,
    version: null,
  })

  const loading = ref(true)
  const error = ref(null)

  const loadInfo = async (force = false) => {
    if (!force && !loading.value && info.value.device !== null) return

    loading.value = true
    error.value = null

    try {
      if (!isAndroidAvailable()) {
        devConsole.log('🛠️ Режим разработки: используются тестовые данные')
        info.value = mockSystemInfo
        loading.value = false
        return
      }

      AndroidApiCall(
        'GetSystemInfo',
        null,
        (data) => {
          info.value = data || mockSystemInfo
          devConsole.log('✅ SystemInfo загружен')
          loading.value = false
        },
        (err) => {
          devConsole.error('❌ Ошибка загрузки SystemInfo:', err)
          error.value = err || 'Не удалось загрузить информацию о системе'
          loading.value = false

          if (import.meta.env.DEV && !isAndroidAvailable()) {
            info.value = mockSystemInfo
            error.value = null
          }
        }
      )
    } catch (err) {
      devConsole.error('❌ Ошибка загрузки SystemInfo:', err)
      error.value = err.message || 'Не удалось загрузить информацию о системе'
      loading.value = false

      if (import.meta.env.DEV && !isAndroidAvailable()) {
        info.value = mockSystemInfo
        error.value = null
      }
    }
  }

  const updateInfo = (key, value) => {
    info.value[key] = value
  }

  return {
    info,
    loading,
    error,
    loadInfo,
    updateInfo,
  }
}
