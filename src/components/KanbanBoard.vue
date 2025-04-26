<!--The MAIN page, manages Boards-->
<script setup>
import { ref, onMounted } from 'vue'
import { db, collection, doc, addDoc, deleteDoc, getDocs, onSnapshot, query, updateDoc, where, orderBy } from '../../firebase.js'
import { useRouter } from "vue-router"
import draggable from 'vuedraggable'
import {Pencil, Plus, Trash} from 'lucide-vue-next'

const router = useRouter()
const boards = ref([])
const showModal = ref(false)
const boardName = ref('')
const isEditingBoard = ref(false)
const editedBoardIndex = ref(null)

// cursor
const isHovering = ref(false);

// function to delete board
// need to delete columns as it is a separated collection
async function deleteBoard(boardId) {

  const q = query(collection(db, 'columns'), where('boardId', '==', boardId))
  const columnDocs = await getDocs(q)
  const deleteColumnPromises = columnDocs.docs.map(cDoc =>
      deleteDoc(doc(db, 'columns', cDoc.id))
  )
  await Promise.all(deleteColumnPromises) //delete them in parallel

  const index = boards.value.findIndex(board => board.id !== boardId)
  boards.value.splice(index, 1) // update page view
  await deleteDoc(doc(db, 'boards', boardId)) // remove the board in db

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
      updatedDt: new Date()
    })
  } else {
    // add to db
    const orderIndex = boards.value.length
    await addDoc(collection(db, 'boards'), {
      title,
      createdDt: new Date(),
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
  for (let i = 0; i < boards.value.length; i++) {
    const board = boards.value[i]
    const boardRef = doc(db, 'boards', board.id)
    await updateDoc(boardRef, { sortOrder: i })
  }
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
    boards.value.sort((a,b) => a.sortOrder - b.sortOrder)
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

<!--  <div class="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">-->
<!--    &lt;!&ndash; Loop through each board &ndash;&gt;-->
<!--    <div class="flex flex-col justify-center p-4 bg-white rounded-xl shadow hover:bg-gray-300 cursor-pointer"-->
<!--         v-for="(board, index) in boards"-->
<!--         :key="board.id"-->
<!--         @click="routeToBoard(board)"-->
<!--    >-->
<!--      <span class="text-xl">{{ board.title }}</span>-->
<!--      <div class="flex justify-end-safe gap-4">-->
<!--        &lt;!&ndash; Edit button&ndash;&gt;-->
<!--        &lt;!&ndash; @click.stop to prevent click from accidental routing &ndash;&gt;-->
<!--        <button class="p-2 rounded-full hover:bg-gray-100 cursor-pointer"-->
<!--                aria-label="Edit"-->
<!--                @click.stop="openBoardModal(index)"-->
<!--        >-->
<!--          <Pencil class="w-5 h-5 text-gray-600" />-->
<!--        </button>-->
<!--        &lt;!&ndash; Delete button&ndash;&gt;-->
<!--        <button class="p-2 rounded-full hover:bg-red-100 cursor-pointer"-->
<!--                aria-label="Delete"-->
<!--                @click.stop="deleteBoard(board.id)"-->
<!--        >-->
<!--          <Trash class="w-5 h-5 text-red-500" />-->
<!--        </button>-->
<!--      </div>-->
<!--    </div>-->
<!--  </div>-->

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
