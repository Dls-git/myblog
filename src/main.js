import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router/index.js'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import {createPinia} from 'pinia'//导入pinia
import '@/assets/css/global.css'
import '@/assets/css/animate.css'

const pinia = createPinia()//创建pinia实例
createApp(App).use(router).use(ElementPlus).use(pinia).mount('#app')
