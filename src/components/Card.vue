<script setup>

defineProps(['card'])
const emit = defineEmits(['deleteCard', 'editCard'])

function deleteCard() {
  emit('deleteCard')
}

function editCard() {
  emit('editCard')
}

</script>

<template>
  <div class="card">
    <h4>{{ card.title }} </h4>
    <p>{{ card.description }}</p>
    <button @click="editCard">✏️</button>
    <button @click.stop="deleteCard">🗑️</button>
  </div>
</template>

<style scoped>
.card {
  background: white;
  border: 1px solid #ddd;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}
</style>

<!--<template>-->
<!--  <div class="card">-->
<!--    <h4>{{ card.title }}</h4>-->
<!--    <p>{{ card.description }}</p>-->
<!--    <button @click="$emit('editCard')">✏️</button>-->
<!--    <button @click="deleteCard">🗑️</button>-->
<!--  </div>-->
<!--</template>-->

<!--<script setup>-->
<!--import {ref, watch} from "vue";-->

<!--const props = defineProps(['card'])-->
<!--const emit = defineEmits(['deleteCard', 'updateCard'])-->

<!--const editableTitle = ref(props.card.title)-->
<!--const editableDescription = ref(props.card.description)-->

<!--watch([editableTitle, editableDescription], ([newTitle, newDescription]) => {-->
<!--  props.card.title = newTitle-->
<!--  props.card.description = newDescription-->
<!--  emitUpdate()-->
<!--})-->

<!--function deleteCard() {-->
<!--  emit('deleteCard')-->
<!--}-->

<!--function emitUpdate() {-->
<!--  emit('updateCard', { ...props.card })-->
<!--}-->
<!--</script>-->

<!--<style scoped>-->
<!--.card {-->
<!--  background: white;-->
<!--  border: 1px solid #ddd;-->
<!--  padding: 0.5rem;-->
<!--  margin-bottom: 0.5rem;-->
<!--  border-radius: 4px;-->
<!--}-->
<!--</style>-->