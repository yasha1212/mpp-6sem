let socket;

function resolveContainers(data) {
    const containers = JSON.parse(data)
    reset();
    drawContainersRoot();
    document.forms["add-container"].addEventListener("submit", e => {
        e.preventDefault();
        createContainer().then();
    });
    drawContainers(containers);
}

function raiseConnection() {
    socket = io();

    socket.on('connect_error', function(err) {
        reset();
        drawAuthRoot();
        document.forms["auth"].addEventListener("submit", e => onSignIn(e));
    })

    socket.on("getContainers", data => resolveContainers(data));
}

async function responseRoutine(response) {
    if (response.ok === true) {
        raiseConnection();
        await fetchContainers();
    } else if (response.status === 401) {
        reset();
        drawAuthRoot();
        document.forms["auth"].addEventListener("submit", e => onSignIn(e));
    }
}

function onSignIn(e) {
    e.preventDefault();
    const form = document.forms["auth"];
    let user = {
        login: form.elements["login"].value,
        password: form.elements["password"].value
    };
    console.log(user);
    sendUser(user).then();
}

async function sendUser(user) {
    const response = await fetch('/auth', {
        method: "POST",
        headers: {"Accept": "application/json", "Content-Type": "application/json"},
        body: JSON.stringify(user)
    });
    await responseRoutine(response);
}

async function fetchContainers() {
    socket.emit("askContainers");
}

async function createContainer() {
    socket.emit("createContainer");
}

async function createTask(containerId, obj, file) {
    // console.log(file.files);
    // const formData = new FormData();
    // formData.append('task-files', file.files[0]);
    // await fetch(`/upload`, {
    //     method: "POST",
    //     body: formData
    // });
    socket.emit("createTask", containerId, obj);
}

async function deleteContainer(id) {
    socket.emit("deleteContainer", id);
}

async function deleteTask(containerId, taskId) {
    socket.emit("deleteTask", containerId, taskId);
}

async function editContainer(id, container) {
    socket.emit("editContainer", id, container);
}

async function editTask(containerId, taskId, task) {
    socket.emit("editTask", containerId, taskId, task);
}

function reset() {
    document.getElementById("root").innerHTML = "";
}

function onEditContainer(e, c) {
    e.preventDefault();
    const form = document.forms[`edit-container-${c.id}`];
    if (e.submitter.name === "delete-container") {
        deleteContainer(form.elements["delete-container"].value).then();
    } else if (e.submitter.name === "edit-container") {
        let obj = {
            name: form.elements["container-name"].value,
            isShowingComplete: form.elements["paper-switch"].checked
        };
        editContainer(form.elements["edit-container"].value, obj).then();
    }
}

function onAddTask(e, c) {
    e.preventDefault();
    const form = document.forms[`add-task-${c.id}`];
    let obj = {
        name: form.elements["task-name"].value,
        expires: form.elements["task-expires"].value,
        description: form.elements["task-description"].value
    };
    createTask(c.id, obj, form.elements["task-files"]).then();
}

function onEditTask(e, c, t) {
    e.preventDefault();
    const form = document.forms[`edit-task-${t.id}-of-${c.id}`];
    if (e.submitter.name === "delete-task") {
        deleteTask(c.id, t.id).then();
    } else if (e.submitter.name === "edit-task") {
        let obj = {
            type: "edit",
            name: form.elements["task-name"].value,
            expires: form.elements["task-expires"].value,
            description: form.elements["task-description"].value,
            isComplete: form.elements["paper-switch"].checked
        }
        editTask(c.id, t.id, obj).then();
    }
}

function onMoveTask(e, c, t) {
    e.preventDefault();
    const form = document.forms[`move-task-${t.id}-of-${c.id}`];
    let obj = {
        type: "move",
        containerId: form.elements["container"].value
    }
    editTask(c.id, t.id, obj).then();
}

function drawContainers(containers) {
    containers.forEach(c => {
        document.getElementById("containers").insertAdjacentHTML('beforeend', getContainer(c));
        document.forms[`edit-container-${c.id}`].addEventListener("submit", e => onEditContainer(e, c));
        document.forms[`add-task-${c.id}`].addEventListener("submit", e => onAddTask(e, c));
        c.tasks.forEach(t => {
            document.getElementById(`tasks-of-${c.id}`).insertAdjacentHTML('beforeend', getTask(containers, c, t));
            if (document.forms[`edit-task-${t.id}-of-${c.id}`] !== undefined)
                document.forms[`edit-task-${t.id}-of-${c.id}`].addEventListener("submit", e => onEditTask(e, c, t));
            if (document.forms[`move-task-${t.id}-of-${c.id}`] !== undefined)
                document.forms[`move-task-${t.id}-of-${c.id}`].addEventListener("submit", e => onMoveTask(e, c, t));
        });
    });
}

function drawContainersRoot() {
    document.getElementById("root").insertAdjacentHTML('beforeend', getContainersRoot());
}

function drawAuthRoot() {
    document.getElementById("root").insertAdjacentHTML('beforeend', getAuthRoot());
}

drawContainersRoot();

document.forms["add-container"].addEventListener("submit", e => {
    e.preventDefault();
    createContainer().then();
});

raiseConnection();

fetchContainers().then();