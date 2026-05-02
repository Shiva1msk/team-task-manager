const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireProjectAdmin } = require('../middleware/auth');

router.use(authenticate);

// GET /api/tasks?projectId=xxx - get tasks for a project
router.get('/', async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });

  // verify membership
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId } }
  });
  if (!member) return res.status(403).json({ error: 'Not a member of this project' });

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(tasks);
});

// POST /api/tasks - create task (admin only)
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('projectId').notEmpty().withMessage('projectId is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, projectId, assigneeId, priority, dueDate } = req.body;

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId } }
  });
  if (!member) return res.status(403).json({ error: 'Not a member of this project' });
  if (member.role !== 'ADMIN') return res.status(403).json({ error: 'Only admins can create tasks' });

  try {
    const task = await prisma.task.create({
      data: {
        title, description, projectId,
        assigneeId: assigneeId || null,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        creatorId: req.user.id
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } }
      }
    });
    res.status(201).json(task);
  } catch {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:taskId - update task
router.put('/:taskId', async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } }
  });
  if (!member) return res.status(403).json({ error: 'Not a member of this project' });

  // Members can only update status; admins can update everything
  const { title, description, status, priority, dueDate, assigneeId } = req.body;
  const updateData = { status };

  if (member.role === 'ADMIN') {
    Object.assign(updateData, { title, description, priority, assigneeId, dueDate: dueDate ? new Date(dueDate) : null });
  }

  const updated = await prisma.task.update({
    where: { id: req.params.taskId },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } }
    }
  });
  res.json(updated);
});

// DELETE /api/tasks/:taskId - delete task (admin only)
router.delete('/:taskId', async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId: task.projectId } }
  });
  if (!member || member.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  await prisma.task.delete({ where: { id: req.params.taskId } });
  res.json({ message: 'Task deleted' });
});

module.exports = router;
