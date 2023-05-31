import { createRouter, createWebHashHistory } from "vue-router";
import Layout from "./layout/index.vue"

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/config',
      name: 'config',
      component: () => import('./views/config/index.vue')
    },
    {
      path: '/',
      component: Layout,
      children: [
        {
          path: '',
          redirect: { name: 'home' }
        },
        {
          path: 'home',
          name: 'home',
          component: () => import('./views/home/index.vue'),
          meta: {
            label: '首页',
            showNav: true
          }
        },
        {
          path: 'bot',
          name: 'bot',
          component: () => import('./views/bot/index.vue'),
          meta: {
            label: '调试',
            showNav: true
          }
        }
      ],
      beforeEnter(to, _, next) {
        console.log(to.meta)
        if (to.meta.label) {
          document.title = to.meta.label as string
        }
        next()
      }
    }
  ]
})
