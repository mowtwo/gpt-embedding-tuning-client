<script lang="ts" setup>
import { NForm } from 'naive-ui';
import type { UnwrapRef } from 'vue';

useTitle('设置')

const router = useRouter()

const message = useMessage()

const config_form = ref({
  key: '',
  embedding_model: 'text-embedding-ada-002',
  chat_model: 'gpt-3.5-turbo',
})

const getConfig = useIpcClient('gpt:get_config', (_, data: UnwrapRef<typeof config_form>) => {
  config_form.value = data
})

const setConfig = useIpcClient<boolean>('gpt:set_config', (_, ok) => {
  if (ok) {
    message.success('修改成功')
  } else {
    message.error('修改失败')
  }
})

const config_form_ref = ref<InstanceType<typeof NForm>>()

const updateConfig = async () => {
  try {
    await config_form_ref.value?.validate()
    const config = JSON.parse(JSON.stringify(config_form.value))
    setConfig(config)
  } catch (e) {
    message.error(String(e))
  }
}

onMounted(() => {
  getConfig()
})
</script>

<template>
  <div class="config">
    <div class="title">
      工具设置
    </div>
    <br>
    <NForm :model="config_form" ref="config_form_ref">
      <NFormItem label="token" path="key" required>
        <NInput type="password" show-password-on="click" v-model:value="config_form.key" />
      </NFormItem>
      <NFormItem label="embedding_model" path="embedding_model" required>
        <NInput readonly v-model:value="config_form.embedding_model" />
      </NFormItem>
      <NFormItem label="chat_model" path="chat_model" required>
        <NInput readonly v-model:value="config_form.chat_model" />
      </NFormItem>
    </NForm>
    <br>
    <NButtonGroup>
      <NButton @click="router.push({ name: 'home' })">返回首页</NButton>
      <NButton type="primary" @click="updateConfig">保存修改</NButton>
    </NButtonGroup>
  </div>
</template>

<style lang="scss" scoped>
.config {
  padding: 16px;

  .title {
    font-size: 18px;

  }
}
</style>
