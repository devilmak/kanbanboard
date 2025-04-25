<!-- Show contents of Board and manages the columns -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { db, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, where, query } from '../../firebase.js'
import Column from './Column.vue'

const route = useRoute()
const router = useRouter()
const boardId = route.params.id
const boardName = route.query.boardName

const columns = ref([])
const showModal = ref(false)
const columnName = ref('')
const isEditingColumn = ref(false)
const editedColumnIndex = ref(null)

async function fetchColumns() {
  const q = query(collection(db, 'columns'), where('boardId', '==', boardId))
  const snapshot = await getDocs(q)
  columns.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

async function deleteColumn(index) {
  // Delete column from Firestore
  await deleteDoc(doc(db, 'columns', columns.value[index].id))
  columns.value.splice(index, 1)
}

function openModal(index) {
  if (index !== null) {
    // edit column
    columnName.value = columns.value[index].title
    isEditingColumn.value = true
    editedColumnIndex.value = index
    showModal.value = true
  } else {
    // add new column
    columnName.value = ''
    isEditingColumn.value = false
    editedColumnIndex.value = null
    showModal.value = true
  }
}

async function confirmColumnModal() {
  const title = columnName.value
  if (!title) return

  if (isEditingColumn.value) {
    // Editing existing column
    const column = columns.value[editedColumnIndex.value]

    columns.value[editedColumnIndex.value].title = title
    const columnRef = doc(db, 'columns', column.id)
    await updateDoc(columnRef, {
      title,
      updatedDt: new Date()
    })

  } else {
    // Add the new column to Firestore
    const docRef = await addDoc(collection(db, 'columns'), {
      boardId,
      title,
      cards: [],
      createdDt: new Date(),
      updatedDt: null
    })
    // add into local ref
    columns.value.push({
      id: docRef.id,
      boardId,
      title,
      cards: []
    })
  }
  closeModal()
}

function closeModal() {
  showModal.value = false
  columnName.value = ''
  editedColumnIndex.value = null
}

function routeToKanbanBoard() {
  router.back()
}

// Basically ngOnInit -> get initial data upon landing to this page
onMounted(fetchColumns)
</script>

<template>
  <div class="board">
    <h2 class="text-xl font-bold mb-4">{{ boardName }}</h2>
    <button @click="routeToKanbanBoard()">← Back</button>
    <button @click="openModal(null)">+ Add Column</button>

    <div class="columns">
      <Column
          v-for="(column, index) in columns"
          :key="column.id"
          :column="column"
          @deleteColumn="deleteColumn(index)"
          @updateColumn="columns[index] = $event"
          @editColumn="openModal(index)"
      />
    </div>
  </div>

  <!-- Shared Modal for Add/Edit -->
  <div v-if="showModal" class="modal">
    <div class="modal-content">
      <h3>{{ isEditingColumn ? 'Edit Column' : 'Add Column' }}</h3>
      <input v-model="columnName" placeholder="Column title" />
      <div class="actions">
        <button @click="confirmColumnModal">{{ isEditingColumn ? 'Update' : 'Add' }}</button>
        <button @click="closeModal">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board {
  padding: 1rem;
}

.columns {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
}
</style>