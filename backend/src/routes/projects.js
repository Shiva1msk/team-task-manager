const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireProjectAdmin } = require('../middleware/auth');

// All routes require auth
router.use(authenticate);

// GET /api/projects - list projects for current user
router.get('/', async (req, res) => {
  const memberships = await prisma.projectMember.findMany({
    where: { userId: req.user.id },
    include: {
      project: {
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true, members: true } }
        }
      }
    }
  });
  res.json(memberships.map(m => ({ ...m.project, myRole: m.role })));
});

// POST /api/projects - create project (any user)
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  try {
    const project = await prisma.project.create({
      data: {
        name, description,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' }
        }
      },
      include: { owner: { select: { id: true, name: true, email: true } } }
    });
    res.status(201).json(project);
  } catch {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects/:projectId
router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: req.user.id, projectId } }
  });
  if (!member) return res.status(403).json({ error: 'Not a member of this project' });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  res.json({ ...project, myRole: member.role });
});

// PUT /api/projects/:projectId - update (admin only)
router.put('/:projectId', requireProjectAdmin, [
  body('name').trim().notEmpty()
], async (req, res) => {
  const { name, description } = req.body;
  const project = await prisma.project.update({
    where: { id: req.params.projectId },
    data: { name, description }
  });
  res.json(project);
});

// DELETE /api/projects/:projectId - delete (admin only)
router.delete('/:projectId', requireProjectAdmin, async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.projectId } });
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:projectId/members - add member (admin only)
router.post('/:projectId/members', requireProjectAdmin, [
  body('email').isEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, role } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    const member = await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId: req.params.projectId,
        role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER'
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.status(201).json(member);
  } catch {
    res.status(409).json({ error: 'User already a member' });
  }
});

// DELETE /api/projects/:projectId/members/:userId - remove member (admin only)
router.delete('/:projectId/members/:userId', requireProjectAdmin, async (req, res) => {
  await prisma.projectMember.delete({
    where: {
      userId_projectId: { userId: req.params.userId, projectId: req.params.projectId }
    }
  });
  res.json({ message: 'Member removed' });
});

module.exports = router;
