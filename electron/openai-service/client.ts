import { openai_config } from "./env";
import { Configuration, OpenAIApi } from "openai"

let client: OpenAIApi
let lastApiKey: string

export default function get_client() {
  if (!client || lastApiKey != openai_config.key) {
    const config = new Configuration({
      apiKey: lastApiKey = openai_config.key
    })
    return client = new OpenAIApi(config)
  }
  return client
}
