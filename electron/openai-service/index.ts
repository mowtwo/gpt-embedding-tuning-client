import { ipcMain, dialog } from "electron"
import { openai_config } from "./env"
import embedding from "./embedding"
import { writeFile, readFile } from "fs/promises"
import openBot, { closeBot, context_list } from "./bot"
import make_service from "./service"
import { pass_arg } from "./utilt"

export default function gpt_bootstrap() {
  const service = make_service()

  service.use_route(
    'has_key',
    pass_arg((res) => {
      res.send(openai_config.key != '')
    })
  )

  service.get_route(
    'config',
    pass_arg(res => {
      res.send(openai_config)
    })
  )

  service.set_route<typeof openai_config>(
    'config',
    ({ data }, res) => {
      for (const key in data) {
        openai_config[key] = data[key]
      }
      res.send(true)
    }
  )

  service.use_route<string>(
    'embedding',
    async ({ data }, res) => {
      try {
        const vector = await embedding(data)
        res.send({
          ok: true,
          prompt: data,
          vector
        })
      } catch (error) {
        res.send({
          ok: false,
          message: String(error?.message)
        })
      }
    }
  )

  service.use_route<string>(
    'save_prompt',
    async ({ data }, s_res) => {
      try {
        const res = await dialog.showSaveDialog({
          title: '导出prompt文件',
          buttonLabel: '保存',
          filters: [
            {
              name: 'prompt json',
              extensions: ['json', 'json5']
            }
          ],
          nameFieldLabel: 'prompt name',
          defaultPath: Date.now().toString()
        })
        await writeFile(res.filePath!, data, { encoding: 'utf-8' })
        s_res.send({
          ok: true
        })
      } catch (error) {
        s_res.send({
          ok: false
        })
      }
    }
  )

  service.use_route(
    'read_prompt',
    pass_arg(async (s_res) => {
      try {
        const res = await dialog.showOpenDialog({
          title: '导入prompt文件',
          buttonLabel: '读取',
          filters: [{
            name: 'prompt json',
            extensions: ['json', 'json5']
          }],
        })
        const text = await readFile(res.filePaths[0]!, { encoding: 'utf-8' })
        s_res.send(JSON.parse(text))
      } catch { }
    })
  )

  service.get_route(
    'context',
    pass_arg(res => {
      res.send(context_list.map(item => item.instanceId))
    })
  )

  service.use_route<string>(
    'append_context',
    ({ data }, res) => {
      try {
        const bot = openBot(data)
        res.send({
          ok: true,
          id: bot.instanceId
        })
      } catch {
        res.send({
          ok: false,
        })
      }
    }
  )

  service.remove_route<string>(
    'context',
    ({ data }, res) => {
      closeBot(data)
      res.send(true)
    }
  )

  service.use_route<{
    instanceId: string
    question: string
    inputs: Array<{ vector: Array<number>, prompt: string }>
  }>(
    'question',
    async ({ data }, res) => {
      const instance = context_list.find(item => item.instanceId == data.instanceId)
      if (!instance) {
        res.send({
          ok: false,
          message: '不存在的连接'
        })
        return
      }
      const answer = await instance.send(data.question, data.inputs)
      res.send(answer)
    }
  )
}
