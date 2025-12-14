import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router/index.js'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import {createPinia} from 'pinia'//导入pinia
import '@/assets/css/global.css'
import '@/assets/css/animate.css'
import '@/assets/css/swup.css'

const pinia = createPinia()//创建pinia实例
const app=createApp(App)
app.use(router).use(ElementPlus).use(pinia).mount('#app')
