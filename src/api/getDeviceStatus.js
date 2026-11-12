// src/api/getDeviceStatus.js
import { ref } from 'vue'
import { isAndroidAvailable, AndroidApiCall, mockDeviceStatus } from '@/utilities/androidApi'
import { devConsole } from '@/utilities/devConsole'

export function getDeviceStatus() {
  const status = ref({
    cpuTemp: null,
    internetSpeed: null,
    volume: null,
    gsmSignal: null,
    gsmNetworkType: null,
    wifiSignalLevel: null,
    bluetooth: null,
    wifi: null,
    gps: null,
    usbConnected: null,
  })

  const loading = ref(true)
  const error = ref(null)

  const loadStatus = async () => {
    loading.value = true
    error.value = null

    try {
      if (!isAndroidAvailable()) {
        devConsole.log('🛠️ Режим разработки: используются тестовые данные')
        status.value = mockDeviceStatus
        loading.value = false
        return
      }

      AndroidApiCall(
        'GetDeviceStatus',
        null,
        (data) => {
          status.value = data || mockDeviceStatus
          devConsole.log('✅ DeviceStatus загружен:', JSON.stringify(status.value, null, 2))
          loading.value = false
        },
        (err) => {
          devConsole.error('❌ Ошибка загрузки DeviceStatus:', err)
          error.value = err || 'Не удалось загрузить статус устройства'
          loading.value = false

          if (import.meta.env.DEV && !isAndroidAvailable()) {
            status.value = mockDeviceStatus
            error.value = null
          }
        }
      )
    } catch (err) {
      devConsole.error('❌ Ошибка загрузки DeviceStatus:', err)
      error.value = err.message || 'Не удалось загрузить статус устройства'
      loading.value = false

      if (import.meta.env.DEV && !isAndroidAvailable()) {
        status.value = mockDeviceStatus
        error.value = null
      }
    }
  }

  const updateStatus = async (key, value) => {
    status.value[key] = value
  }

  let intervalId = null

  const startPolling = (interval = 1000) => {
    if (!isAndroidAvailable()) {
      devConsole.log('🛠️ Режим разработки: polling отключён')
      return
    }

    if (intervalId) clearInterval(intervalId)
    intervalId = setInterval(() => {
      loadStatus()
    }, interval)
    devConsole.log(`✅ Polling запущен с интервалом ${interval}ms`)
  }

  const stopPolling = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
      devConsole.log('⏹️ Polling остановлен')
    }
  }

  return {
    status,
    loading,
    error,
    loadStatus,
    updateStatus,
    startPolling,
    stopPolling,
  }
}
