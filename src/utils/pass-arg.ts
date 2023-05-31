export type PassArg<F extends (...args: any) => any> = F extends (pass: any, ...args: infer Args) => any ? (...args: Args) => ReturnType<F> : () => ReturnType<F>

export default function pass_arg<F extends (...args: any) => any>(callback: PassArg<F>): F {
  // @ts-ignore
  return (_, ...args) => {
    return callback(...args)
  }
}
