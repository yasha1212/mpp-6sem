const express = require("express");
const http = require("http");
const multer  = require("multer");
const cookieParser = require('cookie-parser');
const cookies = require('cookie-parse');
const jwt = require('jsonwebtoken');
const crud = require('./crud.js');
const rw = require('./jsonutil.js');

let { graphqlHTTP } = require('express-graphql');
let { graphql, buildSchema } = require('graphql');

let schema = buildSchema(`
    input ContainerInput {
        name: String!
        isShowingComplete: Boolean!
    }
    
    input CreateTaskInput {
        name: String!
        expires: String
        description: String
    }
    
    input UpdateTaskInput {
        type: String!
        name: String!
        expires: String!
        description: String!
        isComplete: Boolean!
    }

    type Task {
        id: ID!
        name: String!
        expires: String
        description: String
        isComplete: Boolean!
        file: String
    }

    type Container {
        id: ID!
        name: String!
        tasks: [Task!]
        isShowingComplete: Boolean!
    }

    type Query {
        getContainers: [Container]
    }
    
    type Mutation {
        createContainer: [Container]
        updateContainer(id: ID!, container: ContainerInput!): [Container]
        deleteContainer(id: ID!): [Container]
        createTask(containerId: ID!, input: CreateTaskInput!, file: String): [Container]
        updateTask(containerId: ID!, taskId: ID!, input: UpdateTaskInput!): [Container]
        deleteTask(containerId: ID!, taskId: ID!): [Container]
    }
`);

let root = {
    getContainers: () => {
        return crud.onReadContainer();
    },
    createContainer: () => {
        crud.onCreateContainer();
        return crud.onReadContainer()
    },
    updateContainer: ({id, container}) => {
        crud.onUpdateContainer(id, container);
        return crud.onReadContainer()
    },
    deleteContainer: ({id}) => {
        crud.onDeleteContainer(id);
        return crud.onReadContainer();
    },

    createTask: ({containerId, input, file}) => {
        crud.onCreateTask(containerId, input, file);
        return crud.onReadContainer();
    },
    updateTask: ({containerId, taskId, input}) => {
        crud.onUpdateTask(containerId, taskId, input);
        return crud.onReadContainer();
    },
    deleteTask: ({containerId, taskId}) => {
        crud.onDeleteTask(containerId, taskId);
        return crud.onReadContainer();
    }
}
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

// app.use("/graphql", graphqlHTTP({
//     schema: schema,
//     rootValue: root,
//     graphiql: true
// }))
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

    socket.on("askContainers", (query) => {
        graphql(schema, query, root).then((response) => {
            socket.emit("getContainers", JSON.stringify(response.data.getContainers))
        });
    });

    socket.on("createContainer", (query) => {
        graphql(schema, query, root).then((response) => {
            socket.emit("getContainers", JSON.stringify(response.data.createContainer))
        });
    })

    socket.on("deleteContainer", (query, params) => {
        graphql(schema, query, root, null, params).then((response) => {
            socket.emit("getContainers", JSON.stringify(response.data.deleteContainer))
        });
    })

    socket.on("editContainer", (query, params) => {
        graphql(schema, query, root, null, params).then((response) => {
            socket.emit("getContainers", JSON.stringify(response.data.updateContainer))
        });
    })

    socket.on("createTask", (query, params) => {
        graphql(schema, query, root, null, params).then((response) => {
            socket.emit("getContainers", JSON.stringify(response.data.createTask))
        });
    })

    socket.on("editTask", (query, params) => {
        graphql(schema, query, root, null, params).then((response) => {
            socket.emit("getContainers", JSON.stringify(response.data.updateTask))
        });
    })

    socket.on("deleteTask", (query, params) => {
        graphql(schema, query, root, null, params).then((response) => {
            socket.emit("getContainers", JSON.stringify(response.data.deleteTask))
        });
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