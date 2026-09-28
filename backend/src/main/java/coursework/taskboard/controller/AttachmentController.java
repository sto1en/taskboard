package coursework.taskboard.controller;

import coursework.taskboard.dto.attachment.AttachmentDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.attachment.AttachmentService;
import coursework.taskboard.service.auth.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final CurrentUserService currentUserService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentDto> upload(@RequestParam("file") MultipartFile file)
            throws IOException {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(attachmentService.upload(file, user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AttachmentDto> get(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(attachmentService.getById(id, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = currentUserService.getCurrentUser();
        attachmentService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}