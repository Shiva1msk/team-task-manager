const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/dashboard - summary stats for current user
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  const [memberships, assignedTasks, overdueTasks] = await Promise.all([
    prisma.projectMember.count({ where: { userId } }),
    prisma.task.findMany({
      where: { assigneeId: userId },
      include: {
        project: { select: { id: true, name: true } }
      },
      orderBy: { dueDate: 'asc' }
    }),
    prisma.task.count({
      where: {
        assigneeId: userId,
        dueDate: { lt: now },
        status: { not: 'DONE' }
      }
    })
  ]);

  const statusCounts = assignedTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalProjects: memberships,
    totalAssignedTasks: assignedTasks.length,
    overdueTasks,
    statusCounts,
    recentTasks: assignedTasks.slice(0, 5)
  });
});

module.exports = router;
