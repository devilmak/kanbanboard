<!--The MAIN page, manages Boards-->
<script setup>
import { ref, onMounted } from 'vue'
import { db, collection, doc, addDoc, deleteDoc, getDocs } from '../../firebase.js'
import { useRouter } from "vue-router";
import {updateDoc} from "firebase/firestore";

const router = useRouter()
const boards = ref([])
const showModal = ref(false)
const boardName = ref('')
const isEditingBoard = ref(false)
const editedBoardIndex = ref(null)

// function to get all boards for initial loading
async function fetchBoards() {
  const snapshot = await getDocs(collection(db, 'boards'))
  boards.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// function to delete board
async function deleteBoard(boardId) {
  const index = boards.value.findIndex(board => board.id !== boardId)
  boards.value.splice(index, 1)
  await deleteDoc(doc(db, 'boards', boardId))
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
    // update page view
    board.title = title
  } else {
    const docRef = await addDoc(collection(db, 'boards'), {
      title,
      createdDt: new Date(),
      updatedDt: null
    })
    boards.value.push({
      id: docRef.id,
      title: boardName.value
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

// Basically ngOnInit -> get initial data on this page
onMounted(fetchBoards)
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Kanban Board</h1>

    <div class="mb-4">
      <button @click="openBoardModal(null)" class="bg-blue-500 text-white px-4 py-2 rounded">Add Board</button>
    </div>

    <div class="column"
         v-for="(board, index) in boards"
         :key="board.id"
         @click="routeToBoard(board)"
    >
      <span>{{ board.title }}</span>
      <div class="column-actions">
<!--        <router-link :to="`/board/${board.id}`" class="text-blue-600 mr-2">Open</router-link>-->
        <button @click.stop="openBoardModal(index)">✏️</button>
        <button @click.stop="deleteBoard(board.id)" class="text-red-500">🗑️</button> <!-- .stop to prevent click from accidental routing -->
      </div>
    </div>
  </div>

  <!--  Board Modal-->
  <div v-if="showModal" class="modal">
    <div class="modal-content">
      <h3>{{ isEditingBoard ? 'Edit Task' : 'New Task' }}</h3>
      <input v-model="boardName" placeholder="Board title" />
      <div class="actions">
        <button @click="confirmBoardModal">{{ isEditingBoard ? 'Update' : 'Add' }}
        </button>
        <button @click="closeBoardModal">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

.columns {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
}

.column {
  border: 1px solid #ccc;
  padding: 1rem;
  width: 250px;
  background: #f9f9f9;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
}

.column-actions {
  display: flex;
  margin-left: auto;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  margin-bottom: 0.5rem;
}
</style>