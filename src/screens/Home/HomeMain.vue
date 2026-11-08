<!-- src/screens/Home/HomeMain.vue -->
<script setup>
  import { ref, onMounted, onUnmounted, computed } from 'vue'
  import { useCoreTheme } from '@/stores/coreTheme'
  import { isAndroidAvailable, AndroidApiCall } from '@/utilities/androidApi'
  import { devConsole } from '@/utilities/devConsole'

  /* иконки */
  import {
    IconCpu as IconTempCPU,
    IconArrowsMoveVertical as IconSpeedEthernet,
    IconBluetooth as IconBluetooth,
    IconWifi as IconWifi,
    IconSatellite as IconGps,
    IconDeviceMobile as IconGsm,
    IconUsb as IconUsb,
    IconVolume3 as IconVolume,
  } from '@tabler/icons-vue'

  const { state: coreState, init: initTheme } = useCoreTheme()

  /* текущее время / дата */
  const clockTime = ref('')
  const clockDate = ref('')
  const clockSeconds = ref('')

  const updateClock = () => {
    const now = new Date()
    clockTime.value = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    clockSeconds.value = `${now.getSeconds().toString().padStart(2, '0')}`
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    const months = [
      'Января',
      'Февраля',
      'Марта',
      'Апреля',
      'Мая',
      'Июня',
      'Июля',
      'Августа',
      'Сентября',
      'Октября',
      'Ноября',
      'Декабря',
    ]
    clockDate.value = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`
  }

  let clockInterval

  /* локальные статусы для виджетов (GetStatusBar polling) */
  const statusBar = ref({
    cpuTemp: null,
    internetSpeed: null,
    volume: null,
    gsmSignal: null,
    gsmNetworkType: null,
    wifiSignalLevel: null,
    bluetooth: null,
    wifi: null,
    gps: null,
    usbConnected: null,
  })

  /* загрузка статусов при входе */
  const loadStatus = () => {
    if (!isAndroidAvailable()) {
      /* моки для разработки */
      statusBar.value = {
        cpuTemp: '57°C',
        internetSpeed: '1.2 MB/s',
        volume: '33',
        gsmSignal: 4,
        gsmNetworkType: '4G',
        wifiSignalLevel: 4,
        bluetooth: true,
        wifi: true,
        gps: true,
        usbConnected: true,
      }
      return
    }
    AndroidApiCall('GetStatusBar', null, (data) => {
      statusBar.value = data || statusBar.value
    })
  }

  /* обработка нажатия на виджет */
  const handleWidgetClick = (name) => {
    devConsole.info(`Виджет: ${name}`)
  }

  /* вычисляемое — активен ли интернет */
  const hasInternet = computed(() => {
    return statusBar.value.wifi || statusBar.value.gsmSignal !== null
  })

  onMounted(() => {
    updateClock()
    clockInterval = setInterval(updateClock, 1000)
    initTheme()
    loadStatus()
  })

  onUnmounted(() => {
    if (clockInterval) clearInterval(clockInterval)
  })
</script>

<template>
  <div class="home-main h-full overflow-y-auto">
    <div class="h-full d-grid gap-15" style="grid-template-rows: 1fr auto auto">
      <!-- Верхняя строка: часы + погода -->
      <div class="row gap-15">
        <!-- Часы -->
        <div
          class="col th-surface filter-blur-normal rounded-normal p-20 d-flex flex-direction-column justify-center align-items-center"
        >
          <span class="numberStyle font-size-72 th-text font-weight-bolder">{{ clockTime }}</span>
          <span class="font-size-14 th-text-dim mt-10">{{ clockDate }}</span>
          <span class="numberStyle font-size-24 th-text-faint mt-5">{{ clockSeconds }}</span>
        </div>

        <!-- Быстрый обзор -->
        <div class="col-auto d-grid gap-10" style="grid-template-rows: repeat(3, 1fr)">
          <!-- Wi-Fi -->
          <div
            class="th-surface filter-blur-normal rounded-normal p-10 d-flex align-items-center gap-10 transition-03 th-hover"
            @click="handleWidgetClick('wifi')"
          >
            <IconWifi :size="28" :class="statusBar.wifi ? 'th-accent-text' : 'th-text-faint'" />
            <div>
              <span class="font-size-12 th-text-dim">Wi-Fi</span>
              <span class="font-size-14 th-text" :class="{ 'th-text-dim': !statusBar.wifi }">
                {{ statusBar.wifi ? 'Подключено' : 'Отключено' }}
              </span>
            </div>
          </div>

          <!-- Bluetooth -->
          <div
            class="th-surface filter-blur-normal rounded-normal p-10 d-flex align-items-center gap-10 transition-03"
            @click="handleWidgetClick('bluetooth')"
          >
            <IconBluetooth
              :size="28"
              :class="statusBar.bluetooth ? 'th-accent-text' : 'th-text-faint'"
            />
            <div>
              <span class="font-size-12 th-text-dim">Bluetooth</span>
              <span class="font-size-14 th-text" :class="{ 'th-text-dim': !statusBar.bluetooth }">
                {{ statusBar.bluetooth ? 'Вкл' : 'Выкл' }}
              </span>
            </div>
          </div>

          <!-- GPS -->
          <div
            class="th-surface filter-blur-normal rounded-normal p-10 d-flex align-items-center gap-10 transition-03"
            @click="handleWidgetClick('gps')"
          >
            <IconGps :size="28" :class="statusBar.gps ? 'th-accent-text' : 'th-text-faint'" />
            <div>
              <span class="font-size-12 th-text-dim">GPS</span>
              <span class="font-size-14 th-text" :class="{ 'th-text-dim': !statusBar.gps }">
                {{ statusBar.gps ? 'Вкл' : 'Выкл' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Средняя строка: системные виджеты -->
      <div class="row gap-15">
        <!-- Температура CPU -->
        <div
          class="col th-surface filter-blur-normal rounded-normal p-15 d-flex align-items-center gap-15"
          @click="handleWidgetClick('cpu')"
        >
          <IconTempCPU :size="36" class="color-orange-080" />
          <div class="col-auto">
            <span class="font-size-12 th-text-dim">Температура CPU</span>
            <span class="numberStyle font-size-28 th-text">
              {{ statusBar.cpuTemp || '—' }}
            </span>
          </div>
        </div>

        <!-- Скорость интернета -->
        <div
          class="col th-surface filter-blur-normal rounded-normal p-15 d-flex align-items-center gap-15"
          @click="handleWidgetClick('network')"
        >
          <IconSpeedEthernet
            :size="36"
            :class="hasInternet ? 'color-emerald-080' : 'th-text-faint'"
          />
          <div class="col-auto">
            <span class="font-size-12 th-text-dim">Скорость сети</span>
            <span class="numberStyle font-size-28 th-text">
              {{ statusBar.internetSpeed || '—' }}
            </span>
          </div>
        </div>

        <!-- GSM -->
        <div
          class="col th-surface filter-blur-normal rounded-normal p-15 d-flex align-items-center gap-15"
          @click="handleWidgetClick('gsm')"
        >
          <IconGsm
            :size="36"
            :class="statusBar.gsmSignal !== null ? 'th-accent-text' : 'th-text-faint'"
          />
          <div class="col-auto">
            <span class="font-size-12 th-text-dim">Мобильная сеть</span>
            <span class="font-size-16 th-text">
              {{ statusBar.gsmNetworkType || 'Нет' }}
              <span
                v-if="statusBar.gsmSignal !== null && statusBar.gsmSignal !== undefined"
                class="ml-5 opacity-50"
              >
                ({{ statusBar.gsmSignal }}/4)
              </span>
            </span>
          </div>
        </div>

        <!-- Громкость -->
        <div
          class="col th-surface filter-blur-normal rounded-normal p-15 d-flex align-items-center gap-15"
          @click="handleWidgetClick('volume')"
        >
          <IconVolume :size="36" class="th-text" />
          <div class="col-auto">
            <span class="font-size-12 th-text-dim">Громкость</span>
            <span class="numberStyle font-size-28 th-text"> {{ statusBar.volume || '0' }}% </span>
          </div>
        </div>
      </div>

      <!-- Нижняя строка: USB + информация о ядре -->
      <div class="row gap-15">
        <!-- Подключения -->
        <div
          class="col th-surface filter-blur-normal rounded-normal p-10 d-flex align-items-center gap-10"
        >
          <IconUsb
            :size="24"
            :class="statusBar.usbConnected ? 'color-emerald-080' : 'th-text-faint'"
          />
          <span class="font-size-14 th-text-dim">USB:</span>
          <span
            class="font-size-14"
            :class="statusBar.usbConnected ? 'color-emerald-080' : 'th-text-faint'"
          >
            {{ statusBar.usbConnected ? 'Подключено' : 'Нет' }}
          </span>
        </div>

        <!-- Информация о ядре -->
        <div
          class="col-auto th-surface filter-blur-normal rounded-normal p-10 d-flex align-items-center gap-15"
        >
          <div v-if="coreState.shell?.name" class="d-flex flex-direction-column">
            <span class="font-size-11 th-text-faint">Оболочка</span>
            <span class="font-size-14 th-text font-weight-bolder">
              {{ coreState.shell.name }} v{{ coreState.shell.version || '—' }}
            </span>
          </div>
          <div v-if="coreState.app?.version" class="d-flex flex-direction-column">
            <span class="font-size-11 th-text-faint">Quty.Launch</span>
            <span class="font-size-14 th-text"> v{{ coreState.app.version }} </span>
          </div>
          <div v-if="coreState.colorScheme?.primary" class="d-flex flex-direction-column">
            <span class="font-size-11 th-text-faint">Схема</span>
            <div class="d-flex align-items-center gap-5">
              <span class="font-size-14 th-text">{{ coreState.colorScheme.id || '—' }}</span>
              <span
                class="rounded-circle"
                :style="{
                  width: '12px',
                  height: '12px',
                  backgroundColor: coreState.colorScheme.primary,
                }"
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .home-main {
    padding: 5px;
  }

  .rounded-circle {
    border-radius: 50% !important;
  }
</style>
