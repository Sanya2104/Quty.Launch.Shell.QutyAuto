// src/api/apps/getApps.js
import { ref } from 'vue'
import { isAndroidAvailable, mockApps, AndroidApiCall } from '@/utilities/androidApi'
import { devConsole } from '@/utilities/devConsole'

export function getApps() {
  const apps = ref([])
  const loading = ref(true)
  const error = ref(null)

  const loadApps = async () => {
    if (!loading.value && apps.value.length > 0) return

    loading.value = true
    error.value = null

    try {
      if (!isAndroidAvailable()) {
        devConsole.log('🛠️ Режим разработки: используются тестовые данные')
        apps.value = mockApps
        loading.value = false
        return
      }

      // АСИНХРОННЫЙ ВЫЗОВ
      AndroidApiCall(
        'GetApps',
        null,
        // onSuccess
        (data) => {
          apps.value = data || []
          devConsole.info(`✅ Загружено приложений: ${apps.value.length}`)
          loading.value = false
        },
        // onError
        (err) => {
          devConsole.error('❌ Ошибка загрузки приложений:', err)
          error.value = err || 'Не удалось загрузить список приложений'
          loading.value = false

          if (import.meta.env.DEV && !isAndroidAvailable()) {
            apps.value = mockApps
            error.value = null
          }
        }
      )
    } catch (err) {
      devConsole.error('❌ Ошибка загрузки приложений:', err)
      error.value = err.message || 'Не удалось загрузить список приложений'
      loading.value = false

      if (import.meta.env.DEV && !isAndroidAvailable()) {
        apps.value = mockApps
        error.value = null
      }
    }
  }

  return {
    apps,
    loading,
    error,
    loadApps,
  }
}
