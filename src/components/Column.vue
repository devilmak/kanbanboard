<template>
  <div class="column">
    <!-- Column Header -->
    <div class="column-header">
      <div>{{ column.title }}</div>
      <div class="column-actions">
        <button @click="$emit('editColumn')">✏️</button>
        <button @click="openModal(-1)">➕ Task</button>
        <button @click="deleteColumn">🗑️</button>
      </div>
    </div>

    <!-- Modal to add card -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h3>{{ isEditingCard ? 'Edit Card' : 'Add Card' }}</h3>
        <input v-model="cardTitle" placeholder="Card title" />
        <textarea v-model="cardDescription" placeholder="Card description"></textarea>
        <div class="actions">
          <button @click="confirmModal">{{ isEditingCard ? 'Update' : 'Add' }}</button>
          <button @click="closeModal">Cancel</button>
        </div>
      </div>
    </div>
    <!-- Card List -->
    <div class="cards">
      <Card
          v-for="(card, index) in column.cards"
          :key="card.id"
          :card="card"
          @deleteCard="deleteCard(index)"

          @editCard="openModal(index)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Card from './Card.vue'

const props = defineProps(['column'])
const emit = defineEmits(['deleteColumn', 'updateColumn'])

const editableTitle = ref(props.column.title)

watch(editableTitle, (newVal) => {
  props.column.title = newVal
  emitUpdate()
})

const showModal = ref(false)
const cardTitle = ref('')
const cardDescription = ref('')
const isEditingCard = ref(false)
const editedCardIndex = ref(-1)

function openModal(index) {
  if (index !== -1) {
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
    editedCardIndex.value = -1
    showModal.value = true
  }
}

function confirmModal() {
  const title = cardTitle.value
  const description = cardDescription.value
  if (!title || !description) return

  if (isEditingCard.value) {
    props.column.cards[editedCardIndex.value] = {
      ...props.column.cards[editedCardIndex.value],
      title,
      description
    }
  } else {
    props.column.cards.push({
      id: Date.now(),
      title: title,
      description: description
    })
  }
  emitUpdate();
  closeModal()
}

function closeModal() {
  showModal.value = false
  cardTitle.value = ''
  editedCardIndex.value = -1
}

function emitUpdate() {
  emit('updateColumn', { ...props.column })
}

function deleteColumn() {
  emit('deleteColumn')
}

function deleteCard(index) {
  props.column.cards.splice(index, 1)
  emitUpdate()
}

function updateCard(index, newCard) {
  props.column.cards[index] = newCard
  emitUpdate()
}
</script>

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

.column-actions button {
  margin-left: 4px;
}

.cards {
  margin-top: 1rem;
}

.add-task {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.add-task input,
.add-task textarea {
  padding: 0.4rem;
  width: 100%;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Modal styles
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  min-width: 300px;
}

.actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}*/
</style>
