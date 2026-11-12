// src/api/apps/getAppIcons.js
import { ref } from 'vue'
import { isAndroidAvailable, AndroidApiCall } from '@/utilities/androidApi'
import { devConsole } from '@/utilities/devConsole'

/**
 * Пакетный запрос иконок приложений через GetAppIcons.
 *
 * GetApps больше не отдаёт iconBase64 — иконки запрашиваются отдельно
 * для тех пакетов, которые реально отображаются на экране.
 */
export function getAppIcons() {
  const icons = ref({})
  const loading = ref(false)
  const error = ref(null)

  /**
   * Запрашивает иконки для массива пакетов.
   * Результат кэшируется в icons.value по packageName.
   * Повторные запросы для уже загруженных пакетов пропускаются.
   */
  const loadIcons = async (packages) => {
    if (!packages || packages.length === 0) return

    const needed = packages.filter((pkg) => !(pkg in icons.value))
    if (needed.length === 0) return

    if (!isAndroidAvailable()) {
      needed.forEach((pkg) => {
        icons.value[pkg] = null
      })
      return
    }

    loading.value = true
    error.value = null

    try {
      const data = await new Promise((resolve, reject) => {
        AndroidApiCall('GetAppIcons', { packages: needed }, resolve, reject)
      })

      if (Array.isArray(data)) {
        for (const item of data) {
          icons.value[item.packageName] = item.iconBase64 || null
        }
      }

      devConsole.info(`✅ GetAppIcons: загружено ${needed.length} иконок`)
    } catch (err) {
      devConsole.error('❌ Ошибка загрузки иконок:', err)
      error.value = err.message || 'Не удалось загрузить иконки'
    } finally {
      loading.value = false
    }
  }

  return {
    icons,
    loading,
    error,
    loadIcons,
  }
}
