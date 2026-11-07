<!-- src/screens/Apps/AppsMain.vue -->
<script setup>
  import { onMounted, onUnmounted } from 'vue'
  import { getApps } from '@/api/apps/getApps'
  import { launchApp } from '@/api/apps/launchApp'
  import { AndroidApiCall, isAndroidAvailable } from '@/utilities/androidApi'
  import { devConsole } from '@/utilities/devConsole'

  const { apps, loading, error, loadApps } = getApps()
  const { run: launch } = launchApp()

  // Последнее известное состояние маркера обновления — чтобы
  // перезагружать список только при реальном изменении (не на каждое
  // событие onCoreStateChanged)
  let lastUpdateBadge = null

  // Обработчик ошибки загрузки иконки
  const onIconError = (event) => {
    event.target.style.display = 'none'
  }

  /**
   * Запрашивает GetCoreState и сравнивает updateBadge с предыдущим.
   * Если состояние изменилось (обновление появилось/исчезло) —
   * перезагружает список приложений, чтобы маркер обновился.
   */
  const checkUpdateBadge = () => {
    if (!isAndroidAvailable()) return

    AndroidApiCall(
      'GetCoreState',
      null,
      (data) => {
        const currentBadge = data?.updateBadge === true
        if (lastUpdateBadge !== currentBadge) {
          lastUpdateBadge = currentBadge
          devConsole.info(`🔄 updateBadge → ${currentBadge}, перезапрос GetApps`)
          loadApps(true)
        }
      },
      (err) => {
        devConsole.warn('⚠️ GetCoreState (для updateBadge) не удался:', err)
      }
    )
  }

  /**
   * Глобальный обработчик onCoreStateChanged от ядра.
   * Ядро шлёт его при смене языка, темы, появлении обновления и т.д.
   *
   * Мы подписаны только на факт изменения — перезапрашиваем
   * CoreState и сравниваем updateBadge. Если он не изменился —
   * ничего не делаем (не спамим GetApps).
   */
  window.onCoreStateChanged = () => {
    devConsole.info('🔔 onCoreStateChanged')
    checkUpdateBadge()
  }

  // Загружаем приложения
  onMounted(() => {
    loadApps()
    // Начальное состояние updateBadge — чтобы не сработало ложное
    // «изменилось» на первом onCoreStateChanged
    if (isAndroidAvailable()) {
      AndroidApiCall(
        'GetCoreState',
        null,
        (data) => {
          lastUpdateBadge = data?.updateBadge === true
        },
        () => {
          // Молча игнорируем — не критично для UI
        }
      )
    }
  })

  onUnmounted(() => {
    // Снимаем глобальный обработчик, чтобы не мешал другим экранам.
    // Если ядро пошлёт onCoreStateChanged, когда AppsMain не открыт —
    // мы просто ничего не сделаем.
    window.onCoreStateChanged = null
  })

  /**
   * Возвращает цвет маркера в виде CSS-строки.
   *
   * Приоритет:
   * 1. app.badgeColorHex — готовый HEX от ядра (BadgeHelper).
   * 2. app.badgeColor — семантика ("accent" | "warning" | "error").
   *    Fallback-маппинг на случай, если HEX не пришёл.
   * 3. #009688 — дефолтный accent (status_accent).
   */
  const getBadgeColor = (app) => {
    // 1. Готовый HEX от ядра
    if (app.badgeColorHex) {
      return app.badgeColorHex
    }

    // 2. Fallback: семантика → HEX
    switch (app.badgeColor) {
      case 'error':
        return '#F44336' // status_error
      case 'warning':
        return '#FF9800' // status_warning
      case 'accent':
      default:
        return '#009688' // status_accent
    }
  }
</script>

<template>
  <div class="apps-main bg-light-060 filter-blur-normal rounded-normal">
    <h1 class="apps-title color-light-080">📱 Приложения</h1>

    <!-- Состояние загрузки -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка приложений...</p>
    </div>

    <!-- Состояние ошибки -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadApps" class="retry-button">🔄 Повторить</button>
    </div>

    <!-- Список приложений -->
    <div v-else class="apps-grid">
      <div
        v-for="app in apps"
        :key="app.packageName"
        class="app-item"
        :data-custom="app.isCustom"
        @click="launch(app.packageName)"
      >
        <div class="app-icon">
          <img
            v-if="app.iconBase64"
            :src="`data:image/png;base64,${app.iconBase64}`"
            :alt="app.name"
            loading="lazy"
            @error="onIconError"
          />
          <span v-else class="emoji-placeholder">
            {{ app.isCustom ? '⚙️' : '📱' }}
          </span>

          <!-- Маркер (badge): точка в правом верхнем углу иконки -->
          <span
            v-if="app.badge"
            class="app-badge"
            :style="{ backgroundColor: getBadgeColor(app) }"
            :aria-label="'Update available'"
          ></span>
        </div>
        <span class="app-name color-coolgray-080">{{ app.name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .apps-main {
    padding: 20px;
    height: 100%;
    overflow-y: auto;
  }

  .apps-title {
    font-size: 24px;
    margin-bottom: 20px;
    font-weight: 500;
  }

  /* Состояние загрузки */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: rgba(255, 255, 255, 0.7);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 10px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Состояние ошибки */
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    gap: 15px;
  }

  .error-message {
    color: #ff6b6b;
    font-size: 14px;
    text-align: center;
  }

  .retry-button {
    padding: 8px 20px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .retry-button:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.02);
  }

  .retry-button:active {
    transform: scale(0.98);
  }

  /* Сетка приложений */
  .apps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 100px));
    gap: 20px;
    justify-content: center;
  }

  .app-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(5px);
  }

  .app-item:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.1);
  }

  .app-item:active {
    transform: scale(0.96);
  }

  .app-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    /* Маркер позиционируется абсолютно внутри этого контейнера */
    position: relative;
  }

  .app-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .emoji-placeholder {
    font-size: 40px;
  }

  /* Маркер (badge): точка в правом верхнем углу иконки */
  .app-badge {
    position: absolute;
    top: 0;
    right: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    /* Белая обводка — чтобы маркер читался на любой иконке */
    box-shadow: 0 0 0 2px rgba(20, 20, 20, 0.6);
    pointer-events: none;
    z-index: 2;
  }

  .app-name {
    font-size: 12px;
    text-align: center;
    max-width: 85px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 400;
  }

  /* Кастомные приложения */
  .app-item[data-custom='true'] {
    background: rgba(255, 193, 7, 0.12);
    border: 1px solid rgba(255, 193, 7, 0.3);
  }

  .app-item[data-custom='true']:hover {
    background: rgba(255, 193, 7, 0.2);
  }
</style>