require('dotenv').config();
const app = require('./src/app')
const {connectTodb} = require('./src/config/db')
const {sequelize} = require('./src/config/db')
require('./src/models');


async function start(){
  await connectTodb();
  await sequelize.sync({ alter: true });
  console.log('Tables synced');
  app.listen(3000, () => console.log('Server is running on port 3000'));
}

start().catch(err => console.error('Startup error:', err));