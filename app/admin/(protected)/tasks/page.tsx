import { TaskPriority, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Card, SectionTitle, StatCard, fieldClassName } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { prisma } from "@/lib/db";
import { getAdminDirectory } from "@/lib/club-operations";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TasksAdminPage() {
  async function createTask(formData: FormData) {
    "use server";
    const session = await requireAdmin();

    await prisma.clubTask.create({
      data: {
        title: String(formData.get("title") || ""),
        module: String(formData.get("module") || ""),
        description: String(formData.get("description") || "") || null,
        status: String(formData.get("status") || "OPEN") as TaskStatus,
        priority: String(formData.get("priority") || "MEDIUM") as TaskPriority,
        dueAt: formData.get("dueAt") ? new Date(String(formData.get("dueAt"))) : null,
        createdByAdminId: session.user?.adminUserId,
        assignedToAdminId: String(formData.get("assignedToAdminId") || "") || null
      }
    });

    revalidatePath("/admin/tasks");
    revalidatePath("/admin/dashboard");
  }

  async function updateTaskStatus(formData: FormData) {
    "use server";
    await requireAdmin();

    await prisma.clubTask.update({
      where: { id: String(formData.get("taskId") || "") },
      data: {
        status: String(formData.get("status") || "OPEN") as TaskStatus
      }
    });

    revalidatePath("/admin/tasks");
    revalidatePath("/admin/dashboard");
  }

  const [admins, tasks, openTasks, blockedTasks] = await Promise.all([
    getAdminDirectory(),
    prisma.clubTask.findMany({
      include: {
        createdBy: true,
        assignedTo: true
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }],
      take: 30
    }),
    prisma.clubTask.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.clubTask.count({ where: { status: "BLOCKED" } })
  ]);

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Tasks"
        title="Shared club action list"
        description="Keep responsibilities transparent across finance, grounds, communications, social, practices, and equipment."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Open tasks" value={String(openTasks)} />
        <StatCard label="Blocked tasks" value={String(blockedTasks)} tone="warning" />
        <StatCard label="Tracked tasks" value={String(tasks.length)} />
      </div>

      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Add task</h2>
        <form action={createTask} className="grid gap-4 md:grid-cols-2">
          <input name="title" placeholder="Task title" required className={fieldClassName} />
          <input name="module" placeholder="Module or area" required className={fieldClassName} />
          <select name="assignedToAdminId" defaultValue="" className={fieldClassName}>
            <option value="">Assign to</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name}
              </option>
            ))}
          </select>
          <select name="priority" defaultValue="MEDIUM" className={fieldClassName}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <select name="status" defaultValue="OPEN" className={fieldClassName}>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <input name="dueAt" type="datetime-local" className={fieldClassName} />
          <textarea name="description" placeholder="Description" className={`${fieldClassName} md:col-span-2 min-h-24`} />
          <SubmitButton label="Save task" pendingLabel="Saving..." className="md:col-span-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" />
        </form>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Task list</h2>
        <div className="space-y-3">
          {tasks.length ? (
            tasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-ink">{task.title}</p>
                    <p className="text-sm text-slate-500">
                      {task.module} | {task.priority} | {task.status.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Assigned to: {task.assignedTo?.name ?? "Nobody yet"}
                      {task.dueAt ? ` | Due ${formatDateTime(task.dueAt)}` : ""}
                    </p>
                    {task.description ? <p className="mt-2 text-sm text-slate-700">{task.description}</p> : null}
                  </div>
                  <form action={updateTaskStatus} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="taskId" value={task.id} />
                    <select name="status" defaultValue={task.status} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0">
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                    <SubmitButton label="Update" pendingLabel="Saving..." className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" />
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No club tasks have been added yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
