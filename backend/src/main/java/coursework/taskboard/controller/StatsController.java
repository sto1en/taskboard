package coursework.taskboard.controller;

import coursework.taskboard.dto.stats.StatsDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.stats.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<StatsDto> get(@RequestParam(defaultValue = "month") String period) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(statsService.getStats(period, user));
    }
}