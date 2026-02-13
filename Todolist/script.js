const addBtn = document.getElementById('addBtn');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('taskList');
const pointsDisplay = document.getElementById('user-points');
const levelDisplay = document.getElementById('user-level');
const successSound = document.getElementById('success-sound');

// 1. Storage & Points Setup
let points = localStorage.getItem('xp_points') ? parseInt(localStorage.getItem('xp_points')) : 0;
pointsDisplay.textContent = points;

function updateLevelUI() {
    levelDisplay.textContent = Math.floor(points / 100) + 1;
}
updateLevelUI();

// 2. Browser Sound Unlocker (Mobile/PC fix)
document.body.addEventListener('click', () => {
    if (successSound) {
        successSound.load();
    }
}, { once: true });

document.addEventListener('DOMContentLoaded', () => {
    checkDailyReset();
    getTasks();
});

// 3. Add Task Function
function addTask() {
    const text = taskInput.value.trim();
    const time = document.getElementById('task-time').value;
    const isDaily = document.getElementById('is-daily').checked;

    if (text === "") return showNotification("Pehle task likhein!");

    const taskObj = {
        id: Date.now(),
        text: text,
        time: time,
        isDaily: isDaily,
        completed: false,
        lastNotified: null
    };

    createTaskElement(taskObj);
    saveLocalTasks(taskObj);

    taskInput.value = "";
    document.getElementById('task-time').value = "";
    document.getElementById('is-daily').checked = false;
}

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

// 4. UI Element Creation
function createTaskElement(taskObj) {
    const li = document.createElement('li');
    if (taskObj.completed) li.classList.add('completed');

    li.innerHTML = `
        <div class="task-content">
            <div class="custom-checkbox">
                <span class="check-icon">
                    <svg xmlns="http://www.w3.org" height="24px" viewBox="0 -960 960 960" width="24px" fill="#8C1AF6">
                        <path d="M400-304 240-464l56-56 104 104 264-264 56 56-320 320Z"/>
                    </svg>
                </span>
            </div>
            <div class="task-info">
                <span class="task-text">${taskObj.text} ${taskObj.isDaily ? '🔄' : ''}</span>
                ${taskObj.time ? `<span class="time-tag">⏰ ${taskObj.time}</span>` : ''}
            </div>
        </div>
        <button class="delete-btn">
            <svg xmlns="http://www.w3.org" height="20px" viewBox="0 -960 960 960" width="20px" fill="#fff">
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
            </svg>
        </button>
    `;

    li.querySelector('.task-content').addEventListener('click', () => {
        li.classList.toggle('completed');
        const isDone = li.classList.contains('completed');

        // Play Sound with error catching
        if (isDone && successSound) {
            successSound.play().catch(e => console.log("Sound load failed or blocked"));
        }

        handleRewards(isDone);
        updateTaskStatus(taskObj.id, isDone);
    });

    li.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        li.classList.add('removing');
        setTimeout(() => {
            li.remove();
            removeLocalTask(taskObj.id);
        }, 300);
    });

    taskList.appendChild(li);
}

// 5. Reward & Level Up
function handleRewards(isDone) {
    const oldLevel = Math.floor(points / 100) + 1;
    points = isDone ? points + 10 : Math.max(0, points - 10);
    pointsDisplay.textContent = points;
    localStorage.setItem('xp_points', points);

    const newLevel = Math.floor(points / 100) + 1;
    updateLevelUI();

    if (newLevel > oldLevel) {
        if (successSound) successSound.play().catch(e => {});
        triggerConfetti();
        showLevelPopup(newLevel);
    }
}

function showLevelPopup(lvl) {
    const popup = document.getElementById('level-popup');
    if(popup) {
        document.getElementById('pop-level').textContent = lvl;
        popup.classList.add('show');
    }
}

window.closePopup = function () {
    document.getElementById('level-popup').classList.remove('show');
};

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 200,
            spread: 90,
            origin: { y: 0.7 },
            colors: ['#8C1AF6', '#28a745', '#FFD700']
        });
    }
}

// 6. Resets & Reminders
function checkDailyReset() {
    const lastLogin = localStorage.getItem('last_login_date');
    const today = new Date().toDateString();

    if (lastLogin !== today) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => {
            if (task.isDaily) {
                task.completed = false;
                task.lastNotified = null;
            }
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('last_login_date', today);
    }
}

setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    tasks.forEach(task => {
        if (task.time === currentTime && !task.completed && task.lastNotified !== currentTime) {
            alert(`⏰ REMINDER: ${task.text}`);
            task.lastNotified = currentTime;
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
    });
}, 30000);

// 7. Storage Helpers
function saveLocalTasks(task) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function getTasks() {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(task => createTaskElement(task));
}

function updateTaskStatus(id, status) {
    let tasks = JSON.parse(localStorage.getItem('tasks'));
    if(!tasks) return;
    tasks.forEach(t => { if (t.id === id) t.completed = status; });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function removeLocalTask(id) {
    let tasks = JSON.parse(localStorage.getItem('tasks'));
    if(!tasks) return;
    localStorage.setItem('tasks', JSON.stringify(tasks.filter(t => t.id !== id)));
}

function showNotification(msg) {
    const div = document.createElement('div');
    div.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#ff4d4d;color:white;padding:10px 20px;border-radius:8px;z-index:2000;box-shadow:0 4px 10px rgba(0,0,0,0.2)";
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}
