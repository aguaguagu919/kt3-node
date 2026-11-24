const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');

const app = express();

app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blog Platform API (KT03)',
      version: '1.0.0',
      description: 'REST API для управления пользователями, постами и тегами на базе Prisma ORM',
    },
    servers: [
      {
        url: `http://localhost:${config.port || 3000}`,
        description: 'Локальный сервер',
      },
    ],
  },
  apis: ['./src/routes/users.js', './src/routes/posts.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.use(errorHandler);

const PORT = config.port || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📄 Swagger UI доступен по адресу: http://localhost:${PORT}/api-docs`);
});
