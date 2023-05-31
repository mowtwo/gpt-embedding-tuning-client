<script setup lang="ts">
import { dateZhCN, zhCN } from 'naive-ui';

onMounted(()=>{
  console.log('app mounted')
})
</script>

<template>
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN">
    <NDialogProvider>
      <NMessageProvider>
        <RouterView></RouterView>
      </NMessageProvider>
    </NDialogProvider>
  </NConfigProvider>
</template>
