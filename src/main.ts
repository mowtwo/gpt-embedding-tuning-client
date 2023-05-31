import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// import naive from "naive-ui"

console.log('load')

createApp(App)
  .use(router)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
