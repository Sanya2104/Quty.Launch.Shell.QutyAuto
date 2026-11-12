// src/api/getDeviceInfo.js
import { ref } from 'vue'
import { isAndroidAvailable, AndroidApiCall, mockDeviceInfo } from '@/utilities/androidApi'
import { devConsole } from '@/utilities/devConsole'

export function getDeviceInfo() {
  const info = ref({
    manufacturer: null,
    brand: null,
    model: null,
    device: null,
    androidVersion: null,
    sdkInt: null,
    screenWidthPx: null,
    screenHeightPx: null,
    densityDpi: null,
    locale: null,
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
        info.value = { ...mockDeviceInfo }
        loading.value = false
        return
      }

      const data = await new Promise((resolve, reject) => {
        AndroidApiCall('GetDeviceInfo', null, resolve, reject)
      })

      info.value = data || mockDeviceInfo
      devConsole.log('✅ DeviceInfo загружен')
      loading.value = false
    } catch (err) {
      devConsole.error('❌ Ошибка загрузки DeviceInfo:', err)
      error.value = err.message || 'Не удалось загрузить информацию об устройстве'
      loading.value = false

      if (import.meta.env.DEV) {
        info.value = { ...mockDeviceInfo }
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
