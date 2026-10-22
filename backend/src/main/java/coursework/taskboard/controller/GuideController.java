package coursework.taskboard.controller;

import coursework.taskboard.dto.template.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.template.GuideService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Гайды-проекты: готовые сценарии на неделю, месяц или свой период.
 */
@RestController
@RequestMapping("/api/guides")
@RequiredArgsConstructor
public class GuideController {

    private final GuideService guideService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<List<GuideDto>> list() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(guideService.list(user));
    }

    @GetMapping("/showcase")
    public ResponseEntity<List<GuideDto>> showcase() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(guideService.getShowcase(user));
    }

    @PutMapping("/showcase")
    public ResponseEntity<List<GuideDto>> saveShowcase(
            @Valid @RequestBody GuideShowcaseRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(guideService.saveShowcase(user, request.getGuideIds()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GuideDto> get(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(guideService.get(id, user));
    }

    @PostMapping
    public ResponseEntity<GuideDto> create(@Valid @RequestBody SaveGuideRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(guideService.create(request, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GuideDto> update(
            @PathVariable Long id,
            @Valid @RequestBody SaveGuideRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(guideService.update(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        guideService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<GuideDto> duplicate(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(guideService.duplicate(id, user));
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<ApplyPlanResultDto> apply(
            @PathVariable Long id,
            @Valid @RequestBody ApplyPlanRequest request) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(guideService.apply(id, request, user));
    }
}
