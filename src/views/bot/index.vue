<script lang="tsx" setup>
import dayjs from 'dayjs'
import pass_arg from '../../utils/pass-arg'
import { Item } from '../../type'

const inputs = useSessionStorage<Array<Item>>('embedding_data', [])

const selected_inputs = computed(() => inputs.value.filter(item => item.embedding && item.embedding.length > 0).map(item => {
  return {
    prompt: item.prompt,
    vector: item.embedding
  }
}))

const scrollRef = ref<HTMLElement>()

const message = useMessage()

const limit_context_count = 3

const context_list = useSessionStorage<Array<string>>('context_list', [])

const message_mapping = useSessionStorage<Record<string, Array<{ question: string, answer: string, vector: Array<number>, judge: 0 | 1 | -1 }>>>('message_mapping', {})

const context_menu = computed(() => context_list.value.map(key => {
  return {
    label: () => {
      return <div>
        {dayjs(new Date(parseInt(key))).format('会话:YYYY-MM-DD HH:mm:ss')}
      </div>
    },
    key,
  }
}))

watchEffect(() => {
  if (message_mapping.value) {
    console.log('update')
    setTimeout(() => {
      nextTick(() => {
        if (scrollRef.value) {
          console.log(scrollRef.value.clientHeight)
          scrollRef.value.scrollTo({
            top: scrollRef.value.clientHeight
          })
        }
      })
    }, 100);
  }
})

const get_context_list = useIpcClient<undefined, Array<string>>('gpt:get_context', (_, data) => {
  context_list.value = data
  hideSpin()
})

const spin_show = ref(false)

const spin_message = ref('')

const showSpin = (message: string) => {
  spin_message.value = message
  spin_show.value = true
}

const hideSpin = () => {
  spin_show.value = false
}

const selectedContextId = useSessionStorage<string>('selected_context_id', '')

const append_context = useIpcClient<string, { ok: boolean, id?: string }>('gpt:append_context', pass_arg(data => {
  if (data.ok) {
    showSpin('更新列表...')
    get_context_list()
    selectedContextId.value = data.id
  }
}))

const remove_context = useIpcClient<string, boolean>('gpt:remove_context', pass_arg(data => {
  if (data) {
    showSpin('更新列表...')
    get_context_list()
  }
}))

const questionInput = ref('')

const question = useIpcClient<{
  instanceId: string
  question: string
}>('gpt:question', pass_arg((data: {
  ok: boolean
  question?: string
  answer?: string
  message?: string
  question_embedding?: Array<number>
}) => {
  if (data.ok) {
    const item = message_mapping.value[selectedContextId.value!] ?? []

    item.push({
      vector: data.question_embedding!,
      answer: data.answer!,
      question: data.question!,
      judge: 0
    })
    message_mapping.value[selectedContextId.value!] = item
  } else {
    message.error(data.message!)
  }
  questionInput.value = ''
  spin_show.value = false
}))

const append_context_from_id = () => append_context(Date.now().toString())

const selectedContextJudge = computed(() => {
  if (!selectedContextId.value) {
    return '0'
  }
  if (!message_mapping.value[selectedContextId.value]) {
    return '0'
  }

  if (message_mapping.value[selectedContextId.value].length == 0) {
    return '0'
  }

  const item = message_mapping.value[selectedContextId.value]

  return (item.filter(item => item.judge > 0).length / item.length * 100).toFixed(2)
})

onMounted(() => {
  showSpin('更新列表...')
  get_context_list()
})
</script>

<template>
  <NSpin :show="spin_show">
    <template #description> {{ spin_message }}</template>
    <div class="empty" v-if="context_list.length <= 0">
      <div>暂无任何会话</div>
      <NButton type="primary" @click="() => append_context_from_id()">创建一个会话</NButton>
    </div>
    <template v-else>
      <NLayout has-sider>
        <NLayoutSider bordered>
          <div class="list">
            <div class="tools">
              <NButton type="primary" :disabled="context_list.length >= limit_context_count"
                @click="() => append_context_from_id()" style="width: 100%;" size="large">新建会话 {{ context_list.length }} /
                {{ limit_context_count }}
              </NButton>
            </div>
            <div class="menu">
              <NMenu :options="context_menu" v-model:value="selectedContextId"></NMenu>
            </div>
          </div>
        </NLayoutSider>
        <NLayoutContent>
          <div class="chat" v-if="selectedContextId" ref="scrollRef">
            <div class="messages">
              <template v-if="message_mapping[selectedContextId]">
                <template v-for="(item, index) of message_mapping[selectedContextId]" :key="index">
                  <NCard>
                    <div class="message"><span>问题：</span>{{ item.question }}</div>
                    <NCard>
                      <div class="message">
                        <span>回答：</span>
                        {{ item.answer }}
                      </div>
                    </NCard>
                    <br>
                    <div class="judge">
                      <span>评判：</span>
                      <NButtonGroup class="g">
                        <NButton @click="item.judge = 1" type="primary">正确 {{ item.judge > 0 ? '（已选择）' : '' }}</NButton>
                        <NButton @click="item.judge = -1" type="error">错误 {{ item.judge < 0 ? '（已选择）' : '' }}</NButton>
                      </NButtonGroup>
                      <NButton class="j" :type="item.judge > 0 ? 'primary' : (item.judge < 0 ? 'error' : 'default')">
                        {{ item.judge > 0 ? '正确' : (item.judge < 0 ? '错误' : '未评判') }} </NButton>
                    </div>
                  </NCard>
                </template>
              </template>
            </div>
            <div class="send">
              <NInput type="textarea" v-model:value="questionInput" :resizable="false" />
              <div class="tools">
                <NButtonGroup>
                  <NButton>当前正确率 {{ selectedContextJudge }}%</NButton>
                  <NButton type="primary" @click="() => {
                    showSpin('等待问答结果返回')
                    question({
                      instanceId: selectedContextId,
                      question: questionInput,
                      inputs: JSON.parse(JSON.stringify(selected_inputs))
                    })
                  }">发送</NButton>
                </NButtonGroup>
              </div>
            </div>
          </div>
          <div v-else style="display: flex; align-items: center; justify-content: center; height: 500px;">
            <NEmpty description="请选择会话"></NEmpty>
          </div>
        </NLayoutContent>
      </NLayout>
    </template>
  </NSpin>
</template>

<style lang="scss" scoped>
.empty {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.list {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: calc(100vh - 135px);

  .tools {
    display: flex;
    justify-content: center;
    padding: 0 10px;
  }

  .menu {
    flex: 1;
    overflow-y: auto;
  }
}

.chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;

  .messages {
    flex: 1;
    overflow: hidden;
  }

  .send {
    padding: 10px 0 10px 10px;
    position: sticky;

    .tools {
      display: flex;
      padding: 10px 0;
      justify-content: end;
    }
  }
}

.message {
  span {
    font-weight: bold;
  }

}

.judge {
  span {
    font-weight: bold;
  }

  &:hover {
    .g {
      display: block;
    }

    .j {
      display: none;
    }
  }

  .g {
    display: none;
  }
}
</style>
