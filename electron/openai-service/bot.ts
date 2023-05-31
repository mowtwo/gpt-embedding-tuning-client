import get_client from "./client"
import embedding from "./embedding"
import { openai_config, template_config } from "./env"
import { get_answer } from "./utilt"

export let context_list = Array<{
  context: string,
  instanceId: string,
  send: (prompt: string, inputs: Array<{ vector: Array<number>, prompt: string }>) => Promise<{
    ok: boolean
    question?: string
    answer?: string
    message?: string
    question_embedding?: Array<number>
  }>
}>()

export default function openBot(instanceId?: string) {
  let history = ''

  const client = get_client()

  const make_qa = (q: string, a: string) => {
    return `${template_config.from}:${q}\n${template_config.bot}:${a}`
  }

  const make_prompt = (prompt: string, inputs: Array<{ vector: Array<number>, prompt: string }>, questions: Array<number>) => {
    const answer = get_answer(inputs, questions)
    return `${template_config.prefix_message}\n---\nConversationHistory:${history}\n---\nMemoryContext:${answer?.input ?? ''}\n---\n${make_qa(prompt, '')}`
  }

  const bot = {
    context: '',
    instanceId: instanceId ?? Date.now().toString(),
    async send(prompt: string, inputs: Array<{ vector: Array<number>, prompt: string }>) {
      console.log('prompt', prompt)
      try {
        const question_embedding = await embedding(prompt)
        const content = make_prompt(prompt, inputs, question_embedding)
        console.log('content', content)
        const res = await client.createChatCompletion({
          model: openai_config.chat_model,
          messages: [
            {
              content,
              role: 'user'
            }
          ]
        })
        const answer = res.data.choices[0].message.content!
        history += make_qa(prompt, answer)
        console.log('history', history)
        return {
          ok: true,
          answer,
          question_embedding,
          question: prompt
        }
      } catch (error) {
        return {
          ok: false,
          message: '连接失败'
        }
      }
    }
  }

  // @ts-ignore
  context_list.push(bot)

  return bot
}

export function closeBot(id: string) {
  const index = context_list.findIndex(item => item.instanceId == id)
  context_list.splice(index, 1)
  return context_list
}
