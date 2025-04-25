<!-- Shows contents of Column and manages the cards -->
<script setup>
import {ref} from 'vue'
import { db, doc, updateDoc} from '../../firebase.js'
import Card from "@/components/Card.vue";

const props = defineProps(['column'])
const emit = defineEmits(['deleteColumn', 'updateColumn', 'editColumn', 'addCard', 'editCard'])

const showModal = ref(false)
const cardTitle = ref('')
const cardDescription = ref('')
const isEditingCard = ref(false)
const editedCardIndex = ref(null)

function openCardModal(index) {
  if (index !== null) {
    // edit card
    cardTitle.value = props.column.cards[index].title
    cardDescription.value = props.column.cards[index].description
    isEditingCard.value = true
    editedCardIndex.value = index
    showModal.value = true
  } else {
    // add new card
    cardTitle.value = ''
    cardDescription.value = ''
    isEditingCard.value = false
    editedCardIndex.value = null
    showModal.value = true
  }
}

async function confirmCardModal() {
  const title = cardTitle.value
  const description = cardDescription.value
  if (!title || !description) return

  const updatedColumn = { ...props.column }

  if (isEditingCard.value) {
    // edit card
    updatedColumn.cards[editedCardIndex.value] = {
      title,
      description,
      updatedDt: new Date()
    }
  } else {
    // add new card
    updatedColumn.cards.push({
      title: title,
      description: description,
      createdDt: new Date(),
      updatedDt: null
    })
  }

  // Save to Firestore
  const columnRef = doc(db, 'columns', updatedColumn.id)
  await updateDoc(columnRef, {
    cards: updatedColumn.cards
  })

  emit('updateColumn', updatedColumn)
  closeCardModal()
}

function closeCardModal() {
  showModal.value = false
  cardTitle.value = ''
  cardDescription.value = ''
  editedCardIndex.value = null
}

function deleteCard(index) {
  props.column.cards.splice(index, 1) // update page view

  const columnRef = doc(db, 'columns', props.column.id)
  updateDoc(columnRef, {
    cards: props.column.cards
  })
  emit('updateColumn', props.column) // notify parent
}
</script>

<template>
  <div class="column">
    <div class="column-header">
      <div>{{ column.title }}</div>
    </div>

    <div class="cards">
      <Card
          v-for="(card, index) in column.cards"
          :key="card.id"
          :card="card"
          @editCard="openCardModal(index)"
          @deleteCard="deleteCard(index)"
      />
    </div>

    <div class="column-actions">
      <button @click="$emit('editColumn')">✏️</button>
      <button @click="openCardModal(null)">➕ Task</button>
      <button @click="$emit('deleteColumn')">🗑️</button>
    </div>
  </div>

  <!-- Card Modal -->
  <div v-if="showModal" class="modal">
    <div class="modal-content">
      <h3>{{ isEditingCard ? 'Edit Task' : 'New Task' }}</h3>
      <input v-model="cardTitle" placeholder="Task title"/>
      <textarea v-model="cardDescription" placeholder="Task description"/>
      <div class="actions">
        <button @click="confirmCardModal">{{ isEditingCard ? 'Update' : 'Add' }}
        </button>
        <button @click="closeCardModal">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.column {
  border: 1px solid #ccc;
  padding: 1rem;
  width: 250px;
  background: #f9f9f9;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.column-header input {
  flex-grow: 1;
  padding: 0.25rem;
}

.column-actions {
  display: flex;
  margin-top: 1rem;
  margin-left: auto;
}

.column-actions button {
  margin-left: 4px;
}

.cards {
  margin-top: 1rem;
}

.add-task input,
.add-task textarea {
  padding: 0.4rem;
  width: 100%;
}
</style>
