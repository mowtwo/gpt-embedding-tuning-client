export type Item = {
  prompt: string
  embedding?: Array<number>
  date: Date
  history?: Array<Omit<Item, 'history'>>
}
