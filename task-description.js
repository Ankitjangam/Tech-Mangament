const params = new URLSearchParams(window.location.search);
const taskId = Number(params.get("id"));
const subIndex = Number(params.get("sub"));

let subtasks = JSON.parse(localStorage.getItem("ws_" + taskId) || "[]");
let subtask = subtasks[subIndex];

const techs = JSON.parse(localStorage.getItem("techTasks") || "[]");
const techTask = techs.find(t => t.id === taskId);

const techNameEl = document.getElementById("techName");
const taskNameEl = document.getElementById("taskName");
const expWrapper = document.getElementById("expWrapper");
const taskDescEl = document.getElementById("taskDesc");
const taskLinkEl = document.getElementById("taskLink");
const prioritySelect = document.getElementById("prioritySelect");
const dueDateEl = document.getElementById("dueDate");
const progressBar = document.getElementById("progressBar");
const subtasksList = document.getElementById("subtasksList");
const newSubtaskInput = document.getElementById("newSubtask");
const addSubtaskBtn = document.getElementById("addSubtaskBtn");
const commentsEl = document.getElementById("taskComments");
const logList = document.getElementById("logList");

if (!subtask) {
  document.body.innerHTML = "<h2 style='color:red;text-align:center'>Task Not Found</h2>";
} else {
  techNameEl.textContent = techTask ? techTask.tech : "Unknown Tech";
  taskNameEl.value = subtask.name;
  taskDescEl.value = subtask.description || "";
  taskLinkEl.value = subtask.link || "";
  prioritySelect.value = subtask.priority || "Medium";
  dueDateEl.value = subtask.dueDate || "";
  commentsEl.value = subtask.comments || "";
  if (subtask.expected) expWrapper.innerHTML = `<span class="time-display">${subtask.expected}</span>`;
  renderSubtasks();
  updateProgress();
  lockFields();
}

// ---------- FUNCTIONS ----------
function lockFields() {
  // Show div with full text, hide textarea
  taskDescEl.style.display = "none";
  document.getElementById("taskDescDisplay").style.display = "block";
  document.getElementById("taskDescDisplay").textContent = subtask.description || "";

  [taskNameEl, taskLinkEl, prioritySelect, dueDateEl, commentsEl].forEach(el => {
    el.disabled = true;
    el.classList.add("readonly");
  });

  document.getElementById("saveBtn").style.display = "none";
  document.getElementById("editBtn").style.display = "inline-block";
}

function enableEdit() {
  // Switch back to textarea
  taskDescEl.style.display = "block";
  document.getElementById("taskDescDisplay").style.display = "none";

  [taskNameEl, taskDescEl, taskLinkEl, prioritySelect, dueDateEl, commentsEl].forEach(el => {
    el.disabled = false;
    el.classList.remove("readonly");
  });

  expWrapper.innerHTML = `
    <input type="number" id="expDays" placeholder="d" min="0">
    <input type="number" id="expHours" placeholder="h" min="0" max="23">
    <input type="number" id="expMins" placeholder="m" min="0" max="59">
  `;

 document.getElementById("expDays").value = subtask.expected?.match(/(\d+)d/)?.[1] ?? "";
document.getElementById("expHours").value = subtask.expected?.match(/(\d+)h/)?.[1] ?? "";
document.getElementById("expMins").value = subtask.expected?.match(/(\d+)m/)?.[1] ?? "";


  document.getElementById("saveBtn").style.display = "inline-block";
  document.getElementById("editBtn").style.display = "none";
}

function saveTask() {
  subtask.name = taskNameEl.value.trim();
  subtask.description = taskDescEl.value.trim();
  subtask.link = taskLinkEl.value.trim();
  subtask.priority = prioritySelect.value;
  subtask.dueDate = dueDateEl.value;
  subtask.comments = commentsEl.value;
  let d = parseInt(document.getElementById("expDays")?.value) || 0;
  let h = parseInt(document.getElementById("expHours")?.value) || 0;
  let m = parseInt(document.getElementById("expMins")?.value) || 0;
  subtask.expected = `${d}d ${h}h ${m}m`;
  subtasks[subIndex] = subtask;
  localStorage.setItem("ws_" + taskId, JSON.stringify(subtasks));
  expWrapper.innerHTML = `<span class="time-display">${subtask.expected}</span>`;
  logActivity("Task saved");
  lockFields();
  updateProgress();
}

// ---------- Subtasks ----------
function renderSubtasks() {
  subtasksList.innerHTML = "";
  if (!subtask.subtasks) subtask.subtasks = [];

  subtask.subtasks.forEach((s, i) => {
    const li = document.createElement("li");
    li.textContent = s.name;
    li.style.cursor = "pointer";

    // Toggle done on single click
    li.addEventListener("click", () => {
      s.done = !s.done;
      li.style.textDecoration = s.done ? "line-through" : "none";
      updateProgress();
      logActivity(`Subtask "${s.name}" marked ${s.done ? "done" : "not done"}`);
      saveTask();
    });

    // Edit subtask on double-click
    li.addEventListener("dblclick", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = s.name;
      input.style.width = "80%";
      li.innerHTML = "";
      li.appendChild(input);
      input.focus();

      // Save new name on blur or Enter
      input.addEventListener("blur", () => {
        const newName = input.value.trim();
        if (newName) {
          s.name = newName;
        }
        renderSubtasks();
        saveTask();
        logActivity(`Subtask renamed to "${s.name}"`);
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") input.blur();
      });
    });

    li.style.textDecoration = s.done ? "line-through" : "none";
    subtasksList.appendChild(li);
  });
}


addSubtaskBtn.addEventListener("click", () => {
  const name = newSubtaskInput.value.trim();
  if (!name) return;
  subtask.subtasks.push({ name, done: false });
  newSubtaskInput.value = "";
  renderSubtasks();
  updateProgress();
  logActivity(`Subtask "${name}" added`);
  saveTask();
});

// ---------- Progress ----------
function updateProgress() {
  if (!subtask.subtasks || subtask.subtasks.length === 0) {
    progressBar.value = 0;
    return;
  }
  let doneCount = subtask.subtasks.filter(s => s.done).length;
  progressBar.value = Math.floor((doneCount / subtask.subtasks.length) * 100);
}

// ---------- Activity Log ----------
function logActivity(msg) {
  if (!subtask.log) subtask.log = [];
  const time = new Date().toLocaleString();
  subtask.log.push(`${time}: ${msg}`);
  logList.innerHTML = "";
  subtask.log.slice().reverse().forEach(entry => {
    const li = document.createElement("li");
    li.textContent = entry;
    logList.appendChild(li);
  });
}

// ---------- Copy Link ----------
function copyLink() {
  navigator.clipboard.writeText(window.location.href);
  alert("Task link copied!");
}

// ---------- Delete & Back ----------
function deleteTask() {
  if (confirm("⚠️ Delete this task?")) {
    subtasks.splice(subIndex, 1);
    localStorage.setItem("ws_" + taskId, JSON.stringify(subtasks));
    window.location.href = "workspace.html?id=" + taskId;
  }
}

function goBack() {
  window.location.href = "workspace.html?id=" + taskId;
}


const fileDropZone = document.getElementById("fileDropZone");
const fileInput = document.getElementById("fileInput");
const attachedFiles = document.getElementById("attachedFiles");

// Initialize
if (!subtask.attachments) subtask.attachments = [];
renderAttachments();

// Drag & Drop
fileDropZone.addEventListener("click", () => fileInput.click());
fileDropZone.addEventListener("dragover", e => {
  e.preventDefault();
  fileDropZone.classList.add("dragover");
});
fileDropZone.addEventListener("dragleave", () => fileDropZone.classList.remove("dragover"));
fileDropZone.addEventListener("drop", e => {
  e.preventDefault();
  fileDropZone.classList.remove("dragover");
  handleFiles(e.dataTransfer.files);
});

// File input change
fileInput.addEventListener("change", () => {
  handleFiles(fileInput.files);
});

function handleFiles(files) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      subtask.attachments.push({ name: file.name, data: e.target.result });
      saveTask();
      renderAttachments();
      logActivity(`File "${file.name}" attached`);
    };
    reader.readAsDataURL(file);
  });
}

function renderAttachments() {
  attachedFiles.innerHTML = "";
  subtask.attachments.forEach((file, i) => {
    const li = document.createElement("li");
    li.textContent = file.name;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "🗑";
    removeBtn.className = "file-remove-btn";
    removeBtn.addEventListener("click", () => {
      subtask.attachments.splice(i, 1);
      saveTask();
      renderAttachments();
      logActivity(`File "${file.name}" removed`);
    });
    li.appendChild(removeBtn);
    attachedFiles.appendChild(li);
  });
}
