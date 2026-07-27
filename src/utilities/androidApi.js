// src/utilities/androidApi.js

import { devConsole } from '@/utilities/devConsole'

// Заглушка списка приложений
export const mockApps = [
  {
    packageName: 'by.quty.launch.settings',
    name: 'Настройки лаунчера',
    iconBase64: '',
    isCustom: true,
  },

  {
    packageName: 'com.android.chrome',
    name: 'Chrome',
    iconBase64: '',
    isCustom: false,
  },

  {
    packageName: 'com.android.messaging',
    name: 'Сообщения',
    iconBase64: '',
    isCustom: false,
  },

  {
    packageName: 'com.android.camera',
    name: 'Камера',
    iconBase64: '',
    isCustom: false,
  },
]

// Заглушка статусов для AppBar
export const mockStatusBar = {
  notify: true, // Уведомления
  checkEngine: true, // включен/выключен
  internetSpeed: '1.2 MB/s', // Тестовая скорость
  cpuTemp: '57 °C', // Температура CPU
  volume: '33', // Громкость
  gsmSignal: 4, // Уровень сигнала GSM (0-4)
  gsmNetworkType: '4G', // тип сети (2G, 3G, 4G, 5G, H+)
  wifiSignalLevel: 4, // уровень сигнала Wi-Fi (0-4)
  wifi: true, // включен/выключен
  bluetooth: true, // включен/выключен
  usbConnected: true, // есть/нету подключений
  gps: true, // включен/выключен
}

// Проверка доступности окружения Android API
export const isAndroidAvailable = () => {
  return typeof window.Android !== 'undefined' && typeof window.Android.call === 'function'
}

/**
 * Универсальная функция вызова Android API (АСИНХРОННАЯ)
 * @param {string} method - имя метода (например, "GetApps" с большой буквы!)
 * @param {object|null} params - параметры для метода
 * @param {function} onSuccess - callback при успехе (принимает data)
 * @param {function} onError - callback при ошибке (принимает error)
 * @returns {string|null} callbackId или null
 */
export const AndroidApiCall = (method, params = null, onSuccess = null, onError = null) => {
  if (!isAndroidAvailable()) {
    devConsole.warn(`⚠️ Android API не доступен, вызов метода: ${method}`)
    if (onError) onError('Android API не доступен')
    return null
  }

  try {
    // Генерируем уникальный ID для callback
    const callbackId = method + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)

    // Сохраняем callback в глобальный объект
    window._callbacks = window._callbacks || {}
    window._callbacks[callbackId] = function (result, error) {
      if (error) {
        devConsole.error(`❌ Ошибка Android.${method}:`, error)
        if (onError) onError(error)
        else devConsole.error('Ошибка:', error)
        delete window._callbacks[callbackId]
        return
      }

      try {
        const data = typeof result === 'string' ? JSON.parse(result) : result
        if (data.success) {
          if (onSuccess) onSuccess(data.data)
          else devConsole.log(`✅ Android.${method} выполнен успешно`)
        } else {
          const errMsg = data.error || 'Неизвестная ошибка'
          devConsole.error(`❌ Android.${method} вернул ошибку:`, errMsg)
          if (onError) onError(errMsg)
        }
      } catch (err) {
        devConsole.error(`❌ Ошибка парсинга результата Android.${method}:`, err)
        if (onError) onError('Ошибка парсинга ответа')
      }

      delete window._callbacks[callbackId]
    }

    // Вызываем Android метод (асинхронно)
    const paramsStr = params ? JSON.stringify(params) : null
    window.Android.call(method, paramsStr, callbackId)

    return callbackId
  } catch (error) {
    devConsole.error(`❌ Ошибка вызова Android.${method}:`, error)
    if (onError) onError(error.message || 'Неизвестная ошибка')
    return null
  }
}
