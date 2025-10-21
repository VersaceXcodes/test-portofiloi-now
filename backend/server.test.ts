import request from 'supertest';
import { app, pool } from './server';
import jwt from 'jsonwebtoken';
import { createUserInputSchema, createProjectInputSchema } from './path/to/schemas';

// Mock database setup for tests
const testDB = {
  users: [],
  projects: [],
  contactMessages: [],
  // ... other test collections
};

// Setup test environment
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  
  // Clear test data
  testDB.users = [];
  testDB.projects = [];
  testDB.contactMessages = [];
});

afterAll(async () => {
  await pool.end();
});

// Helper functions for auth
const registerTestUser = async (userData) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: userData.email,
      password: 'password123',
      full_name: userData.name || 'Test User'
    });
  return response;
};

const loginTestUser = async (email, password) => {
  return request(app)
    .post('/api/auth/login')
    .send({ email, password });
};

// Tests start here
describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const response = await registerTestUser({
        email: 'test@example.com',
        name: 'Test User'
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user_id');
      expect(response.body.email).toBe('test@example.com');
    });

    test('should reject duplicate email', async () => {
      await registerTestUser({ email: 'duplicate@example.com' });
      const response = await registerTestUser({ email: 'duplicate@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/email already exists/i);
    });

    // Add more registration tests...
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      await registerTestUser({
        email: 'login@example.com',
        password: 'password123'
      });

      const response = await loginTestUser('login@example.com', 'password123');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    test('should reject invalid password', async () => {
      await registerTestUser({
        email: 'valid@example.com',
        password: 'correct123'
      });

      const response = await loginTestUser('valid@example.com', 'wrong-password');
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid credentials/i);
    });
  });
});

describe('Project API', () => {
  let authToken;

  beforeEach(async () => {
    // Register and login test user
    await registerTestUser({ email: 'project@example.com' });
    const login = await loginTestUser('project@example.com', 'password123');
    authToken = login.body.token;
  });

  test('POST /api/projects - should create a new project', async () => {
    const projectData = {
      title: 'Test Project',
      slug: 'test-project',
      featured_image: 'https://example.com/image.jpg',
      category: 'web',
      excerpt: 'This is a test project',
      content: 'Longer project content...',
      user_id: 'mock-user-id'
    };

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send(projectData);

    expect(response.status).toBe(201);
    expect(response.body.title).toBe(projectData.title);
    expect(response.body.user_id).toBe('mock-user-id');
  });

  test('GET /api/projects - should retrieve projects', async () => {
    // Add test data
    testDB.projects.push(
      { 
        project_id: 'proj1', 
        title: 'Project 1', 
        user_id: 'mock-user-id',
        slug: 'project-1',
        featured_image: 'image1.jpg',
        category: 'web'
      },
      { 
        project_id: 'proj2', 
        title: 'Project 2', 
        user_id: 'other-user',
        slug: 'project-2',
        featured_image: 'image2.jpg',
        category: 'mobile'
      }
    );

    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: 2
    });
  });

  // Add more project tests...
});

describe('Contact API', () => {
  test('POST /api/contact - should send a contact message', async () => {
    const messageData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, I have a question!'
    };

    const response = await request(app)
      .post('/api/contact')
      .send(messageData);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Message sent successfully');
    
    // Verify the message was saved
    const messages = testDB.contactMessages;
    expect(messages).toHaveLength(1);
    expect(messages[0].email).toBe(messageData.email);
  });

  test('POST /api/contact - should validate input', async () => {
    const response = await request(app)
      .post('/api/contact')
      .send({
        name: '',
        email: 'invalid-email',
        message: 'Hi'
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({ field: 'name' })
    );
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({ field: 'email' })
    );
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({ field: 'message' })
    );
  });
});

// Add more tests for other endpoints...