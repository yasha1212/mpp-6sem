const express = require("express");
const http = require("http");
const multer  = require("multer");
const cookieParser = require('cookie-parser');
const cookies = require('cookie-parse');
const jwt = require('jsonwebtoken');
const crud = require('./crud.js');
const rw = require('./jsonutil.js');
const io = require("socket.io")({
    serveClient: true,
    cookie: true
});

const jsonParser = express.json();
const app = express();
const server = http.createServer(app);

app.use(express.static(__dirname + "/public"));

const usersPath = 'users.json';
const tokenKey = '1a2b-3c4d-5e6f-7g8h';

app.use(express.static(__dirname));
app.use(multer({dest:"uploads"}).single("task-files"));

io.use(function(socket, next) {
    // console.log("Is logged?" + logged);
    const token = cookies.parse(socket.handshake.headers.cookie).token;
    console.log("token ", token);
    let logged;
    try {
        let decoded = jwt.verify(token, tokenKey);
        let users = rw.readToJSON(usersPath);
        let user = users.find(u => u.login === decoded.login);
        logged = user !== undefined && user.password === decoded.password;
    } catch {
        logged = false;
    }
    if (logged) {
        next();
    } else {
        next(new Error('Authentication error'));
    }
})
.on('connection', function(socket) {
    console.log("connected");

    socket.on("askContainers", () => crud.onReadContainer(io));

    socket.on("createContainer", () => {
        crud.onCreateContainer(socket);
        crud.onReadContainer(io);
    })

    socket.on("deleteContainer", (id) => {
        crud.onDeleteContainer(id);
        crud.onReadContainer(io);
    })

    socket.on("editContainer", (id, data) => {
        crud.onUpdateContainer(id, data);
        crud.onReadContainer(io);
    })

    socket.on("createTask", (containerId, data) => {
        crud.onCreateTask(containerId, data);
        crud.onReadContainer(io);
    })

    socket.on("editTask", (containerId, taskId, data) => {
        crud.onUpdateTask(containerId, taskId, data);
        crud.onReadContainer(io);
    })

    socket.on("deleteTask", (containerId, taskId) => {
        crud.onDeleteTask(containerId, taskId);
        crud.onReadContainer(io);
    })
})

app.get("/download/:taskId/:filename", function(req, res) {
    if (!req.logged) return res.status(401).json({message: 'Not authorized'});
    crud.onDownload(req, res);
});

app.post("/auth", jsonParser, function (req, res) {
    crud.onAuth(req, res);
})

let lastFile;

app.post("/upload", function (req, res, next) {
    if (!req.logged) { return res.status(401).json({message: 'Not authorized'}); }
    console.log(req.file);
    lastFile = req.file;
    next();
})

io.attach(server);
server.listen(3000);