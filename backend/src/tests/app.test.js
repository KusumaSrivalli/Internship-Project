const request = require('supertest');
const app = require('../src/app');

// Mock database
jest.mock('../src/models/db', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../src/socket', () => ({
  emitToBoard: jest.fn(),
  initSocket: jest.fn(),
}));

const db = require('../src/models/db');

describe('Auth Routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ id: 'uuid-1', email: 'test@test.com', username: 'testuser', avatar_color: '#6366f1' }]
      });

      const res = await request(app).post('/api/auth/signup').send({
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123'
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@test.com');
    });

    it('should reject signup with missing fields', async () => {
      const res = await request(app).post('/api/auth/signup').send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
    });

    it('should reject short passwords', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        email: 'test@test.com',
        username: 'testuser',
        password: '123'
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/6 characters/);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 for missing credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });

    it('should return 401 for invalid credentials', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).post('/api/auth/login').send({
        email: 'none@test.com',
        password: 'wrong'
      });
      expect(res.status).toBe(401);
    });
  });
});

describe('Health check', () => {
  it('should return ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Boards Routes', () => {
  it('should require authentication', async () => {
    const res = await request(app).get('/api/boards');
    expect(res.status).toBe(401);
  });
});