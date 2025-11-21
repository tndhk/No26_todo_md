# Markdown Todo

A modern task management application with **Supabase database** and **Markdown format support**. This app provides an intuitive interface for managing tasks and subtasks with multiple views for different workflows.

**Features:**
- 🗄️ Supabase database backend - persistent task storage with real-time sync
- 📝 Markdown-based editing - view and edit tasks as human-readable Markdown
- 🌳 Tree View - hierarchical task organization with drag-and-drop reordering
- 📅 Calendar View - tasks organized by due date for weekly planning
- ✅ Inline task editing - double-click to edit, auto-save on blur
- 🏷️ Due date support - plan tasks with deadline tracking
- 🔁 Recurring tasks - automatically recreate daily, weekly, or monthly tasks
- 📦 Subtask support - organize complex tasks into nested subtasks
- 🎨 Clean, modern UI - built with React and Next.js
- 🔄 Dual-mode storage - Supabase or file-based fallback

## Quick Start

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/tndhk/No26_todo_md.git
cd No26_todo_md

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── projects/
│   │       │   ├── route.ts                           # GET all projects
│   │       │   └── [projectId]/
│   │       │       ├── route.ts                       # GET/POST project
│   │       │       ├── raw/route.ts                   # GET/PUT Markdown content
│   │       │       └── tasks/
│   │       │           ├── route.ts                   # POST add task
│   │       │           ├── [lineNumber]/route.ts      # PUT/DELETE task
│   │       │           └── reorder/route.ts           # PUT reorder tasks
│   ├── page.tsx                    # Main application container
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   └── page.module.css            # Page-specific styles
├── components/
│   ├── TreeView.tsx               # Hierarchical task view with drag-and-drop
│   ├── WeeklyView.tsx             # Calendar/weekly task view
│   ├── MDView.tsx                 # Markdown editor view
│   ├── Sidebar.tsx                # Navigation sidebar
│   ├── AddTaskModal.tsx           # Task creation modal
│   └── *.module.css               # Component-specific styles
├── lib/
│   ├── types.ts                   # TypeScript type definitions
│   ├── markdown.ts                # Markdown parsing logic
│   ├── markdown-updater.ts        # Markdown file mutations (file-based mode)
│   ├── markdown-renderer.ts       # Markdown rendering from DB objects
│   ├── supabase-adapter.ts        # Supabase database operations
│   ├── supabase-client.ts         # Supabase client initialization
│   ├── api.ts                     # Frontend API utilities
│   ├── auth.ts                    # Authentication utilities
│   ├── security.ts                # Input validation and security
│   ├── config.ts                  # Application configuration
│   ├── logger.ts                  # Logging utilities
│   ├── monitoring.ts              # Performance monitoring
│   └── confetti.ts                # Celebration effect
├── data/
│   └── *.md                       # Fallback markdown files (file-based mode)
├── middleware.ts                  # NextAuth middleware
├── .env.local                      # Environment variables (see Configuration section)
└── package.json
```

## Storage Architecture

### Supabase Database Mode (Default)
When `USE_SUPABASE=true` is set, tasks are stored in a Supabase PostgreSQL database:
- **Projects table** - Stores project metadata (id, title, user_id)
- **Tasks table** - Stores individual tasks with hierarchy and status

Benefits:
- Real-time data persistence
- Multi-user support with authentication
- Scalable for production deployments
- Automatic backups

### File-based Mode (Fallback)
When `USE_SUPABASE` is not set or false, tasks are stored as Markdown files in the `data/` directory:
- Simple text files for easy version control
- Portable and human-readable
- Works offline without database setup
- Good for single-user local development

## Data Format

Tasks can be viewed and edited as Markdown:

```markdown
# My Project Title

## Todo
- [ ] Buy groceries #due:2025-11-23
- [ ] Take vitamins #due:2025-11-20 #repeat:daily
- [ ] Read a book
    - [ ] Chapter 1 #due:2025-11-20
    - [ ] Chapter 2 #due:2025-11-21
- [ ] Weekly team meeting #due:2025-11-22 #repeat:weekly

## Doing
- [ ] Implement feature

## Done
- [x] Setup project #due:2025-11-19
```

**Format Rules:**
- Tasks use checkboxes: `[ ]` (incomplete) or `[x]` (complete)
- Due dates: `#due:YYYY-MM-DD` (inline tag)
- Repeat frequency: `#repeat:daily`, `#repeat:weekly`, or `#repeat:monthly` (inline tag)
- Nesting: 4 spaces per indentation level
- Status sections are optional and auto-created

### Markdown View
The Markdown View allows you to edit the entire project as raw Markdown text. Changes are automatically parsed and synced to the database:
1. Click the "Markdown" tab to open the Markdown editor
2. Edit tasks in Markdown format
3. Changes auto-save (with debounce) to the database
4. Markdown is re-rendered and synced to the tree structure

## Usage

### Tree View
- **Double-click** task content to edit
- **Click checkbox** to toggle completion
- **Drag handle** (⋮⋮) to reorder tasks
- **Edit button** (✏️) to open edit mode
- **Plus button** (+) to add subtasks
- **Trash button** (🗑️) to delete tasks

### Calendar View
- View tasks organized by due date
- **Drag tasks** between dates to reschedule
- Parent task name displayed above subtasks
- Navigate weeks with arrow buttons

### Adding Tasks
1. Click "Add Task" button in Tree View
2. Or right-click a task and select "Add Subtask"
3. Fill in task name and optional due date
4. Optionally select repeat frequency (None, Daily, Weekly, Monthly)
5. Click "Add" to save

### Recurring Tasks
- Set repeat frequency when creating or editing tasks
- When a recurring task is marked complete:
  - Current task is checked off as done
  - New task is automatically created with next due date
  - Daily: +1 day, Weekly: +7 days, Monthly: +1 month
- Recurring tasks display 🔁 badge with frequency

## Technology Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **dnd-kit** - Drag-and-drop functionality
- **Lucide React** - Icon library
- **CSS Modules** - Component scoping

## Configuration

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

#### Supabase Configuration (Optional)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
USE_SUPABASE=true
```

#### NextAuth Configuration
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

Set `USE_SUPABASE=false` or omit it to use file-based storage mode.

## API Endpoints

All API endpoints use the v1 routing structure.

### Projects

#### GET /api/v1/projects
Returns all projects with their tasks.

```bash
curl http://localhost:3000/api/v1/projects
```

#### POST /api/v1/projects
Create a new project.

```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Project"
  }'
```

### Markdown View

#### GET /api/v1/projects/[projectId]/raw
Returns the project as rendered Markdown content.

```bash
curl http://localhost:3000/api/v1/projects/sample_project_1/raw
```

#### PUT /api/v1/projects/[projectId]/raw
Updates the project by parsing Markdown content. All tasks are synced from the provided Markdown.

```bash
curl -X PUT http://localhost:3000/api/v1/projects/sample_project_1/raw \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# My Project\n\n## Todo\n- [ ] Task 1\n"
  }'
```

### Tasks

#### POST /api/v1/projects/[projectId]/tasks
Add a new task to a project.

```bash
curl -X POST http://localhost:3000/api/v1/projects/sample_project_1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "content": "New task",
    "status": "todo",
    "dueDate": "2025-12-31",
    "parentLineNumber": 2,
    "repeatFrequency": "weekly"
  }'
```

**Parameters:**
- `content` (string, required) - Task content
- `status` (string) - 'todo', 'doing', or 'done' (default: 'todo')
- `dueDate` (string) - Due date in YYYY-MM-DD format
- `parentLineNumber` (number) - Line number of parent task for subtasks
- `repeatFrequency` (string) - 'daily', 'weekly', or 'monthly'

#### PUT /api/v1/projects/[projectId]/tasks/[lineNumber]
Update a task.

```bash
curl -X PUT http://localhost:3000/api/v1/projects/sample_project_1/tasks/2 \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated task",
    "status": "done",
    "dueDate": "2025-12-31",
    "repeatFrequency": "daily"
  }'
```

#### DELETE /api/v1/projects/[projectId]/tasks/[lineNumber]
Delete a task and all its subtasks.

```bash
curl -X DELETE http://localhost:3000/api/v1/projects/sample_project_1/tasks/2
```

#### PUT /api/v1/projects/[projectId]/tasks/reorder
Reorder tasks (drag-and-drop).

```bash
curl -X PUT http://localhost:3000/api/v1/projects/sample_project_1/tasks/reorder \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"id": "task-1", "subtasks": []},
      {"id": "task-2", "subtasks": []}
    ]
  }'
```

## Development

### Code Style
- TypeScript for type safety
- CSS Modules for style isolation
- Component-based architecture
- Functional components with hooks

### Building
```bash
npm run build
npm run lint
```

### File Conventions
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Styles: `*.module.css`
- Types: `types.ts`

## Deployment

### Vercel Deployment

This application is optimized for Vercel serverless deployment:

1. **Set environment variables** on Vercel:
   - All Supabase credentials (NEXT_PUBLIC_SUPABASE_URL, etc.)
   - NextAuth credentials
   - `USE_SUPABASE=true` to enable database mode

2. **Database setup**:
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the migration scripts to create `projects` and `tasks` tables
   - Set the service role key in environment variables

3. **File system considerations**:
   - Vercel's serverless environment has read-only filesystem
   - File-based storage mode will not persist data on Vercel
   - Always use `USE_SUPABASE=true` in production

### Local Development

For local development, you can use either storage mode:

**With Supabase:**
```bash
# Set up .env.local with Supabase credentials
USE_SUPABASE=true
npm run dev
```

**With file-based storage (no Supabase):**
```bash
# No Supabase variables needed
npm run dev
```

## Troubleshooting

### Tasks not saving?
- If using Supabase mode, check that all Supabase environment variables are set
- Check browser console for API errors
- Verify that the Supabase project is accessible
- Ensure `data/` directory exists and is writable if using file-based mode

### Markdown View showing errors?
- Ensure task IDs are properly formatted
- Check that parent-child relationships are valid
- Verify markdown syntax before saving

### View not updating?
- Try refreshing the page
- Check that due dates are in `YYYY-MM-DD` format
- Ensure proper markdown indentation (4 spaces per level)
- If using Supabase, verify database connection

### Supabase connection issues?
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correctly set
- Verify Supabase project is active and accessible
- Check network tab in developer tools for failed API calls
- Ensure `USE_SUPABASE=true` environment variable is set

## Contributing

Feel free to submit issues and pull requests to improve the application.

## License

This project is open source and available under the MIT License.
