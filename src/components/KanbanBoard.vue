<!--The MAIN page, manages Boards-->
<script setup>
import { ref, onMounted } from 'vue'
import {
  db,
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  serverTimestamp,
  writeBatch
} from '../../firebase.js'
import { useRouter } from "vue-router"
import draggable from 'vuedraggable'
import {Pencil, Plus, Trash} from 'lucide-vue-next'

const router = useRouter()
const boards = ref([])
const showModal = ref(false)
const boardName = ref('')
const isEditingBoard = ref(false)
const editedBoardIndex = ref(null)

// function to delete board
// need to delete columns as it is a separated collection
async function deleteBoard(boardId) {
  const batch = writeBatch(db)

  // Query all columns belonging to the board
  const q = query(collection(db, 'columns'), where('boardId', '==', boardId))
  const columnDocs = await getDocs(q)

  // Queue all column deletions
  columnDocs.forEach((cDoc) => {
    const colRef = doc(db, 'columns', cDoc.id)
    batch.delete(colRef)
  })

  // Queue the board deletion
  const boardRef = doc(db, 'boards', boardId)
  batch.delete(boardRef)

  // Commit all deletes at once
  await batch.commit()

  // Fix remaining sort orders
  await fixSortOrders()
}

function openBoardModal(index) {
  if (index !== null) {
    // edit board
    boardName.value = boards.value[index].title
    isEditingBoard.value = true
    editedBoardIndex.value = index
    showModal.value = true
  } else {
    // add new board
    boardName.value = ''
    isEditingBoard.value = false
    editedBoardIndex.value = null
    showModal.value = true
  }
}

async function confirmBoardModal() {
  const title = boardName.value
  if (!title) return

  if (isEditingBoard.value) {
    // update db
    const board = boards.value[editedBoardIndex.value]
    const boardRef = doc(db, 'boards', board.id)
    await updateDoc(boardRef, {
      title,
      updatedDt: serverTimestamp()
    })
  } else {
    // add to db
    const orderIndex = boards.value.length
    await addDoc(collection(db, 'boards'), {
      title,
      createdDt: serverTimestamp(),
      updatedDt: null,
      sortOrder: orderIndex,
    })
    boardName.value = ''
  }
  closeBoardModal()
}

function closeBoardModal() {
  showModal.value = false
  boardName.value = ''
  editedBoardIndex.value = null
}

function routeToBoard(board) {
  router.push({
      path: `/board/${board.id}`,
      query: { boardName: board.title }
  })
}

// persist data after drag-and-drop
async function onReorder() {
  await fixSortOrders()
}

async function fixSortOrders() {
  const batch = writeBatch(db)

  boards.value.forEach((board, idx) => {
    const boardRef = doc(db, 'boards', board.id)
    batch.update(boardRef, { sortOrder: idx })
  })

  await batch.commit()
}

// works like ngOnInit
onMounted(() => {
  const boardsRef = collection(db, 'boards')

  // works as an observable that keep tracks on changes
  onSnapshot(boardsRef, (snapshot) => {
    boards.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
    .sort((a,b) => a.sortOrder - b.sortOrder)
  })
})
</script>

<template>
  <header class="sticky top-0 shadow bg-gray-200">
    <div class="flex flex-row py-6 px-4 justify-between">
      <p class="text-3xl">Simple Kanban Board</p>
      <button class="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer align-middle"
              @click="openBoardModal(null)"
      >
        <Plus class="w-4 h-4"/>
        <span class="ml-1">Board</span>
      </button>
    </div>
  </header>

  <draggable class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
             v-model="boards"
             item-key="id"
             @end="onReorder">
    <template #item="{ element: board, index }">
      <div class="flex flex-col justify-center p-4 bg-white rounded-xl shadow hover:bg-gray-300 cursor-pointer"
           @click="routeToBoard(board)">
        <span class="text-xl">{{ board.title }}</span>
        <div class="flex justify-end-safe gap-4">
          <button @click.stop="openBoardModal(index)">
            <Pencil class="w-5 h-5 text-gray-600" />
          </button>
          <button @click.stop="deleteBoard(board.id)">
            <Trash class="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>
    </template>
  </draggable>

  <!--  Board Modal-->
  <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
      <h3 class="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{{ isEditingBoard ? 'Edit Board' : 'New Board' }}</h3>
      <input class="w-full px-4 py-2 mb-4 border rounded-lg text-gray-800 dark:text-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
             v-model="boardName"
             placeholder="Board title"
      />
      <div class="flex justify-end space-x-2">
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                @click="confirmBoardModal"
        >{{ isEditingBoard ? 'OK' : 'Add' }}
        </button>
        <button class="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                @click="closeBoardModal"
        >Cancel
        </button>
      </div>
    </div>
  </div>
</template>
