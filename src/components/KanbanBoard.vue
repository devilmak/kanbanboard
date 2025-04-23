<template>
  <div class="board">
    <button @click="openModal(-1)">➕ Column</button>

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
          @updateColumn="updateColumn(index, $event)"
          @editColumn="openModal(index)"
      />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import Column from './Column.vue'

const columns = reactive([])
const showModal = ref(false)
const columnTitle = ref('')
const isEditingColumn = ref(false)
const editedColumnIndex = ref(-1)

function openModal(index) {
  if (index !== -1) {
    // edit column
    columnTitle.value = columns[index].title
    isEditingColumn.value = true
    editedColumnIndex.value = index
    showModal.value = true
  } else {
    // add new column
    columnTitle.value = ''
    isEditingColumn.value = false
    editedColumnIndex.value = -1
    showModal.value = true
  }
}

function confirmModal() {
  const title = columnTitle.value
  if (!title) return

  if (isEditingColumn.value) {
    columns[editedColumnIndex.value].title = title
  } else {
    columns.push({
      id: Date.now(),
      title,
      cards: []
    })
  }

  closeModal()
}

function closeModal() {
  showModal.value = false
  columnTitle.value = ''
  editedColumnIndex.value = -1
}

function deleteColumn(index) {
  columns.splice(index, 1)
}

function updateColumn(index, updatedColumn) {
  columns[index] = updatedColumn
}
</script>

<style scoped>
.board {
  padding: 1rem;
}

.columns {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
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