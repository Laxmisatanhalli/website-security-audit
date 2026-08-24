const { User } = require('../models');
const jwt = require('jsonwebtoken');


async function authMiddleware(req, res, next){
  
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if(!token) {
        return res.status(401).json({ message: 'Unauthorized access, token is missing' 

        });
    } 
    try{
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
if (!user) {
  return res.status(401).json({ message: 'User not found' }); 
}

req.user = user;
return next();

    }catch(err) {
        return res.status(401).json({ message: 'Unauthorized access, invalid token' });
    }
}

async function authsystemUserMiddleware(req, res, next) {

    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
 
    
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access, token is missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.scope('withSystemUser').findByPk(decoded.id);

if (!user || !user.systemUser) {
  return res.status(403).json({ message: 'Forbidden: Access denied for non-system users' });
}
        req.user = user;
        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized access, invalid token' });
    }
}

module.exports = {authMiddleware, authsystemUserMiddleware};