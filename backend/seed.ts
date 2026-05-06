import prisma from "./src/lib/prisma";
import bcrypt from "bcryptjs";
import fs from "fs";

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const PROJECT_STATUSES = ["ACTIVE", "COMPLETED"];

const PROJECT_TEMPLATES = [
  { name: "Website Redesign", tasks: ["Create wireframes", "Design mockups", "Implement landing page", "Setup routing", "Optimize images for web"] },
  { name: "Mobile App Launch", tasks: ["Finish beta testing", "Fix critical bugs", "Submit to App Store", "Submit to Google Play", "Write release notes"] },
  { name: "Marketing Campaign Q3", tasks: ["Define target audience", "Create ad copy", "Design banner ads", "Setup Google Ads", "Analyze campaign metrics"] },
  { name: "Database Migration", tasks: ["Backup current database", "Setup new database schema", "Write migration scripts", "Test data integrity", "Switch traffic to new DB"] },
  { name: "User Authentication", tasks: ["Implement JWT logic", "Setup OAuth providers", "Create login page UI", "Create signup page UI", "Add password reset flow"] },
  { name: "Q4 Financial Audit", tasks: ["Gather Q3 receipts", "Reconcile bank statements", "Prepare income statement", "Review payroll logs", "Submit tax documents"] },
  { name: "HR Onboarding Revamp", tasks: ["Update employee handbook", "Create welcome video", "Set up IT checklist", "Schedule orientation sessions", "Design welcome kit"] },
  { name: "Server Infrastructure Upgrade", tasks: ["Audit current server loads", "Order new hardware", "Provision cloud servers", "Migrate static assets", "Update load balancers"] },
  { name: "Customer Support Portal", tasks: ["Design ticket submission UI", "Implement ticketing backend", "Setup Zendesk integration", "Write FAQ articles", "Train support staff"] },
  { name: "Annual Company Retreat", tasks: ["Select venue location", "Book accommodations", "Plan team building activities", "Arrange catering", "Send out itineraries"] },
  { name: "Product Analytics Dashboard", tasks: ["Define key metrics", "Integrate Mixpanel", "Build data visualization charts", "Setup automated reports", "Present to stakeholders"] },
  { name: "Cybersecurity Training", tasks: ["Research training platforms", "Draft phishing test emails", "Schedule mandatory sessions", "Track completion rates", "Review security policies"] },
  { name: "Social Media Strategy", tasks: ["Audit current platforms", "Create content calendar", "Design post templates", "Schedule posts for month", "Analyze engagement rates"] },
  { name: "API Rate Limiting", tasks: ["Analyze current API traffic", "Implement Redis cache", "Write rate limiting middleware", "Update API documentation", "Monitor for dropped requests"] },
  { name: "E-commerce Cart Optimization", tasks: ["Analyze drop-off rates", "Redesign checkout flow", "Implement guest checkout", "Add Apple Pay support", "A/B test new design"] },
  { name: "Office Relocation", tasks: ["Scout new office spaces", "Negotiate lease terms", "Hire moving company", "Plan layout and seating", "Update corporate address"] },
  { name: "Accessibility Audit", tasks: ["Run automated WCAG tests", "Fix contrast ratios", "Add missing ARIA labels", "Ensure keyboard navigation", "Test with screen readers"] },
  { name: "Supplier Contract Renewals", tasks: ["Review expiring contracts", "Negotiate new rates", "Draft renewal agreements", "Get legal approval", "Sign finalized contracts"] },
  { name: "Performance Review Cycle", tasks: ["Send out self-evaluation forms", "Schedule manager 1-on-1s", "Calibrate ratings", "Prepare compensation letters", "Conduct final meetings"] },
  { name: "Mobile Push Notifications", tasks: ["Setup Firebase Cloud Messaging", "Design notification templates", "Implement client-side handling", "Add deep linking", "Test notification delivery"] }
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("Cleaning database...");
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.taskLabel.deleteMany({});
  await prisma.label.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("Database cleaned.");

  const usersData: any[] = [];
  const credentials: string[] = [];
  
  credentials.push("# User Credentials");
  credentials.push("Here are the 20 generated users:");
  credentials.push("");
  credentials.push("| Name | Email | Password |");
  credentials.push("|---|---|---|");

  const randomNames = [
    "Alice Smith", "Bob Johnson", "Charlie Davis", "Diana Evans",
    "Evan Wright", "Fiona Clark", "George King", "Hannah Baker",
    "Ian Moore", "Julia White", "Kevin Harris", "Laura Martin",
    "Michael Lee", "Nina Taylor", "Oscar Brown", "Paula Wilson",
    "Quinn Adams", "Rachel Scott", "Sam Carter", "Tina Perez"
  ];

  console.log("Creating 20 users...");
  for (let i = 0; i < 20; i++) {
    const name = randomNames[i];
    const email = `${name.split(" ")[0].toLowerCase()}.${name.split(" ")[1].toLowerCase()}@example.com`;
    const password = `Password@${i + 1}!!`;
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      }
    });
    usersData.push(user);
    credentials.push(`| ${name} | ${email} | ${password} |`);
  }

  // Save credentials to file
  fs.writeFileSync("user_credentials.md", credentials.join("\n"));
  console.log("Credentials saved to user_credentials.md");

  console.log("Creating 20 projects...");
  for (let i = 0; i < 20; i++) {
    const creator = randomElement(usersData);
    const status = randomElement(PROJECT_STATUSES);
    const dueDate = randomDate(new Date(), new Date(Date.now() + 1000 * 60 * 60 * 24 * 60)); // Up to 60 days from now
    
    const template = PROJECT_TEMPLATES[i % PROJECT_TEMPLATES.length];

    const project = await prisma.project.create({
      data: {
        name: template.name,
        description: `This project is focused on executing tasks related to ${template.name}.`,
        status,
        dueDate,
        createdById: creator.id,
      }
    });

    // Audit log for project creation
    await prisma.activityLog.create({
      data: {
        projectId: project.id,
        userId: creator.id,
        action: "PROJECT_CREATED"
      }
    });

    // Add members - Only creator is ADMIN
    const membersCount = Math.floor(Math.random() * 5) + 3; // 3 to 7 members
    const shuffledUsers = [...usersData].sort(() => 0.5 - Math.random());
    const members = [creator, ...shuffledUsers.filter(u => u.id !== creator.id).slice(0, membersCount - 1)];

    for (const member of members) {
      const role = member.id === creator.id ? "ADMIN" : "MEMBER";

      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member.id,
          role,
        }
      });

      // Audit log for member addition (if not creator)
      if (member.id !== creator.id) {
        await prisma.activityLog.create({
          data: {
            projectId: project.id,
            userId: creator.id, // Creator is the one who "added" them
            action: "MEMBER_ADDED",
            metadata: { addedUser: member.name }
          }
        });
      }
    }

    // Add tasks
    const tasksCount = Math.floor(Math.random() * 2) + 3; // 3 or 4 tasks
    const availableTaskTitles = [...template.tasks].sort(() => 0.5 - Math.random());
    
    for (let j = 0; j < tasksCount; j++) {
      const taskCreator = randomElement(members);
      const assignee = Math.random() > 0.2 ? randomElement(members) : null; // 80% chance to be assigned
      const taskStatus = randomElement(STATUSES);
      const priority = randomElement(PRIORITIES);
      const taskDueDate = randomDate(new Date(), new Date(Date.now() + 1000 * 60 * 60 * 24 * 30));

      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          title: availableTaskTitles[j],
          description: `Description for ${availableTaskTitles[j]} in ${template.name}`,
          status: taskStatus,
          priority: priority,
          dueDate: taskDueDate,
          createdById: taskCreator.id,
          assignedToId: assignee?.id,
        }
      });

      // Audit log for task creation
      await prisma.activityLog.create({
        data: {
          projectId: project.id,
          taskId: task.id,
          userId: taskCreator.id,
          action: "CREATED"
        }
      });
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
