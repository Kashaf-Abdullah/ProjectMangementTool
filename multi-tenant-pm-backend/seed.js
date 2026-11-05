require('dotenv').config();
const mongoose = require('mongoose');
const Organization = require('./models/Organization');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Comment = require('./models/Comment');

const DEMO_PASSWORD = 'DemoPass123!';

async function findOrCreate(Model, filter, data) {
  const existing = await Model.findOne(filter);
  return existing || Model.create(data);
}

async function seedDemoData() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be set before running the seed script.');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const organization = await findOrCreate(
    Organization,
    { subdomain: 'acme-demo' },
    {
      name: 'Acme Demo',
      subdomain: 'acme-demo',
      userLimit: 10,
      currentUsers: 3
    }
  );

  const users = {};
  const demoUsers = [
    { key: 'admin', email: 'admin@acme-demo.dev', firstName: 'Avery', lastName: 'Morgan', role: 'admin' },
    { key: 'manager', email: 'manager@acme-demo.dev', firstName: 'Jordan', lastName: 'Lee', role: 'project_manager' },
    { key: 'member', email: 'member@acme-demo.dev', firstName: 'Riley', lastName: 'Taylor', role: 'user' }
  ];

  for (const demoUser of demoUsers) {
    users[demoUser.key] = await findOrCreate(
      User,
      { email: demoUser.email },
      {
        email: demoUser.email,
        password: DEMO_PASSWORD,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        role: demoUser.role,
        orgId: organization._id,
        isActive: true
      }
    );
  }

  const projects = [
    {
      name: 'Website Redesign',
      description: 'Refresh the marketing site and improve the customer journey.',
      color: '#6366f1'
    },
    {
      name: 'Mobile App Launch',
      description: 'Prepare the first release of the Acme mobile app.',
      color: '#14b8a6'
    }
  ];
  const savedProjects = [];

  for (const projectData of projects) {
    savedProjects.push(await findOrCreate(
      Project,
      { orgId: organization._id, name: projectData.name },
      {
        ...projectData,
        orgId: organization._id,
        projectManagerId: users.manager._id,
        members: [users.manager._id, users.member._id]
      }
    ));
  }

  const taskData = [
    {
      title: 'Create homepage wireframes',
      description: 'Draft desktop and mobile layouts for the new homepage.',
      project: savedProjects[0],
      assignee: users.manager,
      status: 'done',
      priority: 'high',
      labels: ['design', 'ui']
    },
    {
      title: 'Build responsive navigation',
      description: 'Implement the responsive header and primary navigation.',
      project: savedProjects[0],
      assignee: users.member,
      status: 'in_progress',
      priority: 'medium',
      labels: ['ui', 'feature']
    },
    {
      title: 'Set up mobile app repository',
      description: 'Add the initial app structure and development documentation.',
      project: savedProjects[1],
      assignee: users.member,
      status: 'todo',
      priority: 'medium',
      labels: ['docs', 'backend']
    }
  ];
  const savedTasks = [];

  for (const task of taskData) {
    savedTasks.push(await findOrCreate(
      Task,
      { projectId: task.project._id, title: task.title },
      {
        title: task.title,
        description: task.description,
        projectId: task.project._id,
        orgId: organization._id,
        assigneeId: task.assignee._id,
        status: task.status,
        priority: task.priority,
        labels: task.labels,
        createdBy: users.manager._id
      }
    ));
  }

  await findOrCreate(
    Comment,
    { taskId: savedTasks[0]._id, userId: users.member._id, text: 'Wireframes are ready for review.' },
    {
      taskId: savedTasks[0]._id,
      orgId: organization._id,
      userId: users.member._id,
      text: 'Wireframes are ready for review.'
    }
  );

  console.log('Demo data is ready.');
  console.log(`Demo login password: ${DEMO_PASSWORD}`);
  console.log('Demo accounts: admin@acme-demo.dev, manager@acme-demo.dev, member@acme-demo.dev');
}

seedDemoData()
  .catch((error) => {
    console.error('Failed to seed demo data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
