class WebSocketService {
    constructor() {
        this.sockets = {};
        this.listeners = {};
    }

    connectNotifications(userId, onNotification) {
        const ws = new WebSocket(`ws://localhost:8000/ws/notifications/`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'notification') {
                onNotification(data);
            }
        };

        ws.onclose = () => {
            setTimeout(() => this.connectNotifications(userId, onNotification), 3000);
        };

        this.sockets.notifications = ws;
        return ws;
    }

    connectComments(projectId, onNewComment) {
        const ws = new WebSocket(`ws://localhost:8000/ws/comments/${projectId}/`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'new_comment') {
                onNewComment(data.comment);
            }
        };

        this.sockets[`comments_${projectId}`] = ws;
        return ws;
    }

    connectTasks(projectId, onTaskUpdate) {
        const ws = new WebSocket(`ws://localhost:8000/ws/tasks/${projectId}/`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'task_updated') {
                onTaskUpdate(data.task);
            }
        };

        this.sockets[`tasks_${projectId}`] = ws;
        return ws;
    }

    sendTaskUpdate(projectId, taskId, status) {
        const ws = this.sockets[`tasks_${projectId}`];
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'task_update',
                task_id: taskId,
                status: status
            }));
        }
    }

    disconnect(room) {
        if (this.sockets[room]) {
            this.sockets[room].close();
            delete this.sockets[room];
        }
    }
}

export default new WebSocketService();