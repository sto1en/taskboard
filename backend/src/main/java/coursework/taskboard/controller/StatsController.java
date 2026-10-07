package coursework.taskboard.controller;

import coursework.taskboard.dto.stats.DailyLoadDto;
import coursework.taskboard.dto.stats.StatsDto;
import coursework.taskboard.dto.stats.StatsOverviewDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.stats.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

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

    @GetMapping("/overview")
    public ResponseEntity<StatsOverviewDto> overview(@RequestParam(defaultValue = "month") String period) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(statsService.getOverview(period, user));
    }

    @GetMapping("/daily-load")
    public ResponseEntity<List<DailyLoadDto>> dailyLoad(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(statsService.getDailyLoad(from, to, user));
    }
}