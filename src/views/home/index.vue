<script lang="tsx" setup>
import { NButton, NButtonGroup, NDataTable, NInput, NPopconfirm } from 'naive-ui'
import type { TableColumns } from 'naive-ui/es/data-table/src/interface'
import dayjs from "dayjs"
import { Item } from '../../type'



const fmtDt = (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')

const limitEmbeddingCount = 10
const limitHistoryCount = 20

const base_data_columns: TableColumns<Item> = [
  {
    title: 'Prompt',
    key: 'prompt',
  },
  {
    title: 'Embedding矩阵',
    key: 'embedding',
    width: 200,
    render(row) {
      if (row.embedding) {
        return <NButton onClick={() => {
          showEmbeddingModel(row.embedding?.join(',') ?? '')
        }}>Embedding.length={row.embedding.length}</NButton>
      } else {
        return <div></div>
      }
    }
  },
  {
    title: '最后更新时间',
    key: 'date',
    width: 200,
    render(row) {
      return fmtDt(row.date)
    }
  },
]

const columns: TableColumns<Item> = [
  {
    type: 'expand',
    expandable(row) {
      return !!row.history && row.history.length > 0
    },
    renderExpand(row) {
      return <NDataTable columns={base_data_columns} data={row.history}></NDataTable>
    }
  },
  ...base_data_columns,
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render(row) {
      return <NButtonGroup>
        <NButton type='default' onClick={() => updatePrompt(row.prompt)}>修改</NButton>
        <NPopconfirm positiveText='删除' negativeText='取消' v-slots={{
          trigger: () => <NButton type='error' >删除</NButton>
        }} onPositiveClick={() => deletePrompt(row.prompt)}>
          确认删除？
        </NPopconfirm>
        <NButton type='primary' onClick={() => {
          embeddingSpin.value = true
          getEmbedding(row.prompt)
        }}>更新Embedding</NButton>
      </NButtonGroup>
    },
  }
]

const embedding_data = useSessionStorage<Array<Item>>('embedding_data', [
  {
    prompt: '阳光学费：34800',
    date: new Date()
  }
])

const getEmbedding = useIpcClient('gpt:embedding', (_, data: { ok: boolean, prompt: string, vector: Array<number>, message: string }) => {
  if (data.ok) {
    const index = embedding_data.value.findIndex(item => item.prompt == data.prompt)
    const item = embedding_data.value[index]
    if (item) {
      const { history = [], ...oldItem } = item
      history.push(unref(oldItem))
      item.embedding = data.vector
      item.history = history
      embedding_data.value[index] = item
    } else {
      message.error(`prompt:[${data.prompt}]不存在`)
    }
  } else {
    message.error(data.message)
  }
  embeddingSpin.value = false
})

const dialog = useDialog()
const message = useMessage()

const createPrompt = async () => {
  const text = ref('')
  dialog.create({
    type: 'default',
    title: '输入Prompt',
    content() {
      return <NInput value={text.value} onInput={(value) => text.value = value} />
    },
    action() {
      return <NButton type='primary' disabled={text.value.length <= 0} onClick={() => {
        if (embedding_data.value.find(item => item.prompt === text.value)) {
          message.warning('prompt已经存在')
          return
        }

        embedding_data.value.push({
          prompt: text.value,
          date: new Date(),
        })

        dialog.destroyAll()
      }}>提交</NButton>
    },
  })
}

const deletePrompt = (prompt: string) => {
  const index = embedding_data.value.findIndex(item => item.prompt == prompt)
  embedding_data.value.splice(index, 1)
}

const updatePrompt = (prompt: string) => {
  const text = ref(prompt)
  const index = embedding_data.value.findIndex(item => item.prompt == prompt)
  const item = embedding_data.value[index]
  if (!item) {
    message.error('prompt找不到')
    return
  }
  dialog.create({
    type: 'default',
    title: '更新Prompt',
    content() {
      return <NInput value={text.value} onInput={(value) => text.value = value} />
    },
    action() {
      return <NButton type='primary' disabled={text.value.length <= 0} onClick={() => {
        if (embedding_data.value.find(item => item.prompt === text.value)) {
          message.warning('prompt已经存在')
          return
        }

        const { history = [], ...oldItem } = item

        history.push(oldItem)

        if (history.length > limitHistoryCount) {
          history.shift()
        }

        item.prompt = text.value
        item.date = new Date()
        item.history = history

        const historyItem = history.find(item => item.prompt == text.value)

        if (historyItem) {
          item.embedding = unref(historyItem.embedding)
        } else {
          Reflect.deleteProperty(item, 'embedding')
        }

        embedding_data.value[index] = unref(item)

        dialog.destroyAll()
      }}>提交</NButton>
    },
  })
}

const embeddingSpin = ref(false)
const embeddingModelValue = ref('')
const embeddingModelShow = ref(false)
const showEmbeddingModel = (value: string) => {
  embeddingModelValue.value = value
  embeddingModelShow.value = true
}

const savePrompt = useIpcClient<string, { ok: boolean, message: string }>('gpt:save_prompt', (_, data) => {
  if (data.ok) {
    message.success('保存成功')
  } else {
    if (data.message) {
      message.success(data.message ?? '保存失败')
    }
  }
})

const exportPromptFile = () => {
  savePrompt(JSON.stringify(embedding_data.value))
}

const readPrompt = useIpcClient<undefined, Array<Item>>('gpt:read_prompt', (_, data) => {
  embedding_data.value = data
})

const importPromptFile = () => {
  readPrompt()
}
</script>

<template>
  <div class="home">
    <div class="title">Embedding 列表 ({{ embedding_data.length }} / {{ limitEmbeddingCount }})</div>
    <br>
    <div class="tools">
      <NButton @click="exportPromptFile" :disabled="embedding_data.length <= 0">导出prompt列表</NButton>
      <NPopconfirm @positive-click="importPromptFile">
        导入prompt列表后将覆盖现有的
        <template #trigger>
          <NButton>导入prompt列表</NButton>
        </template>
      </NPopconfirm>
      <NButton type="primary" :disabled="embedding_data.length >= limitEmbeddingCount" @click="createPrompt">新增Prompt
      </NButton>
    </div>
    <br>
    <NSpin :show="embeddingSpin">
      <template #description>
        正在生成embedding
      </template>
      <NDataTable :columns="columns" :data="embedding_data"></NDataTable>
      <NModal v-model:show="embeddingModelShow">
        <div style="width: 60%;">
          <NCard>
            {{ embeddingModelValue }}
          </NCard>
        </div>
      </NModal>
    </NSpin>
  </div>
</template>

<style lang="scss" scoped>
.home {
  .title {
    font-size: 18px;
  }

  .tools {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style>
