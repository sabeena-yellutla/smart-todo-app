// Smart Todo App
// Features: Add, Edit, Delete, Filter, Sort, Search with debounce, LocalStorage persistence

// DOM elements
const todoInput = document.querySelector("#todo-input");
const addBtn = document.querySelector("#add-btn");
const inputError = document.querySelector("#input-error");

const todoList = document.querySelector("#todo-list");

const completedSpan = document.querySelector("#todo-completed");
const uncompletedSpan = document.querySelector("#todo-notcompleted");
const clearCompletedBtn = document.querySelector("#clear-completed");

const clearAllBtn = document.querySelector("#clear-all");

const filters = document.querySelector(".filters");

const sortSelectors = document.querySelector(".sort-selectors");

const searchToggle = document.querySelector("#search-toggle");
const searchInput = document.querySelector("#search-input");

// Data state (source of truth) -- UI depends on this state
let todos = [];
let currentFilter = "all";
let currentSort = "newest";
let searchQuery = "";



// Load saved todos from LocalStorage when page loads
function loadFromLocalStorage() {
    try {
        const savedTodos = localStorage.getItem("tasks");
        todos = savedTodos ? JSON.parse(savedTodos) : [];
    } catch (error) {
        todos = [];
    }
    renderTodos();
}
loadFromLocalStorage();

// Load active filter from LocalStorage when page loads
function loadActiveBtn() {
    currentFilter = localStorage.getItem("currentFilter") || "all";
    const activeBtn = filters.querySelector(`[data-filter="${currentFilter}"]`);
    activeBtn.classList.add("active");
    renderTodos();
}
loadActiveBtn();

addBtn.addEventListener("click", () => {
    addTodo();
})

function hideError() {
    inputError.classList.add("hidden");
}

todoInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addTodo();
    }
    if (event.key === "Escape") {
        hideError();
    }
})
todoInput.addEventListener("input", hideError);

// Create a new todo object and add it to state
function addTodo() {
    const todoText = todoInput.value.trim();

    if (todoText === "") {
        inputError.textContent = "Empty Todo can not be added";
        inputError.classList.remove("hidden");
        return;
    };
    hideError();

    let todo = {
        id: Date.now().toString(),
        text: todoText,
        isCompleted: false,
        isEditing: false,
        createdAt: Date.now()
    }

    todos.push(todo);

    saveToLocalStorage();
    renderTodos();
    todoInput.value = "";
    todoInput.focus();
}

// Data saving to LocaslStorage to persist
function saveToLocalStorage() {
    localStorage.setItem("tasks", JSON.stringify(todos));
}

// Render todos to the DOM based on current state, filter, search and sort
function renderTodos() {
    todoList.innerHTML = "";

    clearAllBtn.disabled = todos.length === 0;
    clearCompletedBtn.disabled = !todos.some(todo => todo.isCompleted);

    // Filter todos based on active filter (all, active, completed)
    let filterTodos;
    if (currentFilter === "all") {
        filterTodos = todos;
    } else if (currentFilter === "active") {
        filterTodos = todos.filter(todo => !todo.isCompleted);
    } else if (currentFilter === "completed") {
        filterTodos = todos.filter(todo => todo.isCompleted);
    }

    let searchTodos;
    searchTodos = filterTodos.filter(todo => {
        return todo.text.toLowerCase().includes(searchQuery);
    })

    if (todos.length === 0) {
        todoList.innerHTML = `
        <p class="empty-state">No tasks yet. Add your first task 🚀</p>`
    } else if (currentFilter === "active" && filterTodos.length === 0) {
        todoList.innerHTML = `
        <p class="empty-state">"No active tasks."</p>`
    } else if (currentFilter === "completed" && filterTodos.length === 0) {
        todoList.innerHTML = `
        <p class="empty-state">"No completed tasks"</p>`
        clearAllBtn.disabled = true;
    } else if (searchQuery !== "" && searchTodos.length === 0) {
        todoList.innerHTML = `<p class="empty-state">"No tasks match your search"</p>`
    }

    // Sort todos by created time (newest to oldest)
    let sortTodos = [...searchTodos];

    if (currentSort === "newest") {
        sortTodos.sort((a, b) => b.createdAt - a.createdAt);
    } else if (currentSort === "oldest") {
        sortTodos.sort((a, b) => a.createdAt - b.createdAt);
    }

    sortTodos.forEach(todo => {
        const li = document.createElement("li");
        li.dataset.id = todo.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.isCompleted;

        const editBtn = document.createElement("button");
        editBtn.innerHTML = `<i class="fa-solid fa-pencil"></i>`;
        editBtn.classList.add("editBtn");

        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = `<i class="fa-regular fa-trash-can"></i>`;
        deleteBtn.classList.add("deleteBtn");

        let contentElement;

        if (todo.isEditing) {
            const editInput = document.createElement("input");
            editInput.type = "text";
            editInput.value = todo.text
            editInput.classList.add("editInput");
            contentElement = editInput;
        }
        else {
            const spanText = document.createElement("span");
            spanText.textContent = todo.text;
            contentElement = spanText;
        }

        if (todo.isCompleted) {
            li.classList.add("completed");
            editBtn.disabled = true;
        }

        li.append(checkbox, contentElement, editBtn, deleteBtn);
        todoList.appendChild(li);
        const editInput = document.querySelector(".editInput");
        if (editInput) {
            editInput.focus();
        }
    });

    const completedCount = todos.filter(todo => todo.isCompleted).length;
    const uncompletedCount = todos.filter(todo => !todo.isCompleted).length;
    completedSpan.textContent = `Completed: ${completedCount}`;
    uncompletedSpan.textContent = `Uncompleted: ${uncompletedCount}`;
}

// Handle checkbox toggle, delete, and edit actions using even delegation
todoList.addEventListener("click", handleTodoActions)

function handleTodoActions(event) {
    const li = event.target.closest("li");
    if (!li) return;

    const id = li.dataset.id;

    if (event.target.type === "checkbox") {
        toggleComplete(id);
    }

    if (event.target.closest(".deleteBtn")) {
        deleteTodo(id);
        return;
    }

    if (event.target.closest(".editBtn")) {
        editTodo(id);
        return
    }
}

// Toggle completed state of a todo
function toggleComplete(id) {
    todos = todos.map(todo => todo.id === id ? { ...todo, isCompleted: !todo.isCompleted, isEditing: false } : todo);

    saveToLocalStorage();
    renderTodos();
}

// Remove a todo from state
function deleteTodo(id) {
    if (!confirm("Are you sure to delete the task?")) return;

    todos = todos.filter(todo => todo.id !== id);
    saveToLocalStorage();
    renderTodos();
}
// Enable edit mode for selected todo
function editTodo(id) {
    const todoToEdit = todos.find(todo => todo.id === id);
    if (todoToEdit.isCompleted) return;

    todos = todos.map(todo => todo.id === id ? { ...todo, isEditing: true } : { ...todo, isEditing: false });

    renderTodos();
}

todoList.addEventListener("keydown", (event) => {
    if (!event.target.classList.contains("editInput")) return;

    const li = event.target.closest("li");
    const id = li.dataset.id;

    if (event.key === "Enter") {
        const newText = event.target.value.trim();
        if (!newText) {
            renderTodos();
            return;
        }

        todos = todos.map(todo => todo.id === id ? { ...todo, text: newText, isEditing: false } : todo);

        saveToLocalStorage();
        renderTodos();
    }

    if (event.key === "Escape") {
        todos = todos.map(todo => todo.id === id ? { ...todo, isEditing: false } : todo);
        renderTodos();
    }
})

clearCompletedBtn.addEventListener("click", () => {
    if (!confirm("Delete all tasks?")) return;
    todos = todos.filter(todo => !todo.isCompleted);
    saveToLocalStorage();
    renderTodos();
})

clearAllBtn.addEventListener("click", () => {
    if (!confirm("Delete all tasks?")) return;
    todos = [];
    saveToLocalStorage();
    renderTodos();
})

// Filter todos based on active filter (all, active, completed)
filters.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-btn");
    if (!button) return;

    const filterType = button.dataset.filter;
    currentFilter = filterType;

    localStorage.setItem("currentFilter", currentFilter);

    const filterBtns = filters.querySelectorAll(".filter-btn");
    filterBtns.forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

    renderTodos();
})

// Sort todos by created time (newest or oldest)
sortSelectors.addEventListener("change", (event) => {
    currentSort = event.target.value;
    renderTodos();
})

// Toggle search icon
searchToggle.addEventListener("click", () => {
    const isOpen = searchInput.classList.toggle("active");
    if (isOpen) {
        searchInput.focus();
    }
    else {
        searchInput.value = "";
        searchQuery = "";
        searchInput.blur();
        renderTodos();
    }
})

// Press / to search tasks
document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement.tagName !== "INPUT") {
        event.preventDefault();
        searchInput.classList.add("active");
        searchInput.focus();
    }
})
searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        event.preventDefault();
        searchInput.classList.remove("active");
        searchInput.value = "";
        searchQuery = "";
        searchInput.blur();
        renderTodos();
    }
})

// Debounce search to avoid rendering on every keystroke
let timer;
searchInput.addEventListener("input", (event) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
        const value = event.target.value.toLowerCase().trim();
        searchQuery = value;
        renderTodos();
    }, 300);
});








