require('dotenv').config();
const app = require('./src/app')
const {connectTodb} = require('./src/config/db')
const {sequelize} = require('./src/config/db')
require('./src/models');
const { startScheduler } = require('./src/services/scheduler.service');


async function start(){
  await connectTodb();
  await sequelize.sync();
  console.log('Tables synced');
  startScheduler();
  app.listen(3000, () => console.log('Server is running on port 3000'));
}

start().catch(err => console.error('Startup error:', err));