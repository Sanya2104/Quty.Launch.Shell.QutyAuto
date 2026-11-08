// src/router.js

import { createRouter, createWebHashHistory } from 'vue-router'

// импорты скринов
import HomeMain from '@/screens/Home/HomeMain.vue'
import AppsMain from '@/screens/Apps/AppsMain.vue'
import AboutMain from '@/screens/About/AboutMain.vue'
import ErrorMain from '@/screens/Error/ErrorMain.vue'

// маршруты
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),

  routes: [
    // корневая переадресация
    {
      path: '/',
      redirect: '/home',
    },

    // домашний экран
    {
      path: '/home',
      name: 'home',
      meta: {
        title: 'Главная',
        link: '/home',
      },
      component: HomeMain,
    },

    // приложения
    {
      path: '/apps',
      name: 'apps',
      meta: {
        title: 'Приложения',
        link: '/apps',
      },
      component: AppsMain,
    },

    // о системе
    {
      path: '/about',
      name: 'about',
      meta: {
        title: 'О системе',
        link: '/about',
      },
      component: AboutMain,
    },

    // экран ошибки маршрута
    {
      path: '/:pathMatch(.*)*',
      name: 'error',
      meta: {
        title: 'Ошибка',
        link: '',
      },
      component: ErrorMain,
    },
  ],
})

export default router
