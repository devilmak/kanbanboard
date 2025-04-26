<!-- Shows contents of Column and manages the cards -->
<script setup>
import { ref, onMounted } from 'vue'
import { db, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot, writeBatch, query, orderBy, serverTimestamp } from '../../firebase.js'
import Card from "@/components/Card.vue";
import {Pencil, Trash, SquarePlus} from "lucide-vue-next";
import draggable from 'vuedraggable'

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
      updatedDt: serverTimestamp()
    })
  } else {
    // add new card
    const cardsRef = collection(db, 'columns', props.column.id, 'cards')
    const cardsDocs = await getDocs(cardsRef)
    const sortOrder = cardsDocs.size

    await addDoc(cardsRef, {
      title,
      description,
      createdDt: serverTimestamp(),
      updatedDt: null,
      sortOrder
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

function onDragStart(evt) {
  const card = cards.value[evt.oldIndex]
  if (card) {
    card.originalColumnId = props.column.id // temporarily add
  }
}

async function onDragAdd(evt) {
  const movedCard = evt.item.__draggable_context.element // vuedraggable exposes it here
  const fromColumnId = movedCard.originalColumnId
  const toColumnId = props.column.id

  console.log('Moving card:', movedCard.title, 'from', fromColumnId, 'to', toColumnId)

  if (fromColumnId && toColumnId && fromColumnId !== toColumnId) {
    // writeBatch is to commit all changes at once
    const batch = writeBatch(db)

    // 1. Remove card from old column
    const oldCardRef = doc(db, 'columns', fromColumnId, 'cards', movedCard.id)
    batch.delete(oldCardRef)

    // 2. Find current number of cards in the designated column
    const cardsRef = collection(db, 'columns', toColumnId, 'cards')
    const cardsQuery = query(cardsRef, orderBy('sortOrder'))
    const cardsDocs = await getDocs(cardsQuery)

    const designatedCards = cardsDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    const newSortOrder = evt.newIndex ?? designatedCards.length // fallback if newIndex undefined

    // 3.Add to new column
    const newCardRef = doc(collection(db, 'columns', toColumnId, 'cards'))
    batch.set(newCardRef, {
      title: movedCard.title,
      description: movedCard.description,
      createdDt: serverTimestamp(),
      updatedDt: null,
      sortOrder: newSortOrder
    })
    await batch.commit()
  }

  // Cleanup temporary field
  delete movedCard.originalColumnId
}

async function onDragEnd(evt) {
  console.log('evt', evt)
  if (!evt.from || !evt.to || evt.from !== evt.to) {
    // Skip cross-column drags, they handled already
    return
  }

  const batch = writeBatch(db)
  cards.value.forEach((card, index) => {
    const cardRef = doc(db, 'columns', props.column.id, 'cards', card.id)
    batch.update(cardRef, { sortOrder: index })
  })
  await batch.commit()

  console.log('Reordered cards saved')
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
    cards.value.sort((a,b) => a.sortOrder - b.sortOrder)
  })
})
</script>

<template>
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

  <!-- Make each card draggable -->
  <draggable class="flex flex-col gap-2"
             v-model="cards"
             :group="{ name: 'cards', put: true, pull:true }"
             :data-column-id="column.id"
             item-key="id"
             @start="onDragStart"
             @add="onDragAdd"
             @end="onDragEnd"
  >
    <template #item="{ element: card, index }">
      <Card :card="card"
            @editCard="openCardModal(index)"
            @deleteCard="deleteCard(card.id)"
      />
    </template>
  </draggable>

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