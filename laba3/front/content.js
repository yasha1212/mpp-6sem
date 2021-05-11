function getAuthRoot() {
    return `<form name="auth">
                <div class="text-center">
                    <h2>Sign in</h2>
                </div>
                <div class="row flex-center">
                    <div class="form-group">
                        <label for="paperInputs1">Login</label>
                        <input type="text" id="paperInputs1" name="login">
                    </div>
                </div>
                <div class="row flex-center">
                    <div class="form-group">
                        <label for="paperInputs2">Password</label>
                        <input type="password" id="paperInputs2" name="password">
                    </div>
                </div>
                <div class="row flex-center">
                    <button>Submit</button>
                </div>
            </form>`
}

function getContainersRoot() {
    return `<div class="row flex-center">
                <form class="margin" name="add-container">
                    <button name="add" value="true">+ Add container</button>
                </form>
            </div>
            <div class="row flex-top" id="containers"></div>`
}

function getContainer(container) {
    return `<div class="paper container-xs margin">
                <h3>${container.name}</h3>
                <div id="tasks-of-${container.id}"></div>
                <div class="row flex-center">
                    <label class="paper-btn margin-right" for="modal-edit-${container.id}">Edit container</label>
                    <input class="modal-state" id="modal-edit-${container.id}" type="checkbox">
                    <div class="modal">
                        <label class="modal-bg" for="modal-edit-${container.id}"></label>
                        <div class="modal-body">
                            <label class="btn-close" for="modal-edit-${container.id}">X</label>
                            <h4 class="modal-title">Edit container</h4>
                            <form name="edit-container-${container.id}">
                                <div class="form-group">
                                    <label for="paperInputContainer${container.id}">Container name</label>
                                    <input type="text" placeholder="Container name" id="paperInputContainer${container.id}" name="container-name" value="${container.name}">
                                </div>
                                <fieldset class="form-group">
                                    <label for="paperSwitch${container.id}" class="paper-switch-label">Show completed?</label>
                                    <label class="paper-switch">
                                        <input id="paperSwitch${container.id}" name="paper-switch" type="checkbox" />
                                        <span class="paper-switch-slider round"></span>
                                    </label>
                                </fieldset>
                                <button class="btn-danger-outline margin" name="delete-container" value="${container.id}">Delete</button>
                                <button class="margin" name="edit-container" value="${container.id}">Accept</button>
                            </form>
                        </div>
                    </div>
                    <label class="paper-btn margin-left" for="modal-add-task-${container.id}">Add task</label>
                    <input class="modal-state" id="modal-add-task-${container.id}" type="checkbox">
                    <div class="modal">
                        <label class="modal-bg" for="modal-add-task-${container.id}"></label>
                        <div class="modal-body">
                            <label class="btn-close" for="modal-add-task-${container.id}">X</label>
                            <h4 class="modal-title">Add task</h4>
                            <form enctype="multipart/form-data" name="add-task-${container.id}">
                                <div class="form-group">
                                    <label for="paperInputTask${container.id}">Task name</label>
                                    <input type="text" placeholder="Task name" id="paperInputTask${container.id}" name="task-name">
                                </div>
                                <div class="form-group">
                                    <label for="paperDateTask${container.id}">Task expires</label>
                                    <input type="datetime-local" placeholder="Task expires" id="paperDateTask${container.id}" name="task-expires">
                                </div>
                                <div class="form-group">
                                    <label for="paperDescrTask${container.id}">Task description</label>
                                    <input type="text" placeholder="Task description" id="paperDescrTask${container.id}" name="task-description">
                                </div>
                                <div class="form-group">
                                    <label for="paperDescrTask${container.id}">Related files</label>
                                    <input type="file" id="paperFileTask${container.id}" name="task-files">
                                </div>
                                <button class="margin" name="add-task" value="${container.id}">Accept</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>`
}

function getTask(containers, container, task) {
    let cond = (container.isShowingComplete) ? true : !task.isComplete;
    if (!cond) {
        return "";
    }
    let dayDiff = (new Date(task.expires).getTime() - (new Date()).getTime()) / (1000 * 3600 * 24);
    let spanTag = "";
    if (task.isComplete) {
        spanTag = '<span class="badge success">Complete</span>';
    } else if (dayDiff > 0 && dayDiff < 1) {
        spanTag = '<span class="badge warning">Soon</span>';
    } else if (dayDiff <= 0) {
        spanTag = '<span class="badge danger">Expired</span>';
    }
    let expiredTag = "";
    if (!task.isComplete) {
        expiredTag = `<h5 class="card-subtitle">Expires: ${moment(new Date(task.expires)).format("DD.MM.YYYY HH:mm")}</h5>`;
    }
    let fileTag = "";
    if (task.file !== undefined) {
        fileTag = `<p class="card-text">Attached file: <a href="download/${task.id}/${task.file.filename}">${task.file.originalname}</a></p>`;
    }
    let options = "";
    for (let con of containers) {
        if (con.id === container.id) {
            options += `<option value="${con.id}" selected="selected">${con.name}</option>`;
        } else {
            options += `<option value="${con.id}">${con.name}</option>`
        }
    }
    return `<div class="card margin">
                <div class="card-body">
                    <h4 class="card-title">${task.name} ${spanTag}</h4>
                    ${expiredTag}
                    ${fileTag}
                    <p class="card-text">${task.description}</p>
                    <label class="paper-btn" for="modal-edit-task-${container.id}-${task.id}">Edit task</label>
                    <input class="modal-state" id="modal-edit-task-${container.id}-${task.id}" type="checkbox">
                    <div class="modal">
                        <label class="modal-bg" for="modal-edit-task-${container.id}-${task.id}"></label>
                        <div class="modal-body" style="height: 17rem;">
                            <label class="btn-close" for="modal-edit-task-${container.id}-${task.id}">X</label>
                            <h4 class="modal-title">Edit task</h4>
                            <form name="edit-task-${task.id}-of-${container.id}" style="width: 20rem;">
                                <div class="row flex-spaces flex-middle" style="height: 4rem;">
                                    <div class="form-group">
                                        <label for="paperInputTask${container.id}-${task.id}">Task name</label>
                                        <input style="width: 7rem;" type="text" placeholder="Task name" id="paperInputTask${container.id}-${task.id}" name="task-name" value="${task.name}">
                                    </div>
                                    <div class="form-group">
                                        <label for="paperDateTask${container.id}">Task expires</label>
                                        <input style="width: 10rem;" type="datetime-local" placeholder="Task expires" id="paperDateTask${container.id}-${task.id}" name="task-expires" value="${moment(new Date(task.expires)).format('YYYY-MM-DDTHH:mm')}">
                                    </div>
                                </div>
                                <div class="row flex-spaces flex-middle" style="height: 4rem;">
                                    <div class="form-group">
                                        <label for="paperDescrTask${container.id}-${task.id}">Task description</label>
                                        <input type="text" placeholder="Task description" id="paperDescrTask${container.id}-${task.id}" name="task-description" value="${task.description}">
                                    </div>
                                    <fieldset class="form-group" style="width: 8rem;">
                                        <label for="paperSwitch${container.id}-${task.id}" class="paper-switch-label">
                                            Task is complete
                                        </label>
                                        <label class="paper-switch">
                                            <input id="paperSwitch${container.id}-${task.id}" name="paper-switch" type="checkbox" />
                                            <span class="paper-switch-slider round"></span>
                                        </label>
                                    </fieldset>
                                </div>
                                <div class="row flex-spaces">
                                    <button class="btn-danger-outline" name="delete-task" value="${container.id}-${task.id}">Delete</button>
                                    <button name="edit-task" value="${container.id}-${task.id}">Accept</button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <label class="paper-btn" for="modal-move-task-${container.id}-${task.id}">Move task</label>
                    <input class="modal-state" id="modal-move-task-${container.id}-${task.id}" type="checkbox">
                    <div class="modal">
                        <label class="modal-bg" for="modal-move-task-${container.id}-${task.id}"></label>
                        <div class="modal-body">
                            <label class="btn-close" for="modal-move-task-${container.id}-${task.id}">X</label>
                            <h4 class="modal-title">Move task</h4>
                            <form name="move-task-${task.id}-of-${container.id}">
                                <div class="form-group">
                                    <label for="paperSelects">Select</label>
                                    <select id="paperSelects" name="container">
                                        ${options}
                                    </select>
                                </div>
                                <button name="move-task" value="${container.id}-${task.id}">Accept</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>`;
}