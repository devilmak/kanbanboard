<!-- Show contents of Board and manages the columns -->
<script setup>
import { ref, onMounted } from 'vue'
import { db, collection, doc, addDoc, updateDoc, deleteDoc, getDocs } from '../../firebase.js'
import Column from './Column.vue'

const props = defineProps(['board'])

const columns = ref([])
const showModal = ref(false)
const columnTitle = ref('')
const isEditingColumn = ref(false)
const editedColumnIndex = ref(null)

onMounted(async () => {
  // Load columns from Firestore
  const snapshot = await getDocs(collection(db, 'columns'))
  columns.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
})

async function deleteColumn(index) {
  // Delete column from Firestore
  await deleteDoc(doc(db, 'columns', columns.value[index].id))
  columns.value.splice(index, 1)
}

function openModal(index) {
  if (index !== null) {
    // edit column
    columnTitle.value = columns.value[index].title
    isEditingColumn.value = true
    editedColumnIndex.value = index
    showModal.value = true
  } else {
    // add new column
    columnTitle.value = ''
    isEditingColumn.value = false
    editedColumnIndex.value = null
    showModal.value = true
  }
}

async function confirmModal() {
  const title = columnTitle.value
  if (!title) return

  if (isEditingColumn.value) {
    // Editing existing column
    const column = columns.value[editedColumnIndex.value]

    columns.value[editedColumnIndex.value].title = title
    const columnRef = doc(db, 'columns', column.id)
    await updateDoc(columnRef, { title })

  } else {
    // Add the new column to Firestore
    const docRef = await addDoc(collection(db, 'columns'), {
      title,
      cards: []
    })
    // add into local ref
    columns.value.push({
      id: docRef.id,
      title,
      cards: []
    })
  }
  closeModal()
}

function closeModal() {
  showModal.value = false
  columnTitle.value = ''
  editedColumnIndex.value = null
}

function seeLog() {
  console.log('columns', columns.value)
  console.log('columnTitle', columnTitle.value)
  console.log('isEditingColumn', isEditingColumn.value)
  console.log('editedColumnIndex', editedColumnIndex.value)
}
</script>

<template>
  <div class="board">
    <button @click="openModal(null)">+ Add Column</button>
    <button @click="seeLog">console</button>
    <!-- Shared Modal for Add/Edit -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h3>{{ isEditingColumn ? 'Edit Column' : 'Add Column' }}</h3>
        <input v-model="columnTitle" placeholder="Column title" />
        <div class="actions">
          <button @click="confirmModal">{{ isEditingColumn ? 'Update' : 'Add' }}</button>
          <button @click="closeModal">Cancel</button>
        </div>
      </div>
    </div>

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


<!--<template>-->
<!--  <div class="board">-->
<!--    <button @click="openModal(-1)">➕ Column</button>-->

<!--    &lt;!&ndash; Shared Modal for Add/Edit &ndash;&gt;-->
<!--    <div v-if="showModal" class="modal">-->
<!--      <div class="modal-content">-->
<!--        <h3>{{ isEditingColumn ? 'Edit Column' : 'Add Column' }}</h3>-->
<!--        <input v-model="columnTitle" placeholder="Column title" />-->
<!--        <div class="actions">-->
<!--          <button @click="confirmModal">{{ isEditingColumn ? 'Update' : 'Add' }}</button>-->
<!--          <button @click="closeModal">Cancel</button>-->
<!--        </div>-->
<!--      </div>-->
<!--    </div>-->

<!--    <div class="columns">-->
<!--      <Column-->
<!--          v-for="(column, index) in columns"-->
<!--          :key="column.id"-->
<!--          :column="column"-->
<!--          @deleteColumn="deleteColumn(index)"-->
<!--          @updateColumn="updateColumn(index, $event)"-->
<!--          @editColumn="openModal(index)"-->
<!--      />-->
<!--    </div>-->
<!--  </div>-->
<!--</template>-->

<!--<script setup>-->
<!--import { reactive, ref } from 'vue'-->
<!--import Column from './Column.vue'-->

<!--const columns = reactive([])-->
<!--const showModal = ref(false)-->
<!--const columnTitle = ref('')-->
<!--const isEditingColumn = ref(false)-->
<!--const editedColumnIndex = ref(-1)-->

<!--function openModal(index) {-->
<!--  if (index !== -1) {-->
<!--    // edit column-->
<!--    columnTitle.value = columns[index].title-->
<!--    isEditingColumn.value = true-->
<!--    editedColumnIndex.value = index-->
<!--    showModal.value = true-->
<!--  } else {-->
<!--    // add new column-->
<!--    columnTitle.value = ''-->
<!--    isEditingColumn.value = false-->
<!--    editedColumnIndex.value = -1-->
<!--    showModal.value = true-->
<!--  }-->
<!--}-->

<!--function confirmModal() {-->
<!--  const title = columnTitle.value-->
<!--  if (!title) return-->

<!--  if (isEditingColumn.value) {-->
<!--    columns[editedColumnIndex.value].title = title-->
<!--  } else {-->
<!--    columns.push({-->
<!--      id: Date.now(),-->
<!--      title,-->
<!--      cards: []-->
<!--    })-->
<!--  }-->

<!--  closeModal()-->
<!--}-->

<!--function closeModal() {-->
<!--  showModal.value = false-->
<!--  columnTitle.value = ''-->
<!--  editedColumnIndex.value = -1-->
<!--}-->

<!--function deleteColumn(index) {-->
<!--  columns.splice(index, 1)-->
<!--}-->

<!--function updateColumn(index, updatedColumn) {-->
<!--  columns[index] = updatedColumn-->
<!--}-->
<!--</script>-->

<!--<style scoped>-->
<!--.board {-->
<!--  padding: 1rem;-->
<!--}-->

<!--.columns {-->
<!--  display: flex;-->
<!--  gap: 1rem;-->
<!--  margin-top: 1rem;-->
<!--}-->
<!--</style>-->