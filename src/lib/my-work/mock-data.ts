export const mockUser = {
  name: "Eric",
  email: "eric@example.com",
  avatar: "E",
};

export const mockStories = [
  {
    id: "1",
    title: "Créer le projet de base",
    subtasks: 3,
    completedSubtasks: 1,
    status: "In Progress",
    project: "Parent 360",
    tags: ["Web app", "Product"],
    number: "#31",
  },
  {
    id: "2",
    title: "Créer le projet de base",
    subtasks: 3,
    completedSubtasks: 0,
    status: "In Progress",
    project: "Parent 360",
    tags: ["Web app", "Product"],
    number: "#26",
  },
];

export const mockActivities = [
  {
    id: "1",
    type: "complete",
    content: "You marked Sub-task 3 as complete by moving it to the Standard Workflow with the state Done",
    time: "5:35 am",
  },
  {
    id: "2",
    type: "move",
    content: "You moved test2 to the Standard Workflow with the state Backlog",
    time: "4:51 am",
  },
  {
    id: "3",
    type: "start",
    content: "You marked Sub-task 3 as started by moving it to the Standard Workflow with the state In Progress",
    time: "4:51 am",
  },
  {
    id: "4",
    type: "start",
    content: "You marked Créer le projet de base as started by moving it to the Standard Workflow with the state In Progress",
    time: "4:51 am",
  },
  {
    id: "5",
    type: "start",
    content: "You marked Sub-task 2 as started by moving it to the Standard Workflow with the state In Progress",
    time: "4:51 am",
  },
];

export function getGreetingFr(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}
