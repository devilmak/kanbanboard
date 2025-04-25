import { createRouter, createWebHistory } from 'vue-router'
import KanbanBoard from '@/components/KanbanBoard.vue'
import Board from '@/components/Board.vue'

const routes = [
    { path: '/', redirect: '/boards' },
    { path: '/boards', component: KanbanBoard },
    { path: '/board/:id', component: Board, props: true },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
