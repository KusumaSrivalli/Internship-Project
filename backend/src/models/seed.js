require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash('demo1234', 10);

    // Create demo users
    const { rows: [alice] } = await client.query(`
      INSERT INTO users (email, username, password_hash, avatar_color)
      VALUES ('alice@demo.com', 'alice', $1, '#6366f1')
      ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
      RETURNING id
    `, [passwordHash]);

    const { rows: [bob] } = await client.query(`
      INSERT INTO users (email, username, password_hash, avatar_color)
      VALUES ('bob@demo.com', 'bob', $1, '#ec4899')
      ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
      RETURNING id
    `, [passwordHash]);

    // Create a board
    const { rows: [board] } = await client.query(`
      INSERT INTO boards (title, description, owner_id, color)
      VALUES ('Product Roadmap', 'Main product development board', $1, '#6366f1')
      RETURNING id
    `, [alice.id]);

    // Add members
    await client.query(`
      INSERT INTO board_members (board_id, user_id, role)
      VALUES ($1, $2, 'owner'), ($1, $3, 'member')
      ON CONFLICT DO NOTHING
    `, [board.id, alice.id, bob.id]);

    // Create lists
    const lists = ['Backlog', 'In Progress', 'Review', 'Done'];
    const listIds = [];
    for (let i = 0; i < lists.length; i++) {
      const { rows: [list] } = await client.query(`
        INSERT INTO lists (title, board_id, position) VALUES ($1, $2, $3) RETURNING id
      `, [lists[i], board.id, i]);
      listIds.push(list.id);
    }

    // Create tasks
    const tasks = [
      { title: 'Design system setup', list: 0, priority: 'high', desc: 'Configure Tailwind and component library' },
      { title: 'User authentication flow', list: 0, priority: 'urgent', desc: 'JWT-based auth with refresh tokens' },
      { title: 'Database schema design', list: 1, priority: 'high', desc: 'ERD and migration scripts' },
      { title: 'WebSocket integration', list: 1, priority: 'medium', desc: 'Real-time updates via Socket.io' },
      { title: 'Drag and drop UI', list: 2, priority: 'medium', desc: 'Using @hello-pangea/dnd' },
      { title: 'API documentation', list: 3, priority: 'low', desc: 'OpenAPI/Swagger docs' },
    ];

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const { rows: [task] } = await client.query(`
        INSERT INTO tasks (title, description, list_id, board_id, position, priority, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
      `, [t.title, t.desc, listIds[t.list], board.id, i, t.priority, alice.id]);

      if (i % 2 === 0) {
        await client.query(`
          INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING
        `, [task.id, alice.id]);
      } else {
        await client.query(`
          INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING
        `, [task.id, bob.id]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Seed completed. Demo credentials:');
    console.log('   alice@demo.com / demo1234');
    console.log('   bob@demo.com / demo1234');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
  } finally {
    client.release();
    pool.end();
  }
};

seed();