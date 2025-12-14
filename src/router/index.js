//配置路由
import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({
    history: createWebHistory(),
    routes: [
        // 根路径重定向到 /layout（正确）
        {
            path: '/',
            redirect: '/layout/home'
        },
        // layout 父路由（嵌套路由的核心）
        {
            path: '/layout',
            component: () => import('@/views/layout/layout.vue'),
            children: [
                // 🌟 关键1：默认子路由（空path）直接渲染home，无需redirect
                {
                    path: '', // 匹配 /layout 路径，显示home
                    component: () => import('@/views/home/home.vue')
                },
                // 🌟 关键2：子路由path去掉开头的/，变成「相对路径」
                {
                    path: 'home', // 完整路径：/layout/home
                    component: () => import('@/views/home/home.vue')
                },
                {
                    path: 'about', // 完整路径：/layout/about
                    component: () => import('@/views/about/about.vue')
                },
                {
                    path: 'friends', // 完整路径：/layout/friends
                    component: () => import('@/views/friends/friends.vue')
                },
                {
                    path: 'time', // 完整路径：/layout/time
                    component: () => import('@/views/time/time.vue')
                }
            ]
        }
    ]
})
export default router
