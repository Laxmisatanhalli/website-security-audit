require('dotenv').config();
const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
  }
)

async function connectTodb(){
  try{
    await sequelize.authenticate();
    console.log('mysql connected');

  }catch (err){
    console.log('error connecting: ',err)
  }
}
module.exports = { sequelize , connectTodb};