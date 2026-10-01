package coursework.taskboard.controller;

import coursework.taskboard.dto.search.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.search.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;
    private final CurrentUserService currentUserService;

    // === Старый (dropdown) ===
    @GetMapping
    public ResponseEntity<SearchResultDto> global(@RequestParam String q) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(searchService.globalSearch(q, user));
    }

    // === Suggestions (новый) — быстрые результаты ===
    @GetMapping("/suggestions")
    public ResponseEntity<SearchSuggestionsDto> suggestions(@RequestParam String q) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(searchService.suggestions(q, user));
    }

    // === Полный фильтр + пагинация ===
    @GetMapping("/filter")
    public ResponseEntity<SearchFilteredResponseDto> filter(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<String> types,
            @RequestParam(required = false) List<Long> boardIds,
            @RequestParam(required = false) List<Long> projectIds,
            @RequestParam(required = false) List<Long> tagIds,
            @RequestParam(required = false) List<Long> statusIds,
            @RequestParam(required = false) List<Short> priorities,
            @RequestParam(required = false) Boolean hasDeadline,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User user = currentUserService.getCurrentUser();

        SearchFilterRequestDto f = new SearchFilterRequestDto();
        f.setQ(q);
        f.setTypes(types);
        f.setBoardIds(boardIds);
        f.setProjectIds(projectIds);
        f.setTagIds(tagIds);
        f.setStatusIds(statusIds);
        f.setPriorities(priorities);
        f.setHasDeadline(hasDeadline);
        f.setFrom(from);
        f.setTo(to);
        f.setPage(page);
        f.setSize(size);

        return ResponseEntity.ok(searchService.filter(f, user));
    }

    // === Старый — в проекте ===
    @GetMapping("/projects/{projectId}")
    public ResponseEntity<List<SearchItemDto>> inProject(@PathVariable Long projectId,
                                                         @RequestParam String q) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(searchService.searchInProject(projectId, q, user));
    }
}