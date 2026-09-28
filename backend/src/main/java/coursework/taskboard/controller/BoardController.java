package coursework.taskboard.controller;

import coursework.taskboard.dto.board.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.board.BoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;
    private final CurrentUserService currentUserService;

    @PostMapping
    public ResponseEntity<BoardDto> create(@Valid @RequestBody CreateBoardRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(boardService.createBoard(user, request));
    }

    @GetMapping
    public ResponseEntity<List<BoardDto>> list() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(boardService.getUserBoards(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoardDetailDto> get(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(boardService.getBoard(id, user));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<BoardDto> update(@PathVariable Long id,
                                           @Valid @RequestBody UpdateBoardRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(boardService.updateBoard(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        boardService.deleteBoard(id, user);
        return ResponseEntity.noContent().build();
    }
}