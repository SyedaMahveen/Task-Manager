const STORAGE_KEY = 'taskmgr.tasks.v1';
let tasks = [];

function loadTasks(){
  const raw = localStorage.getItem(STORAGE_KEY);
  tasks = raw ? JSON.parse(raw) : [];
}
function saveTasks(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
}
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function isToday(dateStr){
  if(!dateStr) return false;
  const d=new Date(dateStr), n=new Date();
  return d.getDate()===n.getDate() && d.getMonth()===n.getMonth() && d.getFullYear()===n.getFullYear();
}

// Add Task
function addTask({title, due=null, priority='medium'}){
  tasks.unshift({ id:uid(), title, due, priority, completed:false, createdAt:Date.now() });
  saveTasks(); renderTasks();
}
// Update Task
function updateTask(id, patch){
  const i=tasks.findIndex(t=>t.id===id); if(i<0) return;
  tasks[i]={...tasks[i],...patch}; saveTasks(); renderTasks();
}
// Delete Task
function deleteTask(id){ tasks=tasks.filter(t=>t.id!==id); saveTasks(); renderTasks(); }
function clearCompleted(){ tasks=tasks.filter(t=>!t.completed); saveTasks(); renderTasks(); }
function clearAll(){ if(confirm("Clear all tasks?")){ tasks=[]; saveTasks(); renderTasks(); } }

// Render Tasks
function renderTasks(){
  const list=document.getElementById('taskList'); list.innerHTML='';
  const filter=document.getElementById('filter').value, sort=document.getElementById('sort').value;
  let filtered=[...tasks];
  if(filter==='active') filtered=filtered.filter(t=>!t.completed);
  if(filter==='completed') filtered=filtered.filter(t=>t.completed);
  if(filter==='due-today') filtered=filtered.filter(t=>isToday(t.due));

  if(sort==='oldest') filtered.sort((a,b)=>a.createdAt-b.createdAt);
  if(sort==='priority') filtered.sort((a,b)=>({high:0,medium:1,low:2}[a.priority]-{high:0,medium:1,low:2}[b.priority]));
  if(sort==='due') filtered.sort((a,b)=>new Date(a.due||Infinity)-new Date(b.due||Infinity));

  if(filtered.length===0){ list.innerHTML='<div class="sub">No tasks yet.</div>'; }
  else filtered.forEach(t=>{
    const div=document.createElement('div'); div.className='task'+(t.completed?' completed':'');
    div.innerHTML=`
      <div class="left">
        <input type="checkbox" ${t.completed?'checked':''} />
        <div>
          <div class="title">${t.title}</div>
          <div class="meta">
            <span class="badge">${t.due?new Date(t.due).toLocaleDateString():'No due'}</span>
            <span class="badge priority-${t.priority.slice(0,3)}">${t.priority}</span>
          </div>
        </div>
      </div>
      <div class="right">
        <button class="btn secondary small del">Delete</button>
      </div>`;
    div.querySelector('input').addEventListener('change',e=>updateTask(t.id,{completed:e.target.checked}));
    div.querySelector('.del').addEventListener('click',()=>deleteTask(t.id));
    list.appendChild(div);
  });
  updateProgress();
}
// Progress
function updateProgress(){
  const total=tasks.length, completed=tasks.filter(t=>t.completed).length;
  const percent=total?Math.round((completed/total)*100):0;
  document.getElementById('progressFill').style.width=percent+'%';
  document.getElementById('progressPercent').textContent=percent+'%';
  document.getElementById('completedCount').textContent=`${completed} / ${total}`;
}

// Events
document.getElementById('taskForm').addEventListener('submit',e=>{
  e.preventDefault();
  const title=document.getElementById('taskTitle').value.trim();
  if(!title) return;
  addTask({title,due:document.getElementById('taskDue').value||null,priority:document.getElementById('taskPriority').value});
  e.target.reset();
});
document.getElementById('clearCompleted').addEventListener('click',clearCompleted);
document.getElementById('clearAll').addEventListener('click',clearAll);
document.getElementById('filter').addEventListener('change',renderTasks);
document.getElementById('sort').addEventListener('change',renderTasks);

// Theme
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme',theme);
  localStorage.setItem('taskmgr.theme',theme);
}
document.getElementById('themeToggle').addEventListener('click',()=>{
  const cur=document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';
  applyTheme(cur==='dark'?'light':'dark');
});

// Export
document.getElementById('exportBtn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(tasks,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='tasks.json'; a.click(); URL.revokeObjectURL(url);
});

// Init
(function init(){
  loadTasks();
  applyTheme(localStorage.getItem('taskmgr.theme')||'light');
  renderTasks();
})();
