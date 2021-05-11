const express = require("express");
const multer  = require("multer");
const fs = require('fs');
const moment = require('moment');

const jsonParser = express.json();
const app = express();

app.use(express.static(__dirname + "/public"));

const dataPath = 'data.json';
const idPath = 'id.json';

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

app.use(express.static(__dirname));
app.use(multer({dest:"uploads"}).single("task-files"));

function readToJSON(path) {
    let data = fs.readFileSync(path, "utf8");
    return JSON.parse(data);
}

function writeToJSON(path, obj) {
    const data = JSON.stringify(obj, null, 2);
    fs.writeFileSync(path, data);
    return data;
}

app.get("/containers", function (req, res) {
    res.send(readToJSON(dataPath));
})

app.get("/download/:taskId/:filename", function(req, res) {
    let path = process.cwd() + "\\uploads\\" + req.params.filename;
    let taskId = req.params.taskId;
    let containers = readToJSON(dataPath);

    let originalName = containers
        .filter(container => container.tasks.filter(task => task.id === parseInt(taskId)).length > 0)[0]
        .tasks.filter(task => task.id === parseInt(taskId))[0].file.originalname;

    res.download(path, originalName);
});

app.post("/containers", jsonParser, function (req, res) {
    if (!req.body) return res.sendStatus(404);

    console.log("POST container");
    console.log(req.body);

    if (req.body.add === true) {
        let ids = readToJSON(idPath);

        ids.containerId = ids.containerId + 1;
        const containers = readToJSON(dataPath);
        containers.push(new Container(ids.containerId, `New container-${ids.containerId}`));

        writeToJSON(idPath, ids);
        res.send(writeToJSON(dataPath, containers));
    }
})

let lastFile;

app.post("/upload", function (req, res, next) {
    console.log(req.file);
    lastFile = req.file;
    next();
})

app.post("/containers/:id/tasks", jsonParser, function (req, res) {
    if (!req.body) return res.sendStatus(404);
    const containerId = req.params.id;
    let ids = readToJSON(idPath);
    let containers = readToJSON(dataPath);

    ids.taskId = ids.taskId + 1;
    if (req.body.name === "") {
        req.body.name = `New task-${ids.taskId}`;
    }
    if (req.body.expires === "") {
        req.body.expires = moment(new Date()).add(1, 'days').format('YYYY-MM-DDThh:mm');
    }

    containers
        .filter(value => value.id === parseInt(containerId))[0].tasks
        .push(new Task(ids.taskId, req.body.name, req.body.expires, req.body.description, lastFile));

    console.log("POST task");
    console.log(req.body);

    writeToJSON(idPath, ids);
    res.send(writeToJSON(dataPath, containers));
})

app.delete("/containers/:id", function (req, res) {
    const containerId = req.params.id;
    let containers = readToJSON(dataPath);

    containers = containers.filter(value => value.id !== parseInt(containerId, 10));

    res.send(writeToJSON(dataPath, containers));
})

app.delete("/containers/:id/tasks/:taskId", function (req, res) {
    const containerId = req.params.id;
    const taskId = req.params.taskId;
    let containers = readToJSON(dataPath);

    let container = containers.filter(value => value.id === parseInt(containerId))[0];
    container.tasks = container.tasks.filter(value => value.id !== parseInt(taskId));

    res.send(writeToJSON(dataPath, containers));
})

app.put("/containers/:id", jsonParser, function (req, res) {
    console.log("PUT container");
    console.log(req.body);

    const containerId = req.params.id;
    let containers = readToJSON(dataPath);

    let container = containers.filter(value => value.id === parseInt(containerId, 10))[0];
    if (container !== undefined) {
        container.name = req.body.name;
        container.isShowingComplete = req.body.isShowingComplete === true;
    }

    res.send(writeToJSON(dataPath, containers));
})

app.put("/containers/:id/tasks/:taskId", jsonParser, function (req, res) {
    console.log("PUT task");
    console.log(req.body);

    const containerId = req.params.id;
    const taskId = req.params.taskId;
    let containers = readToJSON(dataPath);

    let container = containers.filter(value => value.id === parseInt(containerId))[0];
    let task = container.tasks.filter(value => value.id === parseInt(taskId))[0];

    if (req.body.type === "edit") {
        task.name = req.body.name;
        task.expires = req.body.expires;
        task.description = req.body.description;
        task.isComplete = req.body.isComplete === true;
    } else if (req.body.type === "move") {
        container.tasks = container.tasks.filter(value => value.id !== parseInt(taskId));
        container = containers.filter(value => value.id === parseInt(req.body.containerId))[0];
        container.tasks.push(task);
    }

    res.send(writeToJSON(dataPath, containers));
})

app.listen(3000);