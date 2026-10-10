package coursework.taskboard.controller;

import coursework.taskboard.dto.board.AddBoardMemberRequest;
import coursework.taskboard.dto.board.BoardMemberDto;
import coursework.taskboard.dto.board.UpdateBoardMemberRequest;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.board.BoardMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards/{boardId}/members")
@RequiredArgsConstructor
public class BoardMemberController {

    private final BoardMemberService boardMemberService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<List<BoardMemberDto>> list(@PathVariable Long boardId) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(boardMemberService.list(boardId, user));
    }

    @PostMapping
    public ResponseEntity<BoardMemberDto> add(@PathVariable Long boardId,
                                              @Valid @RequestBody AddBoardMemberRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(boardMemberService.add(boardId, request, user));
    }

    @PatchMapping("/{userId}")
    public ResponseEntity<BoardMemberDto> update(@PathVariable Long boardId,
                                                 @PathVariable Long userId,
                                                 @Valid @RequestBody UpdateBoardMemberRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(boardMemberService.update(boardId, userId, request, user));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> remove(@PathVariable Long boardId,
                                       @PathVariable Long userId) {
        User user = currentUserService.getCurrentUser();
        boardMemberService.remove(boardId, userId, user);
        return ResponseEntity.noContent().build();
    }
}