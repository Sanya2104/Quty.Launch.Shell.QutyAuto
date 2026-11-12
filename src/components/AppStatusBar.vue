<!-- src/components/AppStatusBar.vue -->
<script setup>
  import { ref, markRaw, onMounted, onUnmounted, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { getDeviceStatus } from '@/api/getDeviceStatus'
  import { isAndroidAvailable } from '@/utilities/androidApi'

  /* иконки */
  import {
    IconCpu as IconTempCPU,
    IconArrowsMoveVertical as IconSpeedEthernet,
    IconVolume3 as IconVolumeOff,
    IconVolume4 as IconVolumeLow,
    IconVolume2 as IconVolumeHigh,
    IconVolume as IconVolumeFull,
    IconAntennaBarsOff as IconGsmSignalZero,
    IconAntennaBars2 as IconGsmSignalLow,
    IconAntennaBars3 as IconGsmSignalMedium,
    IconAntennaBars4 as IconGsmSignalHigh,
    IconAntennaBars5 as IconGsmSignalFull,
    IconWifiOff as IconWifiZero,
    IconWifi0 as IconWifiLow,
    IconWifi1 as IconWifiMedium,
    IconWifi2 as IconWifiHigh,
    IconWifi as IconWifiFull,
    IconBluetooth as IconBluetooth,
    IconUsb as IconUsb,
    IconSatellite as IconGps,
  } from '@tabler/icons-vue'

  /* статусбар */
  const { status, loadStatus, startPolling, stopPolling } = getDeviceStatus()

  /* текущее время */
  const currentTime = ref('')

  const updateTime = () => {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    currentTime.value = `${hours}:${minutes}`
  }

  /* иконка громкости */
  const getVolumeIcon = (volumePercent) => {
    if (!volumePercent && volumePercent !== 0) return markRaw(IconVolumeOff)
    const p = parseInt(volumePercent)
    if (p === 0) return markRaw(IconVolumeOff)
    if (p <= 25) return markRaw(IconVolumeLow)
    if (p <= 75) return markRaw(IconVolumeHigh)
    return markRaw(IconVolumeFull)
  }

  /* иконка GSM */
  const getGsmSignalIcon = (level) => {
    if (level === null || level === undefined) return markRaw(IconGsmSignalZero)
    switch (level) {
      case 0:
        return markRaw(IconGsmSignalZero)
      case 1:
        return markRaw(IconGsmSignalLow)
      case 2:
        return markRaw(IconGsmSignalMedium)
      case 3:
        return markRaw(IconGsmSignalHigh)
      case 4:
        return markRaw(IconGsmSignalFull)
      default:
        return markRaw(IconGsmSignalZero)
    }
  }

  /* иконка Wi-Fi */
  const getWifiIcon = (level) => {
    if (level === null || level === undefined) return markRaw(IconWifiZero)
    switch (level) {
      case 0:
        return markRaw(IconWifiZero)
      case 1:
        return markRaw(IconWifiLow)
      case 2:
        return markRaw(IconWifiMedium)
      case 3:
        return markRaw(IconWifiHigh)
      case 4:
        return markRaw(IconWifiFull)
      default:
        return markRaw(IconWifiZero)
    }
  }

  /* главная страница? */
  const route = useRoute()
  const isHomePage = computed(() => {
    return route.path === '/' || route.path === '/home'
  })

  let timerInterval

  onMounted(() => {
    updateTime()
    timerInterval = setInterval(updateTime, 60000)
    loadStatus()
    if (isAndroidAvailable()) {
      startPolling(1000)
    }
  })

  onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval)
    if (isAndroidAvailable()) stopPolling()
  })
</script>

<template>
  <div
    id="AppStatusBar"
    class="w-full h-auto row justify-between px-15 py-10"
    :class="{ 'th-surface-strong filter-blur-normal': !isHomePage }"
  >
    <!-- Left: время -->
    <nav class="nav nav-pills col d-flex align-items-center">
      <li class="nav-item px-15 py-5 d-flex align-items-center th-text">
        <span class="numberStyle font-size-28 ml-5">{{ currentTime }}</span>
      </li>
    </nav>

    <!-- Right: статусы -->
    <nav class="nav nav-pills col-auto d-flex align-items-center gap-5">
      <!-- температура -->
      <li v-if="status.cpuTemp" class="nav-item px-10 py-5 d-flex align-items-center th-text">
        <IconTempCPU :size="22" :stroke="1.5" />
        <span class="ml-3 font-size-14">{{ status.cpuTemp }}</span>
      </li>

      <!-- скорость -->
      <li v-if="status.internetSpeed" class="nav-item px-10 py-5 d-flex align-items-center th-text">
        <IconSpeedEthernet :size="22" :stroke="1.5" />
        <span class="ml-3 font-size-14">{{ status.internetSpeed }}</span>
      </li>

      <!-- громкость -->
      <li
        v-if="status.volume !== null && status.volume !== undefined"
        class="nav-item px-10 py-5 d-flex align-items-center th-text"
      >
        <component :is="getVolumeIcon(status.volume)" :size="22" :stroke="1.5" />
        <span class="ml-3 font-size-14">{{ status.volume }}%</span>
      </li>

      <!-- GSM + тип сети -->
      <li
        v-if="status.gsmSignal !== null && status.gsmSignal !== undefined"
        class="nav-item px-10 py-5 d-flex align-items-center th-text"
      >
        <component :is="getGsmSignalIcon(status.gsmSignal)" :size="22" :stroke="1.5" />
        <span class="ml-3 font-size-14">{{ status.gsmNetworkType || '' }}</span>
      </li>

      <!-- Wi-Fi -->
      <li
        v-if="status.wifiSignalLevel !== null && status.wifiSignalLevel !== undefined"
        class="nav-item px-10 py-5 d-flex align-items-center"
        :class="status.wifi ? 'th-accent-text' : 'th-text-faint'"
      >
        <component :is="getWifiIcon(status.wifiSignalLevel)" :size="22" :stroke="1.5" />
      </li>

      <!-- Bluetooth -->
      <li
        v-if="status.bluetooth !== null && status.bluetooth !== undefined"
        class="nav-item px-10 py-5 d-flex align-items-center"
        :class="status.bluetooth ? 'th-accent-text' : 'th-text-faint'"
      >
        <IconBluetooth :size="22" :stroke="1.5" />
      </li>

      <!-- GPS -->
      <li
        v-if="status.gps !== null && status.gps !== undefined"
        class="nav-item px-10 py-5 d-flex align-items-center"
        :class="status.gps ? 'th-accent-text' : 'th-text-faint'"
      >
        <IconGps :size="22" :stroke="1.5" />
      </li>

      <!-- USB -->
      <li
        v-if="status.usbConnected !== null && status.usbConnected !== undefined"
        class="nav-item px-10 py-5 d-flex align-items-center"
        :class="status.usbConnected ? 'th-accent-text' : 'th-text-faint'"
      >
        <IconUsb :size="22" :stroke="1.5" />
      </li>
    </nav>
  </div>
</template>

<style scoped>
  #AppStatusBar::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
  }
</style>
