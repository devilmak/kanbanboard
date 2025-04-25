<!-- Shows contents of Column and manages the cards -->
<script setup>
import { ref, onMounted } from 'vue'
import { db, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot} from '../../firebase.js'
import Card from "@/components/Card.vue";

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
  <div class="column">
    <div class="column-header">
      <div>{{ column.title }}</div>
    </div>

    <div class="cards">
      <Card
          v-for="(card, index) in cards"
          :key="card.id"
          :card="card"
          @editCard="openCardModal(index)"
          @deleteCard="deleteCard(card.id)"
      />
    </div>

    <div class="column-actions">
      <button @click="editColumn()">✏️</button>
      <button @click="openCardModal(null)">➕ Task</button>
      <button @click="deleteColumn()">🗑️</button>
    </div>
  </div>

  <!-- Card Modal -->
  <div v-if="showModal" class="modal">
    <div class="modal-content">
      <h3>{{ isEditingCard ? 'Edit Task' : 'New Task' }}</h3>
      <input v-model="cardName" placeholder="Task title"/>
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