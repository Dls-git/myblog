import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router/index.js'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import {createPinia} from 'pinia'//导入pinia
import '@/assets/css/global.scss'
import '@/assets/css/animate.css'
import '@/assets/css/swup.css'
import '@/assets/css/theme-vars.scss'
import 'github-markdown-css/github-markdown.css'
import '@/assets/css/markdown.scss'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';




const pinia = createPinia()//创建pinia实例
const app=createApp(App)
app.use(router).use(ElementPlus).use(pinia).use(Antd).mount('#app')
