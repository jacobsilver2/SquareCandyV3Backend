// let's go!
const cookieParser = require('cookie-parser');
require('dotenv').config({path: 'variables.env'});
const createServer = require('./createServer');
const jwt = require('jsonwebtoken');
const db = require('./db');

const server = createServer();

//Use Express middleware to handle cookies
server.express.use(cookieParser());

//decode the JWT so we can get the user ID on each request
server.express.use((req, res, next) => {
    const {token} = req.cookies;
    if(token) {
        const { userId } = jwt.verify(token, process.env.APP_SECRET);
        //put the user id onto the request
        req.userId = userId;
    }
    next();
});


server.start({
    cors: {
        credentials: true,
        origin: process.env.FRONTEND_URL,
    }
}, deets => {
    console.log(`server is now running on port http://localhost:${deets.port}`)
});