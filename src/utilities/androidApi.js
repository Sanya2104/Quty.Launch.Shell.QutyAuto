// src/utilities/androidApi.js

import { devConsole } from '@/utilities/devConsole'

// ============================================================
// Виртуальные пакеты ядра (ApiConfig.kt).
// Это не настоящие приложения — ядро открывает по ним свои
// активности через LaunchApp.
// ============================================================
export const VIRTUAL_PACKAGES = {
  SETTINGS: 'by.quty.launch.settings',
  STORE: 'by.quty.launch.store',
  TERMINAL: 'by.quty.launch.terminal',
  LOGGER: 'by.quty.launch.logger',
}

// Заглушка GetApps — поле за полем повторяет api/model/AppInfo.kt
export const mockApps = [
  {
    packageName: VIRTUAL_PACKAGES.SETTINGS,
    name: 'Настройки Quty.Launch',
    iconBase64: '',
    isCustom: true,
    badge: false,
    badgeColor: null,
    badgeColorHex: null,
  },
  {
    packageName: VIRTUAL_PACKAGES.STORE,
    name: 'Магазин Quty.Launch',
    iconBase64: '',
    isCustom: true,
    badge: false,
    badgeColor: null,
    badgeColorHex: null,
  },
  {
    packageName: 'com.android.chrome',
    name: 'Chrome',
    iconBase64: '',
    isCustom: false,
    badge: false,
    badgeColor: null,
    badgeColorHex: null,
  },
  {
    packageName: 'com.android.messaging',
    name: 'Сообщения',
    iconBase64: '',
    isCustom: false,
    badge: false,
    badgeColor: null,
    badgeColorHex: null,
  },
  {
    packageName: 'com.android.camera',
    name: 'Камера',
    iconBase64: '',
    isCustom: false,
    badge: false,
    badgeColor: null,
    badgeColorHex: null,
  },
]

// Заглушка GetStatusBar — строго поля api/model/StatusBarInfo.kt.
// Полей notify/checkEngine в ядре нет, поэтому их нет и здесь.
export const mockStatusBar = {
  cpuTemp: '57°C',
  internetSpeed: '1.2 MB/s',
  volume: '33',
  gsmSignal: 4,
  gsmNetworkType: '4G',
  wifiSignalLevel: 4,
  bluetooth: true,
  wifi: true,
  gps: true,
  usbConnected: true,
}

// Заглушка GetSystemInfo — api/model/SystemInfo.kt
export const mockSystemInfo = {
  device: 'SDK Build (эмулятор)',
  version: '15',
}

// Заглушка GetCoreState — строго поля api/model/CoreStateInfo.kt
export const mockCoreState = {
  theme: 'dark',
  themeMode: 'system',
  language: 'ru',
  locale: 'ru-RU',
  orientation: 'sensor',
  fullscreen: true,
  strictMode: false,
  animationsEnabled: true,
  updateBadge: false,
  updateBadgeColor: null,
  updateBadgeColorHex: null,
  safeModeActive: false,
  colorScheme: {
    id: 'teal',
    primary: '#009688',
    accent: '#4CAF50',
  },
  shell: {
    name: 'QutyAuto',
    displayName: 'QutyAuto',
    version: '0.1.0',
    author: 'QutyTeam',
    orientation: 'sensor',
  },
  app: {
    version: '0.0.0',
    versionCode: 1,
  },
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

/**
 * Отправляет лог в Quty.Launch
 * @param {string} level - уровень (log, info, warn, error)
 * @param {string} message - сообщение
 * @param {string} tag - тег
 */
export const AndroidLog = (level, message, tag = 'DevConsole') => {
  try {
    if (typeof window.Android !== 'undefined' && typeof window.Android.log === 'function') {
      window.Android.log(JSON.stringify({ level, tag, message }))
      return true
    }
    return false

    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return false
  }
}
