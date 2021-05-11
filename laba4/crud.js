const jwt = require('jsonwebtoken');
const moment = require('moment');
const rw = require('./jsonutil.js');

const dataPath = 'data.json';
const idPath = 'id.json';
const usersPath = 'users.json';

const tokenKey = '1a2b-3c4d-5e6f-7g8h';

class Container {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.tasks = [];
        this.isShowingComplete = true;
    }
}

class Task {
    constructor(id, name, expires, description, file) {
        this.id = id;
        this.name = name;
        this.expires = expires;
        this.description = description;
        this.isComplete = false;
        this.file = file;
    }
}

module.exports.onReadContainer = function(io) {
    // socket.emit("getContainers", JSON.stringify(rw.readToJSON(dataPath)))
    io.sockets.emit("getContainers", JSON.stringify(rw.readToJSON(dataPath)))
}

module.exports.onCreateContainer = function() {
    let ids = rw.readToJSON(idPath);

    ids.containerId = ids.containerId + 1;
    const containers = rw.readToJSON(dataPath);
    containers.push(new Container(ids.containerId, `New container-${ids.containerId}`));

    rw.writeToJSON(idPath, ids);
    rw.writeToJSON(dataPath, containers);
}

module.exports.onUpdateContainer = function(containerId, data) {
    let containers = rw.readToJSON(dataPath);

    let container = containers.filter(value => value.id === parseInt(containerId, 10))[0];
    if (container !== undefined) {
        container.name = data.name;
        container.isShowingComplete = data.isShowingComplete === true;
    }

    rw.writeToJSON(dataPath, containers);
}

module.exports.onDeleteContainer = function(containerId) {
    let containers = rw.readToJSON(dataPath);

    containers = containers.filter(value => value.id !== parseInt(containerId, 10));

    rw.writeToJSON(dataPath, containers);
}

module.exports.onCreateTask = function(containerId, data, lastFile) {
    let ids = rw.readToJSON(idPath);
    let containers = rw.readToJSON(dataPath);

    ids.taskId = ids.taskId + 1;
    if (data.name === "") {
        data.name = `New task-${ids.taskId}`;
    }
    if (data.expires === "") {
        data.expires = moment(new Date()).add(1, 'days').format('YYYY-MM-DDThh:mm');
    }

    containers
        .filter(value => value.id === parseInt(containerId))[0].tasks
        .push(new Task(ids.taskId, data.name, data.expires, data.description, lastFile));

    rw.writeToJSON(idPath, ids);
    rw.writeToJSON(dataPath, containers);
}

module.exports.onUpdateTask = function(containerId, taskId, data) {
    let containers = rw.readToJSON(dataPath);

    let container = containers.filter(value => value.id === parseInt(containerId))[0];
    let task = container.tasks.filter(value => value.id === parseInt(taskId))[0];

    if (data.type === "edit") {
        task.name = data.name;
        task.expires = data.expires;
        task.description = data.description;
        task.isComplete = data.isComplete === true;
    } else if (data.type === "move") {
        container.tasks = container.tasks.filter(value => value.id !== parseInt(taskId));
        container = containers.filter(value => value.id === parseInt(data.containerId))[0];
        container.tasks.push(task);
    }

    rw.writeToJSON(dataPath, containers);
}

module.exports.onDeleteTask = function(containerId, taskId) {
    let containers = rw.readToJSON(dataPath);

    let container = containers.filter(value => value.id === parseInt(containerId))[0];
    container.tasks = container.tasks.filter(value => value.id !== parseInt(taskId));

    rw.writeToJSON(dataPath, containers);
}

module.exports.onDownload = function(req, res) {
    let path = process.cwd() + "\\uploads\\" + req.params.filename;
    let taskId = req.params.taskId;
    let containers = rw.readToJSON(dataPath);

    let originalName = containers
        .filter(container => container.tasks.filter(task => task.id === parseInt(taskId)).length > 0)[0]
        .tasks.filter(task => task.id === parseInt(taskId))[0].file.originalname;

    res.download(path, originalName);
}

module.exports.onAuth = function(req, res) {
    console.log(req.body);
    let users = rw.readToJSON(usersPath);
    let user = users.find(u => u.login === req.body.login);
    if (user !== undefined && user.password === req.body.password) {
        let token = jwt.sign(req.body, tokenKey, {expiresIn: 60});
        res.cookie('token', token, {httpOnly: true});
        res.send(rw.readToJSON(dataPath));
    } else {
        res.status(401).json({message: 'Not authorized'});
    }
}

