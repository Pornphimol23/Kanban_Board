import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL

function App() {
  const [screen, setScreen] = useState('auth')
  const [isRegister, setIsRegister] = useState(false) 

  // Auth
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Dashboard
const [boards, setBoards] = useState([])
const [boardName, setBoardName] = useState('')
const [loadingBoards, setLoadingBoards] = useState(false)
const [creatingBoard, setCreatingBoard] = useState(false)

const [editingBoardId, setEditingBoardId] = useState(null)
const [editingBoardName, setEditingBoardName] = useState('')
const [savingBoard, setSavingBoard] = useState(false)
const [deletingBoardId, setDeletingBoardId] = useState(null)
const [selectedBoard, setSelectedBoard] = useState(null)
const [loadingBoard, setLoadingBoard] = useState(false)
const [newColumnName, setNewColumnName] = useState('')
const [inviteEmail, setInviteEmail] = useState('')
const [invitingMember, setInvitingMember] = useState(false)
const [showInviteForm, setShowInviteForm] = useState(false)
const [creatingColumn, setCreatingColumn] = useState(false)
const [editingColumnId, setEditingColumnId] = useState(null)
const [assigningTaskId, setAssigningTaskId] = useState(null)
const [editingColumnName, setEditingColumnName] = useState('')
const [savingColumn, setSavingColumn] = useState(false)
const [columnMenuId, setColumnMenuId] = useState(null)
const [deletingColumnId, setDeletingColumnId] = useState(null)
const [newTaskColumnId, setNewTaskColumnId] = useState(null)
const [newTaskTitle, setNewTaskTitle] = useState('')
const [newTaskDescription, setNewTaskDescription] = useState('')
const [creatingTask, setCreatingTask] = useState(false)
const [editingTaskId, setEditingTaskId] = useState(null)
const [editingTaskTitle, setEditingTaskTitle] = useState('')
const [editingTaskDescription, setEditingTaskDescription] = useState('')
const [savingTask, setSavingTask] = useState(false)
const [taskMenuId, setTaskMenuId] = useState(null)
const [deletingTaskId, setDeletingTaskId] = useState(null)
const [movingTaskId, setMovingTaskId] = useState(null)
const [draggedTaskId, setDraggedTaskId] = useState(null)

  // Message
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

// Logout
const handleLogout = () => {
  localStorage.removeItem('access_token')
  setScreen('auth')
  setSelectedBoard(null)
  setBoards([])
  setError('')
  setMessage('')
}

  // Login / Register
  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setMessage('')

    if (isRegister && !name.trim()) {
      setError('กรุณากรอกชื่อ')
      return
    }

    setLoading(true)

    try {
      const endpoint = isRegister
        ? `${API_URL}/auth/register`
        : `${API_URL}/auth/login`

      const body = isRegister
        ? {
            name: name.trim(),
            email: email.trim(),
            password,
          }
        : {
            email: email.trim(),
            password,
          }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(', ')
          : data.detail

        throw new Error(detail || 'เกิดข้อผิดพลาด')
      }

      // Register
      if (isRegister) {
        setMessage('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ')

        setName('')
        setPassword('')
        setIsRegister(false)
        return
      }

      // Login
      localStorage.setItem('access_token', data.access_token)

      setMessage('')
      setScreen('dashboard')

      await loadBoards(data.access_token)

    } catch (err) {
      setError(err.message || 'ไม่สามารถเชื่อมต่อ Server ได้')
    } finally {
      setLoading(false)
    }
  }

  // Get Boards
  const loadBoards = async (token = localStorage.getItem('access_token')) => {
    if (!token) {
      setScreen('auth')
      return
    }

    setLoadingBoards(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/boards`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'ไม่สามารถโหลด Board ได้')
      }

      setBoards(data.boards || [])

    } catch (err) {
      setError(err.message || 'ไม่สามารถโหลด Board ได้')
    } finally {
      setLoadingBoards(false)
    }
  }

  // Create Board
  const handleCreateBoard = async (e) => {
    e.preventDefault()

    if (!boardName.trim()) {
      setError('กรุณากรอกชื่อ Board')
      return
    }

    const token = localStorage.getItem('access_token')

    if (!token) {
      setScreen('auth')
      return
    }

    setCreatingBoard(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: boardName.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'ไม่สามารถสร้าง Board ได้')
      }

      setBoardName('')
      setMessage('สร้าง Board สำเร็จ')

      // โหลดรายการ Board ใหม่
      await loadBoards(token)

    } catch (err) {
      setError(err.message || 'ไม่สามารถสร้าง Board ได้')
    } finally {
      setCreatingBoard(false)
    }
  }

// Rename Board
const handleRenameBoard = async (boardId) => {
  if (!editingBoardName.trim()) {
    setError('กรุณากรอกชื่อ Board')
    return
  }

  const token = localStorage.getItem('access_token')

  if (!token) {
    setScreen('auth')
    return
  }

  setSavingBoard(true)
  setError('')
  setMessage('')

  try {
    const response = await fetch(`${API_URL}/boards/${boardId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: editingBoardName.trim(),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'ไม่สามารถเปลี่ยนชื่อ Board ได้')
    }

    setEditingBoardId(null)
    setEditingBoardName('')
    setMessage('เปลี่ยนชื่อ Board สำเร็จ')

    await loadBoards(token)

  } catch (err) {
    setError(err.message || 'ไม่สามารถเปลี่ยนชื่อ Board ได้')
  } finally {
    setSavingBoard(false)
  }
}

// Delete Board
const handleDeleteBoard = async (boardId) => {
  const confirmed = window.confirm(
    'ต้องการลบ Board นี้ใช่หรือไม่?'
  )

  if (!confirmed) {
    return
  }

  const token = localStorage.getItem('access_token')

  if (!token) {
    setScreen('auth')
    return
  }

  setDeletingBoardId(boardId)
  setError('')
  setMessage('')

  try {
    const response = await fetch(`${API_URL}/boards/${boardId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'ไม่สามารถลบ Board ได้')
    }

    setMessage('ลบ Board สำเร็จ')

    await loadBoards(token)

  } catch (err) {
    setError(err.message || 'ไม่สามารถลบ Board ได้')
  } finally {
    setDeletingBoardId(null)
  }
}

// Open Board
const handleOpenBoard = async (boardId) => {
  const token = localStorage.getItem('access_token')

  if (!token) {
    setScreen('auth')
    return
  }

  setLoadingBoard(true)
  setError('')
  setMessage('')

  try {
    const response = await fetch(`${API_URL}/boards/${boardId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || 'ไม่สามารถโหลด Board ได้')
    }

    setSelectedBoard(data)
    setScreen('board')

  } catch (err) {
    setError(err.message || 'ไม่สามารถโหลด Board ได้')
  } finally {
    setLoadingBoard(false)
  }
}

// Create Column
const handleCreateColumn = async () => {
  if (!newColumnName.trim()) {
    setError('กรุณากรอกชื่อ Column')
    return
  }

  const token = localStorage.getItem('access_token')

  if (!token || !selectedBoard?.board?.id) {
    setScreen('auth')
    return
  }

  setCreatingColumn(true)
  setError('')
  setMessage('')

  try {
    const response = await fetch(
      `${API_URL}/boards/${selectedBoard.board.id}/columns`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newColumnName.trim(),
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail || 'ไม่สามารถสร้าง Column ได้'
      )
    }

    setNewColumnName('')
    setMessage('สร้าง Column สำเร็จ')

    await handleOpenBoard(selectedBoard.board.id)

  } catch (err) {
    setError(err.message || 'ไม่สามารถสร้าง Column ได้')
  } finally {
    setCreatingColumn(false)
  }
}

const handleRenameColumn = async (columnId) => {
  if (!editingColumnName.trim()) {
    setError('กรุณากรอกชื่อ Column')
    return
  }

  const token = localStorage.getItem('access_token')

  if (!token) {
    setScreen('auth')
    return
  }

  setSavingColumn(true)
  setError('')
  setMessage('')

  try {
    const response = await fetch(
      `${API_URL}/columns/${columnId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingColumnName.trim(),
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail || 'ไม่สามารถเปลี่ยนชื่อ Column ได้'
      )
    }

    setEditingColumnId(null)
    setEditingColumnName('')
    setMessage('เปลี่ยนชื่อ Column สำเร็จ')

    await handleOpenBoard(selectedBoard.board.id)

  } catch (err) {
    setError(err.message || 'ไม่สามารถเปลี่ยนชื่อ Column ได้')
  } finally {
    setSavingColumn(false)
  }
}

// Invite Member
const handleInviteMember = async (e) => {
  e.preventDefault()

  if (!inviteEmail.trim()) {
    setError('กรุณากรอก Email')
    return
  }

  const token = localStorage.getItem('access_token')

  if (!token) {
    setScreen('auth')
    return
  }

  setInvitingMember(true)
  setError('')
  setMessage('')

  try {
    const response = await fetch(
      `${API_URL}/boards/${selectedBoard.board.id}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail || 'ไม่สามารถเชิญสมาชิกได้'
      )
    }

    setMessage('เชิญสมาชิกสำเร็จ')
    setInviteEmail('')
    setShowInviteForm(false)

    await handleOpenBoard(selectedBoard.board.id)

  } catch (err) {
    setError(
      err.message || 'ไม่สามารถเชิญสมาชิกได้'
    )
  } finally {
    setInvitingMember(false)
  }
}

// Assign Member
const handleAssignMember = async (taskId, userId) => {
  const token = localStorage.getItem('access_token')

  if (!token) {
    setScreen('auth')
    return
  }

  try {
    setError('')
    setMessage('')

    const response = await fetch(
      `${API_URL}/tasks/${taskId}/assignees`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail || 'ไม่สามารถ Assign Member ได้'
      )
    }

    setMessage('Assign Member สำเร็จ')
    setAssigningTaskId(null)

    await handleOpenBoard(selectedBoard.board.id)

  } catch (err) {
    setError(
      err.message || 'ไม่สามารถ Assign Member ได้'
    )
  }
}

const handleDeleteColumn = async (columnId) => {
  const column = selectedBoard?.columns?.find(
    (item) => item.id === columnId
  )

  if (!column) {
    return
  }

  if (column.tasks?.length > 0) {
    setError('ไม่สามารถลบ Column ที่มี Task ได้')
    setColumnMenuId(null)
    return
  }

  const confirmed = window.confirm(
    `ต้องการลบ Column "${column.name}" ใช่หรือไม่?`
  )

  if (!confirmed) {
    return
  }

  const token = localStorage.getItem('access_token')

  if (!token) {
    setScreen('auth')
    return
  }

  setDeletingColumnId(columnId)
  setError('')
  setMessage('')
  setColumnMenuId(null)

  try {
    const response = await fetch(
      `${API_URL}/columns/${columnId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail || 'ไม่สามารถลบ Column ได้'
      )
    }

    setMessage('ลบ Column สำเร็จ')

    await handleOpenBoard(selectedBoard.board.id)

  } catch (err) {
    setError(err.message || 'ไม่สามารถลบ Column ได้')
  } finally {
    setDeletingColumnId(null)
  }
}

// Create Task
const handleCreateTask = async (columnId) => {
  if (!newTaskTitle.trim()) {
    setError('กรุณากรอกชื่อ Task')
    return
  }

  const token = localStorage.getItem('access_token')

  if (!token) {
    setScreen('auth')
    return
  }

  setCreatingTask(true)
  setError('')
  setMessage('')

  try {
    const response = await fetch(
      `${API_URL}/columns/${columnId}/tasks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail || 'ไม่สามารถสร้าง Task ได้'
      )
    }

    setNewTaskTitle('')
    setNewTaskDescription('')
    setNewTaskColumnId(null)

    setMessage('สร้าง Task สำเร็จ')

    await handleOpenBoard(selectedBoard.board.id)

  } catch (err) {
    setError(
      err.message || 'ไม่สามารถสร้าง Task ได้'
    )
  } finally {
    setCreatingTask(false)
  }
}

// Edit Task
const handleEditTask = async (taskId) => {
  if (!editingTaskTitle.trim()) {
    setError('กรุณากรอกชื่อ Task')
    return
  }

  const token = localStorage.getItem('access_token')

  if (!token) {
    setScreen('auth')
    return
  }

  setSavingTask(true)
  setError('')
  setMessage('')
  setTaskMenuId(null)

  try {
    const response = await fetch(
      `${API_URL}/tasks/${taskId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingTaskTitle.trim(),
          description: editingTaskDescription.trim(),
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail || 'ไม่สามารถแก้ไข Task ได้'
      )
    }

    setEditingTaskId(null)
    setEditingTaskTitle('')
    setEditingTaskDescription('')

    setMessage('แก้ไข Task สำเร็จ')

    await handleOpenBoard(selectedBoard.board.id)

  } catch (err) {
    setError(
      err.message || 'ไม่สามารถแก้ไข Task ได้'
    )
  } finally {
    setSavingTask(false)
  }
}

// Delete Task
const handleDeleteTask = async (taskId) => {
  const confirmed = window.confirm(
    'ต้องการลบ Task นี้ใช่หรือไม่?'
  )

  if (!confirmed) {
    return
  }

  const token = localStorage.getItem('access_token')

  if (!token) {
    setScreen('auth')
    return
  }

  setDeletingTaskId(taskId)
  setError('')
  setMessage('')
  setTaskMenuId(null)

  try {
    const response = await fetch(
      `${API_URL}/tasks/${taskId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail || 'ไม่สามารถลบ Task ได้'
      )
    }

    setMessage('ลบ Task สำเร็จ')

    await handleOpenBoard(selectedBoard.board.id)

  } catch (err) {
    setError(
      err.message || 'ไม่สามารถลบ Task ได้'
    )
  } finally {
    setDeletingTaskId(null)
  }
}

// Move Task

const handleMoveTask = async (taskId, columnId) => {
  const token = localStorage.getItem('access_token')

  if (!token) {
    setScreen('auth')
    return
  }

  setMovingTaskId(taskId)
  setError('')
  setMessage('')
  setTaskMenuId(null)

  try {
    const response = await fetch(
      `${API_URL}/tasks/${taskId}/move`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
  target_column_id: columnId,
  position: 1,
}),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.detail || 'ไม่สามารถย้าย Task ได้'
      )
    }

    setMovingTaskId(null)

    setMessage('ย้าย Task สำเร็จ')

    await handleOpenBoard(selectedBoard.board.id)

  } catch (err) {
    setError(
      err.message || 'ไม่สามารถย้าย Task ได้'
    )
  } finally {
    setMovingTaskId(null)
  }
}

  // Check existing token
  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (token) {
      setScreen('dashboard')
      loadBoards(token)
    }
  }, [])

  // Switch Login / Register
  const switchMode = () => {
    setIsRegister(!isRegister)

    setName('')
    setEmail('')
    setPassword('')

    setError('')
    setMessage('')
  }

// Kanban Board
if (screen === 'board') {
  return (
    <div className="kanban-page">

      {/* Header */}
      <header className="dashboard-header">
  <div className="dashboard-brand">
    <div className="dashboard-logo">K</div>
    <span>Kanban Board</span>
  </div>

  <button
    type="button"
    className="logout-button"
    onClick={handleLogout}
  >
    Logout
  </button>
</header>

      <main className="kanban-main">

        {/* Board Header */}
        <div className="kanban-title">

          <button
            type="button"
            className="back-button"
            onClick={() => {
              setSelectedBoard(null)
              setScreen('dashboard')
              setError('')
              setMessage('')
            }}
          >
            ← My Boards
          </button>

          <h1>
  {selectedBoard?.board?.name}
</h1>

<button
  type="button"
  className="invite-button"
  onClick={() => setShowInviteForm(true)}
>
  + Invite Member
</button>

{showInviteForm && (
  <form
    className="invite-form"
    onSubmit={handleInviteMember}
  >
    <input
      type="email"
      placeholder="Member email"
      value={inviteEmail}
      onChange={(e) => setInviteEmail(e.target.value)}
      required
    />

    <button
      type="submit"
      disabled={invitingMember}
    >
      {invitingMember ? 'Inviting...' : 'Invite'}
    </button>

    <button
      type="button"
      onClick={() => {
        setShowInviteForm(false)
        setInviteEmail('')
      }}
    >
      Cancel
    </button>
  </form>
)}

        </div>

        {/* Loading */}
        {loadingBoard ? (
          <div className="empty-state">
            Loading board...
          </div>
        ) : (

          <div className="kanban-board">

  {selectedBoard?.columns?.length === 0 ? (

    <div className="empty-kanban">
      <div className="empty-icon">K</div>

      <h3>No columns yet</h3>

      <p>
        Create a column to start organizing your tasks.
      </p>
    </div>

  ) : (

    selectedBoard?.columns?.map((column) => (

      <div
  className="kanban-column"
  key={column.id}
  onDragOver={(e) => {
    e.preventDefault()
  }}
  onDrop={() => {
    if (draggedTaskId !== null) {
      handleMoveTask(
        draggedTaskId,
        column.id
      )
    }

    setDraggedTaskId(null)
  }}
>

       <div className="kanban-column-header">

  {editingColumnId === column.id ? (

    <div className="column-edit-area">

      <input
        type="text"
        value={editingColumnName}
        onChange={(e) => setEditingColumnName(e.target.value)}
        maxLength={100}
        autoFocus
      />

      <div className="column-edit-actions">

        <button
          type="button"
          className="save-column-button"
          onClick={() => handleRenameColumn(column.id)}
          disabled={savingColumn}
        >
          {savingColumn ? 'Saving...' : 'Save'}
        </button>

        <button
          type="button"
          className="cancel-column-button"
          onClick={() => {
            setEditingColumnId(null)
            setEditingColumnName('')
          }}
        >
          Cancel
        </button>

      </div>

    </div>

  ) : (

    <>
      <div className="column-title">

        <h2>{column.name}</h2>

        <span>
          {column.tasks?.length || 0}
        </span>

      </div>

      <button
  type="button"
  className="column-menu-button"
  onClick={() => {
    setColumnMenuId(
      columnMenuId === column.id ? null : column.id
    )
  }}
>
  ⋮
</button>

{columnMenuId === column.id && (
  <div className="column-menu">

    <button
      type="button"
      onClick={() => {
        setEditingColumnId(column.id)
        setEditingColumnName(column.name)
        setColumnMenuId(null)
        setError('')
        setMessage('')
      }}
    >
      Rename
    </button>

    <button
      type="button"
      className="delete-menu-item"
      onClick={() => handleDeleteColumn(column.id)}
      disabled={deletingColumnId === column.id}
    >
      {deletingColumnId === column.id
        ? 'Deleting...'
        : 'Delete'}
    </button>

  </div>
)}
    </>

  )}

</div>
        <div className="kanban-tasks">

{column.tasks?.map((task) => (

  <div
    className="kanban-task"
    key={task.id}
    draggable
onDragStart={() => {
  setDraggedTaskId(task.id)
}}
onDragEnd={() => {
  setDraggedTaskId(null)
}}
  >

    <div className="task-header">

      <h3>{task.title}</h3>

      <button
        type="button"
        className="task-menu-button"
        onClick={() => {
          setTaskMenuId(
            taskMenuId === task.id ? null : task.id
          )
        }}
      >
        ⋮
      </button>

      {taskMenuId === task.id && (
        <div className="task-menu">

          <button
            type="button"
            onClick={() => {
              setEditingTaskId(task.id)
              setEditingTaskTitle(task.title)
              setEditingTaskDescription(
                task.description || ''
              )
              setTaskMenuId(null)
              setError('')
              setMessage('')
            }}
          >
            Edit
          </button>


                    <div className="move-task-section">

            <div className="move-task-label">
              Move to
            </div>

            {selectedBoard?.columns
              ?.filter(
                (targetColumn) =>
                  targetColumn.id !== column.id
              )
              .map((targetColumn) => (
                <button
                  key={targetColumn.id}
                  type="button"
                  onClick={() =>
                    handleMoveTask(
                      task.id,
                      targetColumn.id
                    )
                  }
                  disabled={movingTaskId === task.id}
                >
                  {targetColumn.name}
                </button>
              ))}

          </div>
                    <button
            type="button"
            onClick={() => {
              setAssigningTaskId(task.id)
              setTaskMenuId(null)
              setError('')
              setMessage('')
            }}
          >
            Assign Member
          </button>

         <button
  type="button"
  className="delete-menu-item"
  onClick={() => handleDeleteTask(task.id)}
  disabled={deletingTaskId === task.id}
>
  {deletingTaskId === task.id
    ? 'Deleting...'
    : 'Delete'}
</button>

        </div>
      )}

    </div>

    {editingTaskId === task.id ? (

      <div className="task-edit-form">

        <input
          type="text"
          value={editingTaskTitle}
          onChange={(e) =>
            setEditingTaskTitle(e.target.value)
          }
          maxLength={200}
          autoFocus
        />

        <textarea
          value={editingTaskDescription}
          onChange={(e) =>
            setEditingTaskDescription(e.target.value)
          }
          maxLength={1000}
          rows={3}
        />

        <div className="task-edit-actions">

          <button
            type="button"
            className="save-task-button"
            onClick={() =>
              handleEditTask(task.id)
            }
            disabled={savingTask}
          >
            {savingTask ? 'Saving...' : 'Save'}
          </button>

          <button
            type="button"
            className="cancel-task-button"
            onClick={() => {
              setEditingTaskId(null)
              setEditingTaskTitle('')
              setEditingTaskDescription('')
            }}
          >
            Cancel
          </button>

        </div>

      </div>

    ) : (

      <>
        {task.description && (
          <p>{task.description}</p>
        )}
      </>

    )}

  </div>

))}
          {newTaskColumnId === column.id ? (

  <div className="task-create-form">

    <input
      type="text"
      placeholder="Task title"
      value={newTaskTitle}
      onChange={(e) => setNewTaskTitle(e.target.value)}
      maxLength={200}
      autoFocus
    />

    <textarea
      placeholder="Description"
      value={newTaskDescription}
      onChange={(e) => setNewTaskDescription(e.target.value)}
      maxLength={1000}
      rows={3}
    />

    <div className="task-create-actions">

      <button
        type="button"
        className="save-task-button"
        onClick={() => handleCreateTask(column.id)}
        disabled={creatingTask}
      >
        {creatingTask ? 'Creating...' : 'Add Task'}
      </button>

      <button
        type="button"
        className="cancel-task-button"
        onClick={() => {
          setNewTaskColumnId(null)
          setNewTaskTitle('')
          setNewTaskDescription('')
          setError('')
        }}
      >
        Cancel
      </button>

    </div>

  </div>

) : (

  <button
    type="button"
    className="add-task-button"
    onClick={() => {
      setNewTaskColumnId(column.id)
      setNewTaskTitle('')
      setNewTaskDescription('')
      setError('')
      setMessage('')
    }}
  >
    + Add Task
  </button>

)}

        </div>

      </div>

    ))

  )}

  {/* Add Column */}

  <div className="add-column-area">

    <input
      type="text"
      placeholder="Column name"
      value={newColumnName}
      onChange={(e) => setNewColumnName(e.target.value)}
      maxLength={100}
    />

    <button
      type="button"
      className="add-column-button"
      onClick={handleCreateColumn}
      disabled={creatingColumn}
    >
      {creatingColumn ? 'Creating...' : '+ Add Column'}
    </button>

  </div>

</div>

        )}

      </main>

    </div>
  )
}

  // Dashboard
  if (screen === 'dashboard') {
    return (
      <div className="dashboard-page">

        {/* Header */}
        <header className="dashboard-header">
  <div className="dashboard-brand">
    <div className="dashboard-logo">K</div>
    <span>Kanban Board</span>
  </div>

  <button
    type="button"
    className="logout-button"
    onClick={handleLogout}
  >
    Logout
  </button>
</header>

        {/* Main */}
        <main className="dashboard-main">

          <div className="dashboard-title">
            <div>
              <h1>My Boards</h1>
              <p>Manage your collaborative boards</p>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          {message && (
            <div className="alert success">
              {message}
            </div>
          )}

          {/* Create Board */}
          <section className="create-board-section">

            <div className="section-heading">
              <h2>Create a Board</h2>
              <p>Create a new board for managing your tasks.</p>
            </div>

            <form
              className="create-board-form"
              onSubmit={handleCreateBoard}
            >
              <input
                type="text"
                placeholder="Enter board name"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                maxLength={100}
              />

              <button
                type="submit"
                className="primary-button create-button"
                disabled={creatingBoard}
              >
                {creatingBoard ? 'Creating...' : 'Create Board'}
              </button>
            </form>

          </section>

          {/* Board List */}
          <section className="boards-section">

            <div className="section-heading">
              <h2>Boards</h2>
            </div>

            {loadingBoards ? (
              <div className="empty-state">
                Loading boards...
              </div>
            ) : boards.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">K</div>
                <h3>No boards yet</h3>
                <p>Create your first board to get started.</p>
              </div>
            ) : (
              <div className="board-grid">

                {boards.map((board) => (
  <div
  className="board-card"
  key={board.id}
  onClick={() => {
    if (editingBoardId !== board.id) {
      handleOpenBoard(board.id)
    }
  }}
>

    <div className="board-card-top">

      <div className="board-card-icon">
        K
      </div>

      <div className="board-card-menu">
        <button
          type="button"
          className="board-menu-button"
          onClick={(e) => {
            e.stopPropagation()

            if (editingBoardId === board.id) {
              setEditingBoardId(null)
              setEditingBoardName('')
            } else {
              setEditingBoardId(board.id)
              setEditingBoardName(board.name)
              setError('')
              setMessage('')
            }
          }}
        >
          ⋮
        </button>
      </div>

    </div>

    {editingBoardId === board.id ? (

      <div className="board-edit-area">

        <input
          type="text"
          value={editingBoardName}
          onChange={(e) => setEditingBoardName(e.target.value)}
          maxLength={100}
          autoFocus
        />

        <div className="board-edit-actions">

          <button
            type="button"
            className="save-board-button"
            onClick={() => handleRenameBoard(board.id)}
            disabled={savingBoard}
          >
            {savingBoard ? 'Saving...' : 'Save'}
          </button>

          <button
            type="button"
            className="cancel-board-button"
            onClick={() => {
              setEditingBoardId(null)
              setEditingBoardName('')
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            className="delete-board-button"
            onClick={() => handleDeleteBoard(board.id)}
            disabled={deletingBoardId === board.id}
          >
            {deletingBoardId === board.id
              ? 'Deleting...'
              : 'Delete'}
          </button>

        </div>

      </div>

    ) : (

      <div className="board-card-content">

        <h3>{board.name}</h3>

        <span>
          Board #{board.id}
        </span>

      </div>

    )}

  </div>
))}
              </div>
            )}

          </section>

        </main>

      </div>
    )
  }

  // Login / Register
  return (
    <div className="auth-page">

      {/* Left Side */}
      <div className="auth-brand">
        <div className="brand-content">

          <div className="brand-mark">K</div>

          <h1>Kanban Board</h1>

          <p>
            Simple collaboration workspace
            <br />
            for managing your team's tasks.
          </p>

        </div>
      </div>

      {/* Right Side */}
      <div className="auth-panel">

        <div className="auth-card">

          <div className="mobile-brand">
            <div className="brand-mark small">K</div>
            <span>Kanban Board</span>
          </div>

          <div className="auth-header">
            <h2>
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>

            <p>
              {isRegister
                ? 'Create your account to get started'
                : 'Sign in to continue to your board'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {isRegister && (
              <div className="form-group">
                <label htmlFor="name">Name</label>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={128}
                required
              />
            </div>

            {error && (
              <div className="alert error">
                {error}
              </div>
            )}

            {message && (
              <div className="alert success">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : isRegister
                  ? 'Create Account'
                  : 'Sign In'}
            </button>

          </form>

          <div className="switch-auth">
            <span>
              {isRegister
                ? 'Already have an account?'
                : "Don't have an account?"}
            </span>

            <button
              type="button"
              onClick={switchMode}
            >
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </div>

        </div>

      </div>

    </div>
  )
}

export default App