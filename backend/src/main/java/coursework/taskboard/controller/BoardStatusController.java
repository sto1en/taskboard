package coursework.taskboard.controller;

import coursework.taskboard.dto.board.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.board.BoardStatusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards/{boardId}/statuses")
@RequiredArgsConstructor
public class BoardStatusController {

    private final BoardStatusService boardStatusService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<List<BoardStatusDto>> list(@PathVariable Long boardId,
                                                     @RequestParam(required = false) String scope) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(boardStatusService.list(boardId, scope, user));
    }

    @PostMapping
    public ResponseEntity<BoardStatusDto> create(@PathVariable Long boardId,
                                                 @Valid @RequestBody CreateStatusRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(boardStatusService.create(boardId, request, user));
    }

    @PatchMapping("/{statusId}")
    public ResponseEntity<BoardStatusDto> update(@PathVariable Long boardId,
                                                 @PathVariable Long statusId,
                                                 @RequestBody UpdateStatusRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(boardStatusService.update(boardId, statusId, request, user));
    }

    @DeleteMapping("/{statusId}")
    public ResponseEntity<Void> delete(@PathVariable Long boardId,
                                       @PathVariable Long statusId) {
        User user = currentUserService.getCurrentUser();
        boardStatusService.delete(boardId, statusId, user);
        return ResponseEntity.noContent().build();
    }
}