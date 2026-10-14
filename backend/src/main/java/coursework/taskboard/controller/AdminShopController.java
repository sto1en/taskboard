package coursework.taskboard.controller;

import coursework.taskboard.dto.shop.AdminAvatarDto;
import coursework.taskboard.dto.shop.AvatarCategoryDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.shop.AdminAvatarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/shop")
@RequiredArgsConstructor
public class AdminShopController {

    private final AdminAvatarService adminAvatarService;
    private final CurrentUserService currentUserService;

    // ============================================================
    // Категории аватарок
    // ============================================================

    @GetMapping("/avatar-categories")
    public ResponseEntity<List<AvatarCategoryDto>> listCategories() {
        checkAdmin();
        return ResponseEntity.ok(adminAvatarService.listCategories());
    }

    @PostMapping("/avatar-categories")
    public ResponseEntity<AvatarCategoryDto> createCategory(@RequestBody AvatarCategoryDto dto) {
        checkAdmin();
        return ResponseEntity.ok(adminAvatarService.createCategory(dto));
    }

    @PatchMapping("/avatar-categories/{id}")
    public ResponseEntity<AvatarCategoryDto> updateCategory(@PathVariable Long id,
                                                            @RequestBody AvatarCategoryDto dto) {
        checkAdmin();
        return ResponseEntity.ok(adminAvatarService.updateCategory(id, dto));
    }

    @DeleteMapping("/avatar-categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        checkAdmin();
        adminAvatarService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // Аватарки
    // ============================================================

    @GetMapping("/avatars")
    public ResponseEntity<List<AdminAvatarDto>> listAvatars() {
        checkAdmin();
        return ResponseEntity.ok(adminAvatarService.listAvatars());
    }

    @PostMapping(value = "/avatars", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminAvatarDto> createAvatar(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "emoji", required = false) String emoji,
            @RequestParam("price") Integer price,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        checkAdmin();
        return ResponseEntity.ok(adminAvatarService.createAvatar(
                title, description, code, emoji, price, sortOrder, categoryId, file
        ));
    }

    @PatchMapping(value = "/avatars/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminAvatarDto> updateAvatar(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "emoji", required = false) String emoji,
            @RequestParam(value = "price", required = false) Integer price,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "clearImage", required = false) Boolean clearImage) {
        checkAdmin();
        return ResponseEntity.ok(adminAvatarService.updateAvatar(
                id, title, description, emoji, price, sortOrder, categoryId, file, clearImage
        ));
    }

    @DeleteMapping("/avatars/{id}")
    public ResponseEntity<Void> deleteAvatar(@PathVariable Long id) {
        checkAdmin();
        adminAvatarService.deleteAvatar(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // Проверка, что запрос от админа
    // ============================================================
    private void checkAdmin() {
        User user = currentUserService.getCurrentUser();
        if (!Boolean.TRUE.equals(user.getIsAdmin())) {
            throw new IllegalArgumentException("Недостаточно прав");
        }
    }
}