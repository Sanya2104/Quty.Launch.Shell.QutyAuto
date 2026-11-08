<!-- src/App.vue -->
<script setup>
  import { RouterView } from 'vue-router'

  import AppStatusBar from '@/components/AppStatusBar.vue'
  import AppNavigationBar from '@/components/AppNavigationBar.vue'

  /* импорт компонента */
  import DevConsole from '@/components/DevConsole.vue'

  /* тема ядра (светлая/тёмная + цветовая схема) */
  import { useCoreTheme } from '@/stores/coreTheme'

  /* стили оформления */
  import '@/assets/styles/main.css'

  const coreTheme = useCoreTheme()
  coreTheme.init()
</script>

<template>
  <div id="App">
    <div
      id="AppBackground"
      class="bg-position-c bg-size-cover bg-attachment-fixed bg-repeat-no-repeat w-screen h-screen position-relative overflow-hidden"
    >
      <div id="AppScrim" class="position-absolute top-0 right-0 bottom-0 left-0"></div>
      <div
        id="AppContainer"
        class="filter-blur-normal position-absolute top-0 right-0 bottom-0 left-0 d-flex flex-direction-column"
      >
        <AppStatusBar />
        <main id="AppMain" class="position-relative flex-1 overflow-hidden mx-15 mb-15">
          <router-view v-slot="{ Component }">
            <component :is="Component" />
          </router-view>
        </main>
        <AppNavigationBar />
        <DevConsole />
      </div>
    </div>
  </div>
</template>

<style scoped>
  #AppBackground {
    background-image: url('@/assets/images/wallpaper.jpg');
  }

  /* Затемнение/осветление обоев в зависимости от темы */
  #AppScrim {
    background: var(--th-scrim, rgba(8, 10, 14, 0.45));
    pointer-events: none;
  }
</style>
