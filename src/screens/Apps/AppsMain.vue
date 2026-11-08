<!-- src/screens/Apps/AppsMain.vue -->
<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { getApps } from '@/api/apps/getApps'
  import { launchApp } from '@/api/apps/launchApp'
  import { AndroidApiCall, isAndroidAvailable } from '@/utilities/androidApi'
  import { devConsole } from '@/utilities/devConsole'
  import { subscribeCoreEvent } from '@/utilities/coreEvents'

  const { apps, loading, error, loadApps } = getApps()
  const { run: launch } = launchApp()

  const searchQuery = ref('')
  const lastUpdateBadge = ref(null)

  const onIconError = (event) => {
    event.target.style.display = 'none'
  }

  const checkUpdateBadge = () => {
    if (!isAndroidAvailable()) return

    AndroidApiCall(
      'GetCoreState',
      null,
      (data) => {
        const currentBadge = data?.updateBadge === true
        if (lastUpdateBadge.value !== currentBadge) {
          lastUpdateBadge.value = currentBadge
          devConsole.info(`🔄 updateBadge → ${currentBadge}, перезапрос GetApps`)
          loadApps(true)
        }
      },
      (err) => {
        devConsole.warn('⚠️ GetCoreState (для updateBadge) не удался:', err)
      }
    )
  }

  /* Подписка на центральный хаб (не перезаписывает обработчик темы) */
  let unsubscribeCore = null

  onMounted(() => {
    loadApps()
    unsubscribeCore = subscribeCoreEvent(checkUpdateBadge)
    if (isAndroidAvailable()) {
      AndroidApiCall('GetCoreState', null, (data) => {
        lastUpdateBadge.value = data?.updateBadge === true
      })
    }
  })

  onUnmounted(() => {
    if (unsubscribeCore) unsubscribeCore()
  })

  const getBadgeColor = (app) => {
    if (app.badgeColorHex) return app.badgeColorHex
    switch (app.badgeColor) {
      case 'error':
        return '#F44336'
      case 'warning':
        return '#FF9800'
      default:
        return '#009688'
    }
  }

  /* отфильтрованный список */
  const filteredApps = computed(() => {
    if (!searchQuery.value.trim()) return apps.value
    const q = searchQuery.value.toLowerCase()
    return apps.value.filter((app) => app.name.toLowerCase().includes(q))
  })
</script>

<template>
  <div class="apps-main th-surface filter-blur-normal rounded-normal">
    <!-- Поиск -->
    <div class="mb-15 d-flex gap-10">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск приложений..."
        class="flex-1 rounded-sm px-15 py-10 th-text font-size-16"
        style="outline: none; border-radius: 8px"
      />
      <button
        v-if="searchQuery"
        class="th-surface-soft rounded-sm px-15 py-10 th-text-dim transition-03 th-hover"
        @click="searchQuery = ''"
      >
        Очистить
      </button>
    </div>

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
    <div v-else>
      <div v-if="filteredApps.length === 0" class="text-align-center py-50 th-text-dim">
        <p class="font-size-18">Ничего не найдено</p>
        <p class="font-size-14 mt-10">Попробуйте другой запрос</p>
      </div>

      <div v-else class="apps-grid">
        <div
          v-for="app in filteredApps"
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
            <span
              v-if="app.badge"
              class="app-badge"
              :style="{ backgroundColor: getBadgeColor(app) }"
            ></span>
          </div>
          <span class="app-name th-text-dim">{{ app.name }}</span>
        </div>
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

  /* Поиск */
  input[type='text'] {
    background: var(--th-input-bg) !important;
    border: 1px solid var(--th-input-border) !important;
    color: var(--th-text) !important;
  }
  input[type='text']::placeholder {
    color: var(--th-text-faint);
  }

  /* Состояние загрузки */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: var(--th-text-dim);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--th-border);
    border-top-color: var(--th-text);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 10px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Ошибка */
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
    background: var(--th-surface-soft);
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--th-text);
  }

  .retry-button:hover {
    background: var(--th-hover);
  }

  /* Сетка */
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
    background: transparent;
  }

  .app-item:hover {
    transform: translateY(-2px);
    background: var(--th-hover);
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

  .app-badge {
    position: absolute;
    top: 0;
    right: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
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
  }

  .app-item[data-custom='true'] {
    background: var(--scheme-accent-012);
    border: 1px solid var(--scheme-accent-035);
  }

  .app-item[data-custom='true']:hover {
    background: var(--scheme-accent-020);
  }
</style>
