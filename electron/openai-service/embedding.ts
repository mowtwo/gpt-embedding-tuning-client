import get_client from "./client"
import { openai_config } from "./env"

export default async function embedding(input: string) {
  try {
    const client = get_client()
    const res = await client.createEmbedding({
      model: openai_config.embedding_model,
      input: [input]
    })

    return res.data.data[0].embedding
  } catch (e) {
    throw e
  }
}
