<!-- src/components/AppNavigationBar.vue -->
<script setup>
  import { useRouter, useRoute } from 'vue-router'
  import { computed } from 'vue'

  const router = useRouter()
  const route = useRoute()

  const navItems = [
    { name: 'home', label: 'Главная', icon: 'IconHome', path: '/home' },
    { name: 'apps', label: 'Приложения', icon: 'IconLayoutGrid', path: '/apps' },
    { name: 'about', label: 'О системе', icon: 'IconInfoCircle', path: '/about' },
  ]

  const activeNav = computed(() => {
    return navItems.find((item) => item.path === route.path)?.name || 'home'
  })

  const handleNavClick = (path) => {
    router.push(path)
  }
</script>

<template>
  <div id="AppNavigationBar" class="w-full h-auto row justify-between px-10 py-10">
    <nav class="nav nav-pills col-auto mx-auto th-surface filter-blur-normal rounded-normal">
      <li
        v-for="item in navItems"
        :key="item.name"
        class="nav-item px-20 py-10 rounded-sm transition-03"
        :class="activeNav === item.name ? 'th-active' : 'th-text-dim th-hover'"
        @click="handleNavClick(item.path)"
      >
        <span class="font-size-16 font-weight-bolder">{{ item.label }}</span>
      </li>
    </nav>
  </div>
</template>

<style scoped></style>
