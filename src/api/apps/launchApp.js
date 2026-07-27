// src/api/apps/launchApp.js
import { isAndroidAvailable, AndroidApiCall } from '@/utilities/androidApi'
import { devConsole } from '@/utilities/devConsole'

export function launchApp() {
  const run = (packageName) => {
    if (!packageName) {
      devConsole.warn('⚠️ Нет имени пакета для запуска')
      return false
    }

    try {
      if (!isAndroidAvailable()) {
        devConsole.info(`🚀 Эмуляция запуска: ${packageName}`)
        return true
      }

      // АСИНХРОННЫЙ ВЫЗОВ
      AndroidApiCall(
        'LaunchApp',
        { packageName },
        // onSuccess
        () => {
          devConsole.info(`✅ Запущено приложение: ${packageName}`)
        },
        // onError
        (err) => {
          devConsole.warn(`⚠️ Не удалось запустить ${packageName}:`, err)
        }
      )

      return true
    } catch (err) {
      devConsole.error('❌ Ошибка запуска приложения:', err)
      return false
    }
  }

  return { run }
}
