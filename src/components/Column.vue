<!-- Shows contents of Column and manages the cards -->
<script setup>
import { ref, onMounted } from 'vue'
import { db, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot} from '../../firebase.js'
import Card from "@/components/Card.vue";
import {Pencil, Trash, SquarePlus} from "lucide-vue-next";

const props = defineProps(['column'])
const cards = ref([]) // holds cards in this column
const emit = defineEmits(['deleteColumn', 'editColumn', 'editCard'])

const showModal = ref(false)
const cardName = ref('')
const cardDescription = ref('')
const isEditingCard = ref(false)
const editedCardIndex = ref(null)

function editColumn() {
  emit('editColumn')
}

function deleteColumn() {
  emit('deleteColumn')
}

function openCardModal(index) {
  const card = cards.value[index] // 🔁 CHANGED
  if (index !== null) {
    // edit card
    cardName.value = card.title
    cardDescription.value = card.description
    isEditingCard.value = true
    editedCardIndex.value = index
    showModal.value = true
  } else {
    // add new card
    cardName.value = ''
    cardDescription.value = ''
    isEditingCard.value = false
    editedCardIndex.value = null
    showModal.value = true
  }
}

async function confirmCardModal() {
  const title = cardName.value
  const description = cardDescription.value
  if (!title || !description) return

  if (isEditingCard.value) {
    // edit card
    const card = cards.value[editedCardIndex.value]
    const cardRef = doc(db, 'columns', props.column.id, 'cards', card.id)
    await updateDoc(cardRef, {
      title,
      description,
      updatedDt: new Date()
    })
  } else {
    // add new card
    const cardsRef = collection(db, 'columns', props.column.id, 'cards')
    await addDoc(cardsRef, {
      title,
      description,
      createdDt: new Date(),
      updatedDt: null
    })
  }
  closeCardModal()
}

function closeCardModal() {
  showModal.value = false
  cardName.value = ''
  cardDescription.value = ''
  editedCardIndex.value = null
}

async function deleteCard(cardId) {
  const cardRef = doc(db, 'columns', props.column.id, 'cards', cardId)
  await deleteDoc(cardRef)
}

// works like ngOnInit
onMounted(() => {
  const cardsRef = collection(db, 'columns', props.column.id, 'cards')

  // works as an observable that keep tracks on changes
  onSnapshot(cardsRef, (snapshot) => {
    cards.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
  })
})
</script>

<template>
  <div class="flex flex-col p-4 bg-white rounded-xl shadow">
    <header class="flex items-center justify-between">
      <div class="flex-1 text-center text-xl font-bold">
        {{ column.title }}
      </div>
      <button class="p-2 rounded-full hover:bg-gray-200 cursor-pointer"
              aria-label="Edit"
              @click="editColumn()"
      >
        <Pencil class="w-5 h-5 text-gray-600" />
      </button>
    </header>
    <hr class="h-px my-2 bg-gray-200 border-0 dark:bg-gray-700">

    <!-- Loop through each card -->
    <div class="cards">
      <Card
          v-for="(card, index) in cards"
          :key="card.id"
          :card="card"
          @editCard="openCardModal(index)"
          @deleteCard="deleteCard(card.id)"
      />
    </div>
    <div class="flex justify-end-safe gap-2">
      <!-- Add button-->
      <button class="p-2 rounded-full hover:bg-gray-200 cursor-pointer"
              aria-label="Add"
              @click="openCardModal(null)"
      >
        <SquarePlus class="w-5 h-5 text-gray-600"/>
      </button>
      <!-- Delete button-->
      <button class="p-2 rounded-full hover:bg-red-100 cursor-pointer"
              aria-label="Delete"
              @click="deleteColumn()"
      >
        <Trash class="w-5 h-5 text-red-500" />
      </button>
    </div>
  </div>

  <!-- Card Modal -->
  <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
      <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{{ isEditingCard ? 'Edit Task' : 'New Task' }}</h3>
      <input class="w-full px-4 py-2 mb-4 border rounded-lg text-gray-800 dark:text-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
             v-model="cardName"
             placeholder="Task title"/>
      <textarea class="w-full px-4 py-2 mb-4 border rounded-lg text-gray-800 dark:text-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                v-model="cardDescription"
                placeholder="Task description"/>
      <div class="flex justify-end space-x-2">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                @click="confirmCardModal"
        >
          {{ isEditingCard ? 'OK' : 'Add' }}
        </button>
        <button class="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                @click="closeCardModal"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>