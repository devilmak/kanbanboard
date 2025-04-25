<!--The MAIN page, manages Boards-->
<script setup>
import { ref, onMounted } from 'vue'
import { db, collection, doc, addDoc, deleteDoc, getDocs, query, updateDoc, where } from '../../firebase.js'
import { useRouter } from "vue-router";
import {onSnapshot} from "firebase/firestore";

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
    await addDoc(collection(db, 'boards'), {
      title,
      createdDt: new Date(),
      updatedDt: null
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

// works like ngOnInit
onMounted(() => {
  const boardsRef = collection(db, 'boards')

  // works as an observable that keep tracks on changes
  onSnapshot(boardsRef, (snapshot) => {
    boards.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))
  })
})
</script>

<template>
  <div class="p-4">
    <div class="text-2xl font-bold mb-4">Simple Kanban Board</div>

    <div class="mb-4">
      <button @click="openBoardModal(null)" class="bg-blue-500 text-white px-4 py-2 rounded">Add Board</button>
    </div>

    <div class="column"
         v-for="(board, index) in boards"
         :key="board.id"
         :style="{ cursor: isHovering ? 'pointer' : 'default' }"
         @mouseover="isHovering = true"
         @mouseleave="isHovering = false"
         @click="routeToBoard(board)"
    >
      <span>{{ board.title }}</span>
      <div class="column-actions">
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

</style>