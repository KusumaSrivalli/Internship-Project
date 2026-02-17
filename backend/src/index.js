require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  logger.info(`TaskFlow server running on port ${PORT}`);
});

module.exports = server;