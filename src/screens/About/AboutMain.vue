<!-- src/screens/About/AboutMain.vue -->
<script setup>
  import { onMounted } from 'vue'
  import { getDeviceInfo } from '@/api/getDeviceInfo'
  import { useAppTheme, APP_SCHEMES } from '@/stores/appTheme'
  import { AndroidApiCall, VIRTUAL_PACKAGES } from '@/utilities/androidApi'
  import { devConsole } from '@/utilities/devConsole'
  import { useRouter } from 'vue-router'
  import { IconSun as IconLight, IconMoon as IconDark } from '@tabler/icons-vue'

  const router = useRouter()
  const { state: appState, init: initTheme, devSetTheme, devSetScheme, isDev } = useAppTheme()
  const { info: deviceInfo, loadInfo } = getDeviceInfo()

  /* Тема и схема — из GetAppState (ядро не даёт менять их из оболочки) */
  const themeName = () => (appState.value.theme === 'light' ? 'Светлая' : 'Тёмная')

  const openCoreSettings = () => {
    AndroidApiCall(
      'LaunchApp',
      { packageName: VIRTUAL_PACKAGES.SETTINGS },
      () => devConsole.info('✅ Открыты Настройки Quty.Launch (тема и схема)'),
      (err) => devConsole.warn('⚠️ Не удалось открыть Настройки:', err)
    )
  }

  const goHome = () => router.push('/home')

  onMounted(() => {
    initTheme()
    loadInfo()
  })
</script>

<template>
  <div class="about-main h-full overflow-y-auto">
    <div class="h-full d-grid gap-15" style="grid-template-rows: auto auto 1fr auto">
      <!-- О оболочке -->
      <div class="th-surface filter-blur-normal rounded-normal p-20">
        <h2 class="font-size-24 th-text font-weight-bolder text-align-center mb-10">QutyAuto</h2>
        <p class="font-size-14 th-text-dim text-align-center mb-15">
          Полноценная оболочка для Quty.Launch
        </p>
        <div class="d-flex flex-direction-column gap-10">
          <div class="d-flex justify-between">
            <span class="font-size-14 th-text-faint">Версия</span>
            <span class="font-size-14 th-text font-weight-bolder">
              {{ appState.shell?.version || '0.1.0' }}
            </span>
          </div>
          <div class="d-flex justify-between">
            <span class="font-size-14 th-text-faint">Автор</span>
            <span class="font-size-14 th-text">{{ appState.shell?.author || 'QutyTeam' }}</span>
          </div>
        </div>
      </div>

      <!-- Тема и цветовая схема (наследуется от ядра) -->
      <div class="th-surface filter-blur-normal rounded-normal p-20">
        <h3 class="font-size-18 th-text font-weight-bolder mb-15">Тема оформления</h3>
        <div class="d-flex flex-direction-column gap-10">
          <div class="d-flex justify-between align-items-center">
            <span class="font-size-14 th-text-faint">Текущая тема</span>
            <span class="d-flex align-items-center gap-10">
              <component
                :is="appState.theme === 'light' ? IconLight : IconDark"
                :size="20"
                class="th-accent-text"
              />
              <span class="font-size-14 th-text">{{ themeName() }}</span>
            </span>
          </div>
          <div class="d-flex justify-between align-items-center">
            <span class="font-size-14 th-text-faint">Режим</span>
            <span class="font-size-14 th-text">{{ appState.themeMode || '—' }}</span>
          </div>
          <div class="d-flex justify-between align-items-center">
            <span class="font-size-14 th-text-faint">Цветовая схема</span>
            <span class="d-flex align-items-center gap-10">
              <span class="font-size-14 th-text">{{ appState.colorScheme?.id || '—' }}</span>
              <span
                class="scheme-dot"
                :style="{ backgroundColor: appState.colorScheme?.primary }"
              ></span>
              <span
                class="scheme-dot"
                :style="{ backgroundColor: appState.colorScheme?.accent }"
              ></span>
            </span>
          </div>
          <p class="font-size-12 th-text-faint">
            Тема и схема задаются в ядре. Чтобы изменить — открой Настройки Quty.Launch.
          </p>
        </div>
      </div>

      <!-- О системе -->
      <div class="th-surface filter-blur-normal rounded-normal p-20 overflow-y-auto">
        <h3 class="font-size-18 th-text font-weight-bolder mb-10">Система</h3>
        <div class="d-flex flex-direction-column gap-10">
          <div v-if="deviceInfo.manufacturer" class="d-flex justify-between">
            <span class="font-size-14 th-text-faint">Производитель</span>
            <span class="font-size-14 th-text">{{ deviceInfo.manufacturer }}</span>
          </div>
          <div v-if="deviceInfo.model" class="d-flex justify-between">
            <span class="font-size-14 th-text-faint">Модель</span>
            <span class="font-size-14 th-text">{{ deviceInfo.model }}</span>
          </div>
          <div v-if="deviceInfo.androidVersion" class="d-flex justify-between">
            <span class="font-size-14 th-text-faint">Android</span>
            <span class="font-size-14 th-text"
              >v{{ deviceInfo.androidVersion }} (SDK {{ deviceInfo.sdkInt }})</span
            >
          </div>
          <div v-if="appState.app?.version" class="d-flex justify-between">
            <span class="font-size-14 th-text-faint">Quty.Launch</span>
            <span class="font-size-14 th-text">
              v{{ appState.app.version }} ({{ appState.app.versionCode }})
            </span>
          </div>
          <div v-if="appState.language" class="d-flex justify-between">
            <span class="font-size-14 th-text-faint">Язык</span>
            <span class="font-size-14 th-text">{{ appState.locale || appState.language }}</span>
          </div>
          <div class="d-flex justify-between">
            <span class="font-size-14 th-text-faint">Safe Mode</span>
            <span
              class="font-size-14"
              :class="appState.safeModeActive ? 'color-red-080' : 'th-accent-text'"
            >
              {{ appState.safeModeActive ? 'Вкл' : 'Выкл' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Dev-превью темы (только в браузере, на устройстве скрыто) -->
      <div v-if="isDev" class="th-surface filter-blur-normal rounded-normal p-15">
        <h4 class="font-size-14 th-text-dim font-weight-bolder mb-10">
          🛠️ Превью темы (dev-режим)
        </h4>
        <div class="d-flex align-items-center gap-10 mb-10">
          <button
            class="preview-btn"
            :class="{ 'th-bg-accent': appState.theme !== 'light' }"
            @click="devSetTheme('dark')"
          >
            Тёмная
          </button>
          <button
            class="preview-btn"
            :class="{ 'th-bg-accent': appState.theme === 'light' }"
            @click="devSetTheme('light')"
          >
            Светлая
          </button>
        </div>
        <div class="d-flex flex-wrap-wrap gap-10">
          <button
            v-for="scheme in APP_SCHEMES"
            :key="scheme.id"
            class="scheme-btn"
            :class="{ 'scheme-btn-active': appState.colorScheme?.id === scheme.id }"
            :style="{ backgroundColor: scheme.primary }"
            :title="scheme.id"
            @click="devSetScheme(scheme.id)"
          ></button>
        </div>
      </div>

      <!-- Действия -->
      <div class="row gap-10">
        <button
          class="col th-surface filter-blur-normal rounded-normal py-15 transition-03 d-flex align-items-center justify-center gap-10 th-hover"
          @click="openCoreSettings"
        >
          <span class="font-size-16 th-text">🎨 Сменить тему (Настройки)</span>
        </button>
        <button
          class="col th-surface filter-blur-normal rounded-normal py-15 transition-03 d-flex align-items-center justify-center gap-10 th-hover"
          @click="goHome"
        >
          <span class="font-size-16 th-text">🏠 На главную</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .about-main {
    padding: 5px;
  }

  .scheme-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid var(--th-border);
  }

  .preview-btn {
    padding: 6px 14px;
    border: 1px solid var(--th-border);
    border-radius: 8px;
    background: var(--th-surface-soft);
    color: var(--th-text);
    font-size: 13px;
    cursor: pointer;
  }

  .scheme-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
  }

  .scheme-btn-active {
    border-color: var(--th-text);
    box-shadow: 0 0 8px var(--scheme-accent-035);
  }
</style>
