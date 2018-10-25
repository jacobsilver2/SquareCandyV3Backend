// let's go!
const cookieParser = require('cookie-parser');
require('dotenv').config({path: 'variables.env'});
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

//Use Express middleware to handle cookies
server.express.use(cookieParser());
//Todo Use Express to populate current user

server.start({
    cors: {
        credentials: true,
        origin: process.env.FRONTEND_URL,
    }
}, deets => {
    console.log(`server is now running on port http://localhost:${deets.port}`)
});