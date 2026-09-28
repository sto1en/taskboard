package coursework.taskboard.controller;

import coursework.taskboard.dto.tag.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.tag.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;
    private final CurrentUserService currentUserService;

    // Список тегов доски
    @GetMapping("/boards/{boardId}/tags")
    public ResponseEntity<List<TagDto>> list(@PathVariable Long boardId) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(tagService.getBoardTags(boardId, user));
    }

    // Поиск тегов (autocomplete)
    @GetMapping("/boards/{boardId}/tags/search")
    public ResponseEntity<List<TagDto>> search(@PathVariable Long boardId,
                                               @RequestParam(required = false) String q) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(tagService.searchTags(boardId, q, user));
    }

    // Создать тег
    @PostMapping("/boards/{boardId}/tags")
    public ResponseEntity<TagDto> create(@PathVariable Long boardId,
                                         @Valid @RequestBody CreateTagRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(tagService.createTag(boardId, request, user));
    }

    // Обновить тег
    @PatchMapping("/tags/{id}")
    public ResponseEntity<TagDto> update(@PathVariable Long id,
                                         @Valid @RequestBody UpdateTagRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(tagService.updateTag(id, request, user));
    }

    // Удалить тег
    @DeleteMapping("/tags/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        tagService.deleteTag(id, user);
        return ResponseEntity.noContent().build();
    }
}