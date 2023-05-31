<script lang="tsx" setup>
import { RouterLink } from "vue-router"
import pkg from "../../package.json"

const router = useRouter()
const message = useMessage()

const menus = computed(() => {
  const routes = router.getRoutes()
  return routes.filter(route => route.meta.showNav).map((route, index) => {
    const labelText = route.meta.label ?? ('菜单项 - ' + (index + 1))
    return {
      label: () => <RouterLink to={{ name: route.name }}>{labelText}</RouterLink>,
      key: route.name as string
    }
  })
})

const defaultMenu = computed(() => router.currentRoute.value.name as string)

const hasKey = useIpcClient<boolean>('gpt:has_key', (_, data) => {
  if (!data) {
    message.error('token不存在，请添加')
    router.push({
      name: 'config'
    })
  }
})

onMounted(() => {
  hasKey()
  console.log('layout loaded')
})
</script>

<template>
  <div class="udd-gpt-embedding-tuning">
    <NLayout position="absolute">
      <NLayoutHeader style="height: 84px; padding: 24px;" bordered>
        <div class="header">
          <div class="title">
            {{ pkg.name }}
          </div>
          <NButton type="primary" @click="router.push({ name: 'config' })">工具设置</NButton>
        </div>
      </NLayoutHeader>
      <NLayout has-sider position="absolute" style="top: 84px; bottom: 0px;">
        <NLayoutSider bordered>
          <NMenu :options="menus" :default-value="defaultMenu"></NMenu>
        </NLayoutSider>
        <NLayout content-style="padding: 24px">
          <RouterView></RouterView>
        </NLayout>
      </NLayout>
    </NLayout>
  </div>
</template>

<style lang="scss" scoped>
.udd-gpt-embedding-tuning {
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
  background-color: #fff;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 20px;
      font-weight: bold;
    }
  }
}
</style>
