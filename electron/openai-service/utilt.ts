export function get_answer(inputs: Array<{ vector: Array<number>, prompt: string }>, questions: Array<number>) {
  console.log(inputs,questions)
  const results: Array<{
    similarity: number
    index: number
    input: string
  }> = []

  for (let i = 0; i < inputs.length; i++) {
    const similarity = cosineSimilarity(inputs[i].vector, questions)
    results.push({
      similarity,
      index: i,
      input: inputs[i].prompt
    })
  }

  return results.sort((a, b) => {
    if (a.similarity < b.similarity) {
      return -1
    }
    if (a.similarity > b.similarity) {
      return 1
    }
    return 0
  }).at(-1)
}

export function cosineSimilarity(vector_u: number[], vector_v: number[]) {
  let dotProduct = 0
  let uLength = 0
  let vLength = 0
  for (let i = 0; i < vector_u.length; i++) {
    dotProduct += vector_u[i] * vector_v[i]
    uLength += vector_u[i] ** 2
    vLength += vector_v[i] ** 2
  }
  uLength = Math.sqrt(uLength)
  vLength = Math.sqrt(vLength)

  return dotProduct / (uLength * vLength)
}

export type PassArg<F extends (...args: any) => any> = F extends (pass: any, ...args: infer Args) => any ? (...args: Args) => ReturnType<F> : () => ReturnType<F>

export function pass_arg<F extends (...args: any) => any>(callback: PassArg<F>): F {
  // @ts-ignore
  return (_, ...args) => {
    return callback(...args)
  }
}
