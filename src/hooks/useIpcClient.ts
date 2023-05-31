import { ipcRenderer } from "electron"

export default function useIpcClient<T, U = T>(
  event: string,
  callback?: (e: Event, data: U) => void
) {
  if (typeof callback === 'function') {
    onMounted(() => {
      ipcRenderer.on(event + '__result', callback)
    })

    onBeforeUnmount(() => {
      ipcRenderer.off(event + '__result', callback)
    })
  }

  return function send<T>(data?: T) {
    ipcRenderer.send(event, data)
  }
}
