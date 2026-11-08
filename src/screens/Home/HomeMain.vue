<!-- src/screens/Home/HomeMain.vue -->
<script setup>
  /* Часы и статусы показывает AppStatusBar, сведения об оболочке — на странице «О системе».
     Здесь размещаются только виджеты главной страницы. */
</script>

<template>
  <div class="home-main h-full overflow-y-auto">
    <div class="home-widgets d-grid gap-15">
      <!-- Слот для виджетов главной страницы -->
    </div>
  </div>
</template>

<style scoped>
  .home-main {
    padding: 5px;
  }

  .home-widgets {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    grid-auto-rows: minmax(90px, auto);
  }
</style>
