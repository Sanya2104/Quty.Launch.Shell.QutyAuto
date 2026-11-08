<!-- src/screens/Error/ErrorMain.vue -->
<script setup>
  import { useRoute, useRouter } from 'vue-router'

  const route = useRoute()
  const router = useRouter()

  const goHome = () => {
    router.replace('/home')
  }
</script>

<template>
  <div class="error-main th-surface filter-blur-normal rounded-normal">
    <div class="d-flex flex-direction-column align-items-center justify-center h-full gap-15">
      <span class="font-size-60">🧭</span>

      <h2 class="font-size-24 th-text font-weight-bolder">Маршрут не найден</h2>

      <p class="font-size-14 th-text-dim text-align-center">
        Страница
        <span class="th-text font-weight-bolder">{{ route.fullPath }}</span>
        не существует в оболочке
      </p>

      <button class="retry-button font-size-16 th-text" @click="goHome">На главную</button>
    </div>
  </div>
</template>

<style scoped>
  .error-main {
    height: 100%;
    padding: 20px;
  }

  .retry-button {
    padding: 10px 25px;
    background: var(--th-surface-soft);
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .retry-button:hover {
    background: var(--th-hover);
  }

  .retry-button:active {
    transform: scale(0.97);
  }
</style>
