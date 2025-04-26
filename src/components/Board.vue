<!-- Show contents of Board and manages the columns -->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { db, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, where, query, orderBy, onSnapshot, writeBatch, serverTimestamp } from '../../firebase.js'
import Column from './Column.vue'
import { ArrowLeft, Plus } from "lucide-vue-next";
import draggable from 'vuedraggable'

const route = useRoute()
const router = useRouter()
const boardId = route.params.id
const boardName = route.query.boardName

const columns = ref([])
const showModal = ref(false)
const columnName = ref('')
const isEditingColumn = ref(false)
const editedColumnIndex = ref(null)

async function deleteColumn(index) {
  // Delete column from Firestore
  const column = columns.value[index]
  const columnRef = doc(db, 'columns', column.id)
  await deleteDoc(columnRef)

  // Reassign sortOrder properly
  await fixSortOrders()
}

function openColumnModal(index) {
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
      updatedDt: serverTimestamp()
    })
  } else {
    // Add the new column to Firestore
    const orderIndex = columns.value.length
    await addDoc(collection(db, 'columns'), {
      boardId,
      title,
      createdDt: serverTimestamp(),
      updatedDt: null,
      sortOrder: orderIndex
    })
  }
  closeColumnModal()
}

function closeColumnModal() {
  showModal.value = false
  columnName.value = ''
  editedColumnIndex.value = null
}

function routeToKanbanBoard() {
  router.back()
}

// persist data after drag-and-drop
async function onReorder() {
  await fixSortOrders()
}

async function fixSortOrders() {
  const batch = writeBatch(db)

  columns.value.forEach((col, idx) => {
    const colRef = doc(db, 'columns', col.id)
    batch.update(colRef, { sortOrder: idx })
  })

  await batch.commit()
}

// works like ngOnInit
onMounted(() => {
  const q = query(collection(db, 'columns'), where('boardId', '==', boardId), orderBy('sortOrder')
  )

  onSnapshot(q, (snapshot) => {
    columns.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  })
})
</script>

<template>
  <header class="sticky top-0 shadow bg-gray-200">
    <div class="flex flex-row py-6 px-4 justify-between">
      <div class="flex">
        <!-- Add Back button -->
        <button class="text-white p-2 rounded hover:bg-gray-100 cursor-pointer"
                @click="routeToKanbanBoard()"
        >
          <ArrowLeft class="w-6 h-6 text-gray-600" />
        </button>
        <h1 class="text-3xl px-5">{{ boardName }}</h1>
      </div>
      <!-- Add Column button -->
      <button class="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer align-middle"
              @click="openColumnModal(null)"
      >
        <Plus class="w-4 h-4"/>
        <span class="ml-1">Column</span>
      </button>
    </div>
  </header>

  <!-- Make each column draggable -->
  <draggable class="p-4 grid grid-cols-5 gap-4"
             v-model="columns"
             item-key="id"
             @end="onReorder"
  >
    <template #item="{ element, index }">
      <div class="flex flex-col p-4 bg-white rounded-xl shadow">
        <Column
            :column="element"
            @deleteColumn="deleteColumn(index)"
            @editColumn="openColumnModal(index)"
        />
      </div>
    </template>
  </draggable>

  <!-- Shared Modal for Add/Edit -->
  <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
      <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{{ isEditingColumn ? 'Edit Column' : 'Add Column' }}</h3>
      <input class="w-full px-4 py-2 mb-4 border rounded-lg text-gray-800 dark:text-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
             v-model="columnName"
             placeholder="Column title"
      />
      <div class="flex justify-end space-x-2">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                @click="confirmColumnModal"
        >
          {{ isEditingColumn ? 'OK' : 'Add' }}
        </button>
        <button class="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                @click="closeColumnModal"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
