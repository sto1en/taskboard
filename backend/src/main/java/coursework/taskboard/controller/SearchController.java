package coursework.taskboard.controller;

import coursework.taskboard.dto.search.SearchItemDto;
import coursework.taskboard.dto.search.SearchResultDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.search.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<SearchResultDto> global(@RequestParam String q) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(searchService.globalSearch(q, user));
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<List<SearchItemDto>> inProject(@PathVariable Long projectId,
                                                         @RequestParam String q) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(searchService.searchInProject(projectId, q, user));
    }
}