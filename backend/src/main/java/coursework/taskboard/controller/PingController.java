package coursework.taskboard.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PingController {

    @GetMapping("/ping")
    public Map<String, Object> ping() {
        return Map.of(
                "status", "ok",
                "message", "TaskBoard backend is running",
                "timestamp", System.currentTimeMillis()
        );
    }
}