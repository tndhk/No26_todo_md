import {
  TaskStatusSchema,
  TaskSchema,
  ProjectSchema,
  ProjectsArraySchema,
  ErrorResponseSchema,
  ApiValidationError,
  validateProjectsResponse,
  parseErrorResponse,
} from '@/lib/schemas';
import { z } from 'zod';

describe('lib/schemas', () => {
  describe('TaskStatusSchema', () => {
    it('should accept valid status: todo', () => {
      const result = TaskStatusSchema.safeParse('todo');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('todo');
      }
    });

    it('should accept valid status: doing', () => {
      const result = TaskStatusSchema.safeParse('doing');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('doing');
      }
    });

    it('should accept valid status: done', () => {
      const result = TaskStatusSchema.safeParse('done');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('done');
      }
    });

    it('should reject invalid status', () => {
      const result = TaskStatusSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });

    it('should reject empty string', () => {
      const result = TaskStatusSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject null', () => {
      const result = TaskStatusSchema.safeParse(null);
      expect(result.success).toBe(false);
    });
  });

  describe('TaskSchema', () => {
    const validTask = {
      id: 'test-1',
      content: 'Test Task',
      status: 'todo',
      rawLine: '- [ ] Test Task',
      lineNumber: 1,
      subtasks: [],
    };

    it('should accept valid task with minimal fields', () => {
      const result = TaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should accept task with optional dueDate', () => {
      const taskWithDueDate = {
        ...validTask,
        dueDate: '2025-12-25',
      };
      const result = TaskSchema.safeParse(taskWithDueDate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dueDate).toBe('2025-12-25');
      }
    });

    it('should accept task with optional parentId', () => {
      const taskWithParent = {
        ...validTask,
        parentId: 'test-0',
        parentContent: 'Parent Task',
      };
      const result = TaskSchema.safeParse(taskWithParent);
      expect(result.success).toBe(true);
    });

    it('should accept task with nested subtasks', () => {
      const taskWithSubtasks = {
        ...validTask,
        subtasks: [
          {
            id: 'test-2',
            content: 'Subtask',
            status: 'todo',
            rawLine: '    - [ ] Subtask',
            lineNumber: 2,
            parentId: 'test-1',
            parentContent: 'Test Task',
            subtasks: [],
          },
        ],
      };
      const result = TaskSchema.safeParse(taskWithSubtasks);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subtasks).toHaveLength(1);
      }
    });

    it('should accept deeply nested subtasks', () => {
      const deeplyNestedTask = {
        ...validTask,
        subtasks: [
          {
            id: 'test-2',
            content: 'Level 2',
            status: 'todo',
            rawLine: '    - [ ] Level 2',
            lineNumber: 2,
            subtasks: [
              {
                id: 'test-3',
                content: 'Level 3',
                status: 'todo',
                rawLine: '        - [ ] Level 3',
                lineNumber: 3,
                subtasks: [],
              },
            ],
          },
        ],
      };
      const result = TaskSchema.safeParse(deeplyNestedTask);
      expect(result.success).toBe(true);
    });

    it('should reject task without id', () => {
      const { id: _id, ...taskWithoutId } = validTask;
      const result = TaskSchema.safeParse(taskWithoutId);
      expect(result.success).toBe(false);
    });

    it('should reject task without content', () => {
      const { content: _content, ...taskWithoutContent } = validTask;
      const result = TaskSchema.safeParse(taskWithoutContent);
      expect(result.success).toBe(false);
    });

    it('should reject task without status', () => {
      const { status: _status, ...taskWithoutStatus } = validTask;
      const result = TaskSchema.safeParse(taskWithoutStatus);
      expect(result.success).toBe(false);
    });

    it('should reject task with invalid status', () => {
      const taskWithInvalidStatus = {
        ...validTask,
        status: 'invalid',
      };
      const result = TaskSchema.safeParse(taskWithInvalidStatus);
      expect(result.success).toBe(false);
    });

    it('should reject task without rawLine', () => {
      const { rawLine: _rawLine, ...taskWithoutRawLine } = validTask;
      const result = TaskSchema.safeParse(taskWithoutRawLine);
      expect(result.success).toBe(false);
    });

    it('should reject task without lineNumber', () => {
      const { lineNumber: _lineNumber, ...taskWithoutLineNumber } = validTask;
      const result = TaskSchema.safeParse(taskWithoutLineNumber);
      expect(result.success).toBe(false);
    });

    it('should reject task with zero lineNumber', () => {
      const taskWithZeroLine = {
        ...validTask,
        lineNumber: 0,
      };
      const result = TaskSchema.safeParse(taskWithZeroLine);
      expect(result.success).toBe(false);
    });

    it('should reject task with negative lineNumber', () => {
      const taskWithNegativeLine = {
        ...validTask,
        lineNumber: -1,
      };
      const result = TaskSchema.safeParse(taskWithNegativeLine);
      expect(result.success).toBe(false);
    });

    it('should reject task with non-integer lineNumber', () => {
      const taskWithFloatLine = {
        ...validTask,
        lineNumber: 1.5,
      };
      const result = TaskSchema.safeParse(taskWithFloatLine);
      expect(result.success).toBe(false);
    });

    it('should reject task with invalid subtasks array', () => {
      const taskWithInvalidSubtasks = {
        ...validTask,
        subtasks: [{ invalid: 'subtask' }],
      };
      const result = TaskSchema.safeParse(taskWithInvalidSubtasks);
      expect(result.success).toBe(false);
    });
  });

  describe('ProjectSchema', () => {
    const validProject = {
      id: 'test',
      title: 'Test Project',
      path: '/data/test.md',
      tasks: [
        {
          id: 'test-1',
          content: 'Task 1',
          status: 'todo',
          rawLine: '- [ ] Task 1',
          lineNumber: 1,
          subtasks: [],
        },
      ],
    };

    it('should accept valid project', () => {
      const result = ProjectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });

    it('should accept project with empty tasks array', () => {
      const emptyProject = {
        ...validProject,
        tasks: [],
      };
      const result = ProjectSchema.safeParse(emptyProject);
      expect(result.success).toBe(true);
    });

    it('should accept project with multiple tasks', () => {
      const multiTaskProject = {
        ...validProject,
        tasks: [
          {
            id: 'test-1',
            content: 'Task 1',
            status: 'todo',
            rawLine: '- [ ] Task 1',
            lineNumber: 1,
            subtasks: [],
          },
          {
            id: 'test-2',
            content: 'Task 2',
            status: 'doing',
            rawLine: '- [ ] Task 2',
            lineNumber: 2,
            subtasks: [],
          },
        ],
      };
      const result = ProjectSchema.safeParse(multiTaskProject);
      expect(result.success).toBe(true);
    });

    it('should reject project without id', () => {
      const { id: _id, ...projectWithoutId } = validProject;
      const result = ProjectSchema.safeParse(projectWithoutId);
      expect(result.success).toBe(false);
    });

    it('should reject project without title', () => {
      const { title: _title, ...projectWithoutTitle } = validProject;
      const result = ProjectSchema.safeParse(projectWithoutTitle);
      expect(result.success).toBe(false);
    });

    it('should reject project without path', () => {
      const { path: _path, ...projectWithoutPath } = validProject;
      const result = ProjectSchema.safeParse(projectWithoutPath);
      expect(result.success).toBe(false);
    });

    it('should reject project without tasks', () => {
      const { tasks: _tasks, ...projectWithoutTasks } = validProject;
      const result = ProjectSchema.safeParse(projectWithoutTasks);
      expect(result.success).toBe(false);
    });

    it('should reject project with invalid tasks', () => {
      const projectWithInvalidTasks = {
        ...validProject,
        tasks: [{ invalid: 'task' }],
      };
      const result = ProjectSchema.safeParse(projectWithInvalidTasks);
      expect(result.success).toBe(false);
    });
  });

  describe('ProjectsArraySchema', () => {
    const validProjects = [
      {
        id: 'test-1',
        title: 'Project 1',
        path: '/data/test-1.md',
        tasks: [],
      },
      {
        id: 'test-2',
        title: 'Project 2',
        path: '/data/test-2.md',
        tasks: [],
      },
    ];

    it('should accept array of valid projects', () => {
      const result = ProjectsArraySchema.safeParse(validProjects);
      expect(result.success).toBe(true);
    });

    it('should accept empty array', () => {
      const result = ProjectsArraySchema.safeParse([]);
      expect(result.success).toBe(true);
    });

    it('should reject non-array values', () => {
      const result = ProjectsArraySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject array with invalid projects', () => {
      const invalidProjects = [{ invalid: 'project' }];
      const result = ProjectsArraySchema.safeParse(invalidProjects);
      expect(result.success).toBe(false);
    });

    it('should reject if any project is invalid', () => {
      const mixedProjects = [
        validProjects[0],
        { invalid: 'project' },
      ];
      const result = ProjectsArraySchema.safeParse(mixedProjects);
      expect(result.success).toBe(false);
    });
  });

  describe('ErrorResponseSchema', () => {
    it('should accept valid error response', () => {
      const errorResponse = { error: 'Something went wrong' };
      const result = ErrorResponseSchema.safeParse(errorResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.error).toBe('Something went wrong');
      }
    });

    it('should accept error response with empty string', () => {
      const errorResponse = { error: '' };
      const result = ErrorResponseSchema.safeParse(errorResponse);
      expect(result.success).toBe(true);
    });

    it('should reject response without error field', () => {
      const response = { message: 'Error' };
      const result = ErrorResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });

    it('should reject response with non-string error', () => {
      const response = { error: 123 };
      const result = ErrorResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });

  describe('ApiValidationError', () => {
    it('should create error with formatted message', () => {
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'undefined',
          path: ['tasks', 0, 'content'],
          message: 'Required',
        },
        {
          code: z.ZodIssueCode.invalid_type,
          expected: 'string',
          received: 'number',
          path: ['title'],
          message: 'Invalid type',
        },
      ]);

      const error = new ApiValidationError(zodError);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ApiValidationError');
      expect(error.message).toContain('API response validation failed');
      expect(error.message).toContain('tasks.0.content: Required');
      expect(error.message).toContain('title: Invalid type');
      expect(error.issues).toEqual(zodError.issues);
    });

    it('should handle empty path in issues', () => {
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: [],
          message: 'Invalid data',
        },
      ]);

      const error = new ApiValidationError(zodError);

      expect(error.message).toContain(': Invalid data');
    });

    it('should store all issues', () => {
      const zodError = new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: ['field1'],
          message: 'Error 1',
        },
        {
          code: z.ZodIssueCode.custom,
          path: ['field2'],
          message: 'Error 2',
        },
        {
          code: z.ZodIssueCode.custom,
          path: ['field3'],
          message: 'Error 3',
        },
      ]);

      const error = new ApiValidationError(zodError);

      expect(error.issues).toHaveLength(3);
      expect(error.issues).toEqual(zodError.issues);
    });
  });

  describe('validateProjectsResponse', () => {
    const validData = [
      {
        id: 'test',
        title: 'Test Project',
        path: '/data/test.md',
        tasks: [],
      },
    ];

    it('should return data when validation succeeds', () => {
      const result = validateProjectsResponse(validData);
      expect(result).toEqual(validData);
    });

    it('should throw ApiValidationError when validation fails', () => {
      const invalidData = { invalid: 'data' };

      expect(() => validateProjectsResponse(invalidData)).toThrow(ApiValidationError);
    });

    it('should throw ApiValidationError with details', () => {
      const invalidData = [{ id: 'test' }]; // Missing required fields

      try {
        validateProjectsResponse(invalidData);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiValidationError);
        if (error instanceof ApiValidationError) {
          expect(error.issues.length).toBeGreaterThan(0);
        }
      }
    });

    it('should accept empty array', () => {
      const result = validateProjectsResponse([]);
      expect(result).toEqual([]);
    });

    it('should throw on null input', () => {
      expect(() => validateProjectsResponse(null)).toThrow(ApiValidationError);
    });

    it('should throw on undefined input', () => {
      expect(() => validateProjectsResponse(undefined)).toThrow(ApiValidationError);
    });
  });

  describe('parseErrorResponse', () => {
    it('should return validated error response on valid data', () => {
      const errorData = { error: 'Something went wrong' };
      const result = parseErrorResponse(errorData);

      expect(result).toEqual(errorData);
    });

    it('should return null on invalid data', () => {
      const invalidData = { message: 'Error' };
      const result = parseErrorResponse(invalidData);

      expect(result).toBeNull();
    });

    it('should return null on non-object data', () => {
      expect(parseErrorResponse('error')).toBeNull();
      expect(parseErrorResponse(123)).toBeNull();
      expect(parseErrorResponse(null)).toBeNull();
      expect(parseErrorResponse(undefined)).toBeNull();
    });

    it('should return null on array data', () => {
      const result = parseErrorResponse([{ error: 'Error' }]);
      expect(result).toBeNull();
    });
  });
});
