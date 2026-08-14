require('dotenv').config();
const app = require('./backend/app')
const {connectTodb} = require('./backend/config/db')
const {sequelize} = require('./backend/config/db')
require('./backend/models');


async function start(){
  await connectTodb();
  await sequelize.sync({ alter: true });
  console.log('Tables synced');
  app.listen(3000, () => console.log('Server is running on port 3000'));
}

start().catch(err => console.error('Startup error:', err));