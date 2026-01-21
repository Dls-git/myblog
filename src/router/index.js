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
                    component: () => import('@/views/home/home.vue'),
                    meta: { title: '首页' }
                },
                // 🌟 关键2：子路由path去掉开头的/，变成「相对路径」
                {
                    path: 'home', // 完整路径：/layout/home
                    component: () => import('@/views/home/home.vue'),
                    meta: { title: '首页' }
                },
                {
                    path: 'about', // 完整路径：/layout/about
                    component: () => import('@/views/about/about.vue'),
                    meta: { title: '关于' }
                },
                {
                    path: 'friends', // 完整路径：/layout/friends
                    component: () => import('@/views/friends/friends.vue'),
                    meta: { title: '友链' }
                },
                {
                    path: 'time', // 完整路径：/layout/time
                    component: () => import('@/views/time/time.vue'),
                    meta: { title: '时间轴' }
                },
                {
                    path: 'thinking', // 完整路径：/layout/thinking
                    component: () => import('@/views/thinking/ThinkingPage.vue'),
                    meta: { title: '思考' }
                },
                {
                    path: 'quotes', // 完整路径：/layout/quotes
                    component: () => import('@/views/quote/QuotePage.vue'),
                    meta: { title: '摘录' }
                },
                {
                    path: 'gallery', // 完整路径：/layout/gallery
                    component: () => import('@/views/gallery/GalleryPage.vue'),
                    meta: { title: '瞬间' }
                },
                {
                    path: 'post/:slug', // 完整路径：/layout/post/:slug
                    component: () => import('@/views/post/PostPage.vue'),
                    meta: { title: '文章详情' }
                },
                {
                    path: 'category/:name', // 完整路径：/layout/category/:name
                    component: () => import('@/views/category/CategoryPage.vue'),
                    meta: { title: '分类' }
                },
                {
                    path: 'tag/:name', // 完整路径：/layout/tag/:name
                    component: () => import('@/views/tag/TagPage.vue'),
                    meta: { title: '标签' }
                }
            ]
        },
        {
            path: '/cms',
            component: () => import('@/views/cms/LocalCmsPage.vue'),
            meta: { title: '后台管理' }
        },
        {
            path: '/cms/articles',
            component: () => import('@/views/cms/ArticleManagerPage.vue'),
            meta: { title: '文章管理' }
        },
        // 404 页面配置
        {
            path: '/:pathMatch(.*)*', // 匹配所有未定义路由
            name: 'NotFound',
            component: () => import('@/views/error/404.vue'),
            meta: { title: '404 Not Found' }
        }
    ]
})

// 全局后置守卫，动态设置标题
router.afterEach((to) => {
    const baseTitle = 'Youth Blog'; // 你的博客基础标题
    if (to.meta.title) {
        document.title = `${baseTitle} | ${to.meta.title}`;
    } else {
        document.title = baseTitle;
    }
});

export default router
