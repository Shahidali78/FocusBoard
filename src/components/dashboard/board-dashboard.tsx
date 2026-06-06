"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  CirclePlus,
  Clock3,
  FolderKanban,
  GripVertical,
  Layers3,
  LayoutDashboard,
  ListFilter,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BoardColumn,
  BoardTask,
  BoardUser,
  DashboardData,
} from "@/types/board";
import { cn, formatDueDate, initials, isOverdue } from "@/lib/utils";

type Props = {
  data: DashboardData;
  currentUser: BoardUser;
};

type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  author: BoardUser;
};

const priorityLabels = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
} as const;

export function BoardDashboard({ data, currentUser }: Props) {
  const router = useRouter();
  const [columns, setColumns] = useState(data.project.columns);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("ALL");
  const [assignee, setAssignee] = useState("ALL");
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [newTaskColumnId, setNewTaskColumnId] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const isFiltering = Boolean(search || priority !== "ALL" || assignee !== "ALL");
  const filteredColumns = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: column.tasks.filter((task) => {
          const matchesSearch =
            !search ||
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            task.description?.toLowerCase().includes(search.toLowerCase());
          const matchesPriority = priority === "ALL" || task.priority === priority;
          const matchesAssignee =
            assignee === "ALL" ||
            (assignee === "UNASSIGNED"
              ? !task.assignee
              : task.assignee?.id === assignee);
          return matchesSearch && matchesPriority && matchesAssignee;
        }),
      })),
    [assignee, columns, priority, search],
  );

  const allTasks = columns.flatMap((column) => column.tasks);
  const doneColumn = columns.find((column) => column.name.toLowerCase() === "done");
  const totalTasks = allTasks.length;
  const completedTasks = doneColumn?.tasks.length ?? 0;
  const overdueTasks = allTasks.filter(
    (task) => isOverdue(task.dueDate) && task.columnId !== doneColumn?.id,
  ).length;
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  function handleDragStart(event: DragStartEvent) {
    if (isFiltering) return;
    const task = allTasks.find((item) => item.id === event.active.id);
    setActiveTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    if (isFiltering || !event.over) return;

    const activeId = String(event.active.id);
    const overId = String(event.over.id);
    const before = columns;
    const sourceColumn = columns.find((column) =>
      column.tasks.some((task) => task.id === activeId),
    );
    if (!sourceColumn) return;

    const overTask = columns
      .flatMap((column) => column.tasks)
      .find((task) => task.id === overId);
    const targetColumn = overTask
      ? columns.find((column) => column.id === overTask.columnId)
      : columns.find((column) => `column-${column.id}` === overId);
    if (!targetColumn) return;

    const movedTask = sourceColumn.tasks.find((task) => task.id === activeId);
    if (!movedTask) return;

    const nextColumns = columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => task.id !== activeId),
    }));
    const destination = nextColumns.find((column) => column.id === targetColumn.id);
    if (!destination) return;

    const targetIndex = overTask
      ? Math.max(
          0,
          destination.tasks.findIndex((task) => task.id === overTask.id),
        )
      : destination.tasks.length;
    destination.tasks.splice(targetIndex, 0, {
      ...movedTask,
      columnId: destination.id,
    });

    const normalized = nextColumns.map((column) => ({
      ...column,
      tasks: column.tasks.map((task, position) => ({ ...task, position })),
    }));
    setColumns(normalized);

    try {
      const response = await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: data.project.id,
          movedTaskId: activeId,
          columns: normalized.map((column) => ({
            columnId: column.id,
            taskIds: column.tasks.map((task) => task.id),
          })),
        }),
      });
      if (!response.ok) throw new Error("Could not save the new task position");
      router.refresh();
    } catch (error) {
      setColumns(before);
      showNotice(error instanceof Error ? error.message : "Unable to move task");
    }
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
      <aside className={cn("sidebar", sidebarOpen && "sidebar-open")}>
        <div className="sidebar-top">
          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
          <div className="brand sidebar-brand">
            <span className="brand-mark">
              <Layers3 size={19} />
            </span>
            <span>Focusboard</span>
          </div>

          <button className="workspace-switcher">
            <span className="workspace-avatar">{initials(data.workspace.name)}</span>
            <span>
              <small>Workspace</small>
              <strong>{data.workspace.name}</strong>
            </span>
            <ChevronDown size={16} />
          </button>
        </div>

        <nav className="main-nav">
          <button className="nav-item active">
            <LayoutDashboard size={19} />
            <span>My work</span>
          </button>
          <button className="nav-item">
            <Bell size={19} />
            <span>Inbox</span>
            <em>3</em>
          </button>
          <button className="nav-item">
            <CalendarDays size={19} />
            <span>Timeline</span>
          </button>
          <button className="nav-item">
            <UsersRound size={19} />
            <span>Team</span>
          </button>
        </nav>

        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <span>Projects</span>
            <button onClick={() => setShowProjectModal(true)} aria-label="New project">
              <Plus size={17} />
            </button>
          </div>
          <div className="project-list">
            {data.projects.map((project) => (
              <button
                key={project.id}
                className={cn(
                  "project-link",
                  project.id === data.project.id && "active",
                )}
                onClick={() => {
                  router.push(`/dashboard?project=${project.id}`);
                  setSidebarOpen(false);
                }}
              >
                <span style={{ background: project.color }}>{project.key[0]}</span>
                <div>
                  <strong>{project.name}</strong>
                  <small>{project.taskCount} tasks</small>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <CircleHelp size={19} />
            <span>Help center</span>
          </button>
          <button className="nav-item">
            <Settings size={19} />
            <span>Settings</span>
          </button>
          <div className="profile-menu">
            <Avatar user={currentUser} />
            <div>
              <strong>{currentUser.name}</strong>
              <small>{currentUser.email}</small>
            </div>
            <button onClick={logout} aria-label="Log out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="workspace-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search this project..."
            />
            <kbd>⌘ K</kbd>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications">
              <Bell size={19} />
              <i />
            </button>
            <button
              className="icon-button"
              onClick={() => setShowActivity((visible) => !visible)}
              aria-label="Activity"
            >
              <Activity size={19} />
            </button>
            <button
              className="button button-primary new-task-top"
              onClick={() => setNewTaskColumnId(columns[0]?.id ?? null)}
            >
              <Plus size={18} />
              New task
            </button>
            <Avatar user={currentUser} />
          </div>
        </header>

        <section className="project-header">
          <div className="project-heading">
            <div
              className="project-icon"
              style={{ background: `${data.project.color}18`, color: data.project.color }}
            >
              <FolderKanban size={24} />
            </div>
            <div>
              <div className="breadcrumb">
                {data.workspace.name} <span>/</span> {data.project.key}
              </div>
              <h1>{data.project.name}</h1>
              <p>{data.project.description}</p>
            </div>
          </div>
          <div className="project-team">
            <div className="avatar-stack">
              {data.members.slice(0, 4).map((member) => (
                <Avatar key={member.id} user={member} size="small" />
              ))}
            </div>
            <button className="button button-secondary">
              <UsersRound size={17} />
              Share
            </button>
            <button className="icon-button">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </section>

        <section className="stats-row">
          <div className="stat-card stat-progress">
            <div className="stat-icon purple">
              <Sparkles size={18} />
            </div>
            <div>
              <small>Project progress</small>
              <strong>{progress}%</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">
              <FolderKanban size={18} />
            </div>
            <div>
              <small>Total tasks</small>
              <strong>{totalTasks}</strong>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <Check size={18} />
            </div>
            <div>
              <small>Completed</small>
              <strong>{completedTasks}</strong>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">
              <Clock3 size={18} />
            </div>
            <div>
              <small>Overdue</small>
              <strong>{overdueTasks}</strong>
            </div>
          </div>
        </section>

        <section className="board-toolbar">
          <div className="view-tabs">
            <button className="active">
              <LayoutDashboard size={17} /> Board
            </button>
            <button>
              <ListFilter size={17} /> List
            </button>
          </div>
          <div className="filters">
            <label>
              <SlidersHorizontal size={16} />
              <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="ALL">All priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </label>
            <label>
              <UsersRound size={16} />
              <select value={assignee} onChange={(event) => setAssignee(event.target.value)}>
                <option value="ALL">All assignees</option>
                <option value="UNASSIGNED">Unassigned</option>
                {data.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            {isFiltering && (
              <button
                className="clear-filters"
                onClick={() => {
                  setSearch("");
                  setPriority("ALL");
                  setAssignee("ALL");
                }}
              >
                <X size={15} /> Clear
              </button>
            )}
          </div>
        </section>

        {isFiltering && (
          <div className="filter-note">
            Dragging is paused while filters are active.
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <section className="kanban-board">
            {filteredColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                disabled={isFiltering}
                onAddTask={() => setNewTaskColumnId(column.id)}
                onSelectTask={setSelectedTask}
              />
            ))}
          </section>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} overlay /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      <ActivityPanel
        open={showActivity}
        activities={data.activities}
        onClose={() => setShowActivity(false)}
      />

      {(selectedTask || newTaskColumnId) && (
        <TaskModal
          project={data.project}
          members={data.members}
          task={selectedTask}
          defaultColumnId={newTaskColumnId ?? selectedTask?.columnId ?? columns[0]?.id}
          onClose={() => {
            setSelectedTask(null);
            setNewTaskColumnId(null);
          }}
          onSaved={() => {
            setSelectedTask(null);
            setNewTaskColumnId(null);
            router.refresh();
            showNotice(selectedTask ? "Task updated" : "Task created");
          }}
        />
      )}

      {showProjectModal && (
        <NewProjectModal
          workspaceId={data.workspace.id}
          onClose={() => setShowProjectModal(false)}
          onCreated={(projectId) => {
            setShowProjectModal(false);
            router.push(`/dashboard?project=${projectId}`);
            router.refresh();
          }}
        />
      )}

      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

function KanbanColumn({
  column,
  disabled,
  onAddTask,
  onSelectTask,
}: {
  column: BoardColumn;
  disabled: boolean;
  onAddTask: () => void;
  onSelectTask: (task: BoardTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.id}` });
  return (
    <article ref={setNodeRef} className={cn("kanban-column", isOver && "column-over")}>
      <header className="column-header">
        <div>
          <i style={{ background: column.color }} />
          <h2>{column.name}</h2>
          <span>{column.tasks.length}</span>
        </div>
        <button onClick={onAddTask} aria-label={`Add task to ${column.name}`}>
          <Plus size={18} />
        </button>
      </header>
      <SortableContext
        items={column.tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="column-tasks">
          {column.tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              disabled={disabled}
              onClick={() => onSelectTask(task)}
            />
          ))}
          {column.tasks.length === 0 && (
            <button className="empty-column" onClick={onAddTask}>
              <CirclePlus size={20} />
              <span>Add the first task</span>
            </button>
          )}
        </div>
      </SortableContext>
      <button className="add-task-button" onClick={onAddTask}>
        <Plus size={17} /> Add task
      </button>
    </article>
  );
}

function SortableTask({
  task,
  disabled,
  onClick,
}: {
  task: BoardTask;
  disabled: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("sortable-task", isDragging && "task-dragging")}
    >
      <button className="drag-handle" {...attributes} {...listeners} aria-label="Move task">
        <GripVertical size={15} />
      </button>
      <TaskCard task={task} onClick={onClick} />
    </div>
  );
}

function TaskCard({
  task,
  onClick,
  overlay = false,
}: {
  task: BoardTask;
  onClick?: () => void;
  overlay?: boolean;
}) {
  const due = formatDueDate(task.dueDate);
  return (
    <button className={cn("task-card", overlay && "task-overlay")} onClick={onClick}>
      <div className="task-labels">
        {task.labels.slice(0, 3).map((label) => (
          <span
            key={label.id}
            style={{ color: label.color, background: `${label.color}14` }}
          >
            <i style={{ background: label.color }} />
            {label.name}
          </span>
        ))}
      </div>
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      <div className="task-meta">
        <span className={`priority priority-${task.priority.toLowerCase()}`}>
          <i />
          {priorityLabels[task.priority]}
        </span>
        {due && (
          <span className={cn("due-date", isOverdue(task.dueDate) && "overdue")}>
            <CalendarDays size={14} />
            {due}
          </span>
        )}
      </div>
      <footer>
        <div>
          {task.assignee ? (
            <Avatar user={task.assignee} size="tiny" />
          ) : (
            <span className="unassigned-avatar">?</span>
          )}
        </div>
        <span className="comment-count">
          <MessageSquareText size={14} />
          {task.commentCount}
        </span>
      </footer>
    </button>
  );
}

function TaskModal({
  project,
  members,
  task,
  defaultColumnId,
  onClose,
  onSaved,
}: {
  project: DashboardData["project"];
  members: BoardUser[];
  task: BoardTask | null;
  defaultColumnId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState(task?.priority ?? "MEDIUM");
  const [columnId, setColumnId] = useState(task?.columnId ?? defaultColumnId);
  const [assigneeId, setAssigneeId] = useState(task?.assignee?.id ?? "");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
  );
  const [labelIds, setLabelIds] = useState(task?.labels.map((label) => label.id) ?? []);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!task) return;
    fetch(`/api/tasks/${task.id}/comments`)
      .then((response) => response.json())
      .then((payload) => setComments(payload.comments ?? []))
      .catch(() => setComments([]));
  }, [task]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch(task ? `/api/tasks/${task.id}` : "/api/tasks", {
        method: task ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(task ? {} : { projectId: project.id }),
          columnId,
          title,
          description: description || null,
          priority,
          assigneeId: assigneeId || null,
          dueDate: dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null,
          labelIds,
        }),
      });
      const payload = response.status === 204 ? {} : await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save task");
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save task");
    } finally {
      setPending(false);
    }
  }

  async function removeTask() {
    if (!task || !window.confirm("Delete this task?")) return;
    const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (response.ok) onSaved();
  }

  async function addComment(event: FormEvent) {
    event.preventDefault();
    if (!task || !comment.trim()) return;
    const response = await fetch(`/api/tasks/${task.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: comment }),
    });
    const payload = await response.json();
    if (response.ok) {
      setComments((items) => [...items, payload.comment]);
      setComment("");
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="task-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="modal-kicker">{task ? `${project.key} task` : "New task"}</span>
            <h2>{task ? "Edit task details" : "What needs to get done?"}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="task-modal-scroll">
          <form onSubmit={save} className="task-form">
            <label className="field">
              <span>Task title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Prepare launch checklist"
                autoFocus
                required
              />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add context, expected outcomes, or helpful links..."
                rows={4}
              />
            </label>
            <div className="form-grid">
              <label className="field">
                <span>Status</span>
                <select value={columnId} onChange={(event) => setColumnId(event.target.value)}>
                  {project.columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Priority</span>
                <select value={priority} onChange={(event) => setPriority(event.target.value as BoardTask["priority"])}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </label>
              <label className="field">
                <span>Assignee</span>
                <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Due date</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </label>
            </div>
            <fieldset className="label-picker">
              <legend>Labels</legend>
              <div>
                {project.labels.map((label) => (
                  <label
                    key={label.id}
                    className={cn(labelIds.includes(label.id) && "selected")}
                    style={{ "--label-color": label.color } as React.CSSProperties}
                  >
                    <input
                      type="checkbox"
                      checked={labelIds.includes(label.id)}
                      onChange={() =>
                        setLabelIds((ids) =>
                          ids.includes(label.id)
                            ? ids.filter((id) => id !== label.id)
                            : [...ids, label.id],
                        )
                      }
                    />
                    <i />
                    {label.name}
                  </label>
                ))}
              </div>
            </fieldset>

            {error && <div className="form-error">{error}</div>}

            <div className="modal-actions">
              {task && (
                <button type="button" className="button button-danger-ghost" onClick={removeTask}>
                  Delete task
                </button>
              )}
              <div>
                <button type="button" className="button button-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button className="button button-primary" disabled={pending}>
                  {pending && <LoaderCircle className="spin" size={17} />}
                  {task ? "Save changes" : "Create task"}
                </button>
              </div>
            </div>
          </form>

          {task && (
            <section className="comments-section">
              <div className="comments-title">
                <h3>Conversation</h3>
                <span>{comments.length}</span>
              </div>
              <div className="comments-list">
                {comments.length === 0 && (
                  <p className="empty-comments">No comments yet. Add the first update.</p>
                )}
                {comments.map((item) => (
                  <article key={item.id}>
                    <Avatar user={item.author} size="small" />
                    <div>
                      <header>
                        <strong>{item.author.name}</strong>
                        <time>{formatRelativeTime(item.createdAt)}</time>
                      </header>
                      <p>{item.body}</p>
                    </div>
                  </article>
                ))}
              </div>
              <form className="comment-form" onSubmit={addComment}>
                <Avatar user={members.find((member) => member.id === task.reporter.id) ?? task.reporter} size="small" />
                <input
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Write an update..."
                />
                <button className="button button-primary" disabled={!comment.trim()}>
                  Send
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function NewProjectModal({
  workspaceId,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  onClose: () => void;
  onCreated: (projectId: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const colors = ["#6D5DFB", "#0EA5E9", "#10B981", "#F97316", "#EC4899"];
  const [color, setColor] = useState(colors[0]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: form.get("name"),
          key: form.get("key"),
          description: form.get("description"),
          color,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to create project");
      onCreated(payload.project.id);
    } catch (creationError) {
      setError(
        creationError instanceof Error ? creationError.message : "Unable to create project",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="small-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="modal-kicker">New project</span>
            <h2>Create a focused workspace</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <label className="field">
          <span>Project name</span>
          <input name="name" placeholder="Mobile app launch" required />
        </label>
        <label className="field">
          <span>Project key</span>
          <input name="key" placeholder="APP" maxLength={8} required />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea name="description" rows={3} placeholder="What is this project here to achieve?" />
        </label>
        <fieldset className="color-picker">
          <legend>Project color</legend>
          <div>
            {colors.map((item) => (
              <button
                key={item}
                type="button"
                className={cn(color === item && "selected")}
                style={{ background: item }}
                onClick={() => setColor(item)}
              >
                {color === item && <Check size={15} />}
              </button>
            ))}
          </div>
        </fieldset>
        {error && <div className="form-error">{error}</div>}
        <div className="modal-actions">
          <span />
          <div>
            <button type="button" className="button button-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="button button-primary" disabled={pending}>
              {pending && <LoaderCircle className="spin" size={17} />}
              Create project
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function ActivityPanel({
  open,
  activities,
  onClose,
}: {
  open: boolean;
  activities: DashboardData["activities"];
  onClose: () => void;
}) {
  return (
    <aside className={cn("activity-panel", open && "open")}>
      <header>
        <div>
          <span className="modal-kicker">Project pulse</span>
          <h2>Recent activity</h2>
        </div>
        <button className="icon-button" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <div className="activity-list">
        {activities.map((item) => (
          <article key={item.id}>
            <Avatar user={item.user} size="small" />
            <div>
              <p>
                <strong>{item.user.name}</strong> {item.message}
              </p>
              <time>{formatRelativeTime(item.createdAt)}</time>
            </div>
          </article>
        ))}
        {activities.length === 0 && <p className="empty-comments">No activity yet.</p>}
      </div>
    </aside>
  );
}

function Avatar({
  user,
  size = "regular",
}: {
  user: BoardUser;
  size?: "tiny" | "small" | "regular";
}) {
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ background: user.avatarColor }}
      title={user.name}
    >
      {initials(user.name)}
    </span>
  );
}

function formatRelativeTime(value: string) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
