async function responseRoutine(response) {
    if (response.ok === true) {
        const containers = await response.json();
        reset();
        drawContainers(containers);
    }
}

async function fetchContainers() {
    const response = await fetch('/containers', {
        method: "GET",
        headers: {"Accept": "application/json"}
    });
    await responseRoutine(response);
}

async function createContainer() {
    const response = await fetch("/containers", {
        method: "POST",
        headers: {"Accept": "application/json", "Content-Type": "application/json"},
        body: JSON.stringify({
            add: true
        })
    });
    await responseRoutine(response);
}

async function createTask(containerId, obj, file) {
    console.log(file.files);
    const formData = new FormData();
    formData.append('task-files', file.files[0]);
    await fetch(`/upload`, {
        method: "POST",
        body: formData
    });
    const response = await fetch(`/containers/${containerId}/tasks`, {
        method: "POST",
        headers: {"Accept": "application/json", "Content-Type": "application/json"},
        body: JSON.stringify(obj)
    });
    await responseRoutine(response);
}

async function deleteContainer(id) {
    const response = await fetch("/containers/" + id, {
        method: "DELETE",
        headers: { "Accept": "application/json" }
    });
    await responseRoutine(response);
}

async function deleteTask(containerId, taskId) {
    const response = await fetch(`/containers/${containerId}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Accept": "application/json" }
    });
    await responseRoutine(response);
}

async function editContainer(id, container) {
    const response = await fetch("/containers/" + id, {
        method: "PUT",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(container)
    });
    await responseRoutine(response);
}

async function editTask(containerId, taskId, task) {
    const response = await fetch(`/containers/${containerId}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(task)
    });
    await responseRoutine(response);
}

function reset() {
    document.getElementById("containers").innerHTML = "";
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

document.forms["add-container"].addEventListener("submit", e => {
    e.preventDefault();
    createContainer().then();
});

fetchContainers().then();