package coursework.taskboard.controller;

import coursework.taskboard.dto.task.CreateTaskMessageRequest;
import coursework.taskboard.dto.task.TaskMessageDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.task.TaskMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/messages")
@RequiredArgsConstructor
public class TaskMessageController {

    private final TaskMessageService taskMessageService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<List<TaskMessageDto>> list(@PathVariable Long taskId) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(taskMessageService.list(taskId, user));
    }

    @PostMapping
    public ResponseEntity<TaskMessageDto> create(@PathVariable Long taskId,
                                                 @Valid @RequestBody CreateTaskMessageRequest req) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(taskMessageService.create(taskId, req, user));
    }

    @PatchMapping("/{messageId}")
    public ResponseEntity<TaskMessageDto> update(@PathVariable Long taskId,
                                                 @PathVariable Long messageId,
                                                 @Valid @RequestBody CreateTaskMessageRequest req) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(taskMessageService.update(messageId, req, user));
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> delete(@PathVariable Long taskId,
                                       @PathVariable Long messageId) {
        User user = currentUserService.getCurrentUser();
        taskMessageService.delete(messageId, user);
        return ResponseEntity.noContent().build();
    }
}