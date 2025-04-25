<!-- src/App.vue -->
<template>
  <main>
    <router-view/>
  </main>
</template>

<script setup>
import './assets/modal.css'
</script>

<style scoped>
main {
  padding: 2rem;
  font-family: sans-serif;
}
</style>


<!--<script setup>-->
<!--import KanbanBoard from './components/KanbanBoard.vue'-->
<!--import Column from './components/Column.vue'-->
<!--</script>-->

<!--<template>-->
<!--  <header>-->
<!--&lt;!&ndash;    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />&ndash;&gt;-->

<!--    <div class="wrapper">-->
<!--      <KanbanBoard/>-->
<!--    </div>-->
<!--  </header>-->

<!--  <main>-->
<!--    <Column />-->
<!--  </main>-->
<!--</template>-->

<!--<style scoped>-->
<!--header {-->
<!--  line-height: 1.5;-->
<!--}-->

<!--.logo {-->
<!--  display: block;-->
<!--  margin: 0 auto 2rem;-->
<!--}-->

<!--@media (min-width: 1024px) {-->
<!--  header {-->
<!--    display: flex;-->
<!--    place-items: center;-->
<!--    padding-right: calc(var(&#45;&#45;section-gap) / 2);-->
<!--  }-->

<!--  .logo {-->
<!--    margin: 0 2rem 0 0;-->
<!--  }-->

<!--  header .wrapper {-->
<!--    display: flex;-->
<!--    place-items: flex-start;-->
<!--    flex-wrap: wrap;-->
<!--  }-->
<!--}-->
<!--</style>-->
