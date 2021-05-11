function getContainersQuery() {
    return `
        query GetContainers {
            getContainers {
                id
                name
                tasks {
                    id
                    name
                    expires
                    description
                    isComplete
                    file
                }
                isShowingComplete
            }
        }`;
}

function createContainerQuery() {
    return `
        mutation CreateContainer {
          createContainer {
            id
            name
            tasks {
              id
              name
              expires
              description
              isComplete
              file
            }
            isShowingComplete
          }
        }`;
}

function deleteContainerQuery() {
    return `
        mutation DeleteContainer($id: ID!) {
          deleteContainer(id: $id) {
            id
            name
            tasks {
              id
              name
              expires
              description
              isComplete
              file
            }
            isShowingComplete
          }
        }`;
}

function updateContainerQuery() {
    return `
        mutation UpdateContainer($id: ID!, $container: ContainerInput!) {
          updateContainer(id: $id, container: $container) {
            id
            name
            tasks {
              id
              name
              expires
              description
              isComplete
              file
            }
            isShowingComplete
          }
        }`;
}

function createTaskQuery() {
    return `
        mutation CreateTask($containerId: ID!, $input: CreateTaskInput!, $file: String) {
          createTask(containerId: $containerId, input: $input, file: $file) {
            id
            name
            tasks {
              id
              name
              expires
              description
              isComplete
              file
            }
            isShowingComplete
          }
        }`;
}

function deleteTaskQuery() {
    return `
        mutation DeleteTask($containerId: ID!, $taskId: ID!) {
          deleteTask(containerId: $containerId, taskId: $taskId) {
            id
            name
            tasks {
              id
              name
              expires
              description
              isComplete
              file
            }
            isShowingComplete
          }
        }`;
}

function updateTaskQuery() {
    return `
        mutation UpdateTask($containerId: ID!, $taskId: ID!, $input: UpdateTaskInput!) {
          updateTask(containerId: $containerId, taskId: $taskId ,input: $input) {
            id
            name
            tasks {
              id
              name
              expires
              description
              isComplete
              file
            }
            isShowingComplete
          }
        }`;
}