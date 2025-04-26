<script setup>

import {Pencil, Trash} from "lucide-vue-next";

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
  <div class="flex flex-col p-4 bg-gray-100 rounded-xl shadow mb-5">
    <header class="flex mb-5">
      <h4 class="text-xl">{{ card.title }} </h4>
    </header>
      <p class="flex mb-10">{{ card.description }}</p>
    <div class="flex gap-2">
      <!-- Edit button-->
      <button class="p-2 rounded-full hover:bg-gray-200 cursor-pointer"
              aria-label="Edit"
              @click="editCard"
      >
        <Pencil class="w-5 h-5 text-gray-600" />
      </button>
      <!-- Delete button-->
      <button class="p-2 rounded-full hover:bg-red-100 cursor-pointer"
              aria-label="Delete"
              @click="deleteCard"
      >
        <Trash class="w-5 h-5 text-red-500" />
      </button>
    </div>
  </div>
</template>