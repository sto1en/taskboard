package coursework.taskboard.controller;

import coursework.taskboard.dto.shop.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.shop.AdminAccentService;
import coursework.taskboard.service.shop.AdminAvatarService;
import coursework.taskboard.service.shop.AdminFrameService;
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
    private final AdminFrameService adminFrameService;
    private final AdminAccentService adminAccentService;
    private final CurrentUserService currentUserService;

    // ============================================================
    // AVATAR CATEGORIES
    // ============================================================
    @GetMapping("/avatar-categories")
    public ResponseEntity<List<AvatarCategoryDto>> listAvatarCategories() {
        checkAdmin();
        return ResponseEntity.ok(adminAvatarService.listCategories());
    }

    @PostMapping("/avatar-categories")
    public ResponseEntity<AvatarCategoryDto> createAvatarCategory(@RequestBody AvatarCategoryDto dto) {
        checkAdmin();
        return ResponseEntity.ok(adminAvatarService.createCategory(dto));
    }

    @PatchMapping("/avatar-categories/{id}")
    public ResponseEntity<AvatarCategoryDto> updateAvatarCategory(@PathVariable Long id,
                                                                  @RequestBody AvatarCategoryDto dto) {
        checkAdmin();
        return ResponseEntity.ok(adminAvatarService.updateCategory(id, dto));
    }

    @DeleteMapping("/avatar-categories/{id}")
    public ResponseEntity<Void> deleteAvatarCategory(@PathVariable Long id) {
        checkAdmin();
        adminAvatarService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // AVATARS
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
            @RequestParam(value = "oldPrice", required = false) Integer oldPrice,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "categoryIds", required = false) List<Long> categoryIds,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        checkAdmin();
        return ResponseEntity.ok(adminAvatarService.createAvatar(
                title, description, code, emoji, price, oldPrice, sortOrder, categoryIds, file
        ));
    }

    @PatchMapping(value = "/avatars/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminAvatarDto> updateAvatar(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "emoji", required = false) String emoji,
            @RequestParam(value = "price", required = false) Integer price,
            @RequestParam(value = "oldPrice", required = false) Integer oldPrice,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "categoryIds", required = false) List<Long> categoryIds,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "clearImage", required = false) Boolean clearImage) {
        checkAdmin();
        return ResponseEntity.ok(adminAvatarService.updateAvatar(
                id, title, description, emoji, price, oldPrice, sortOrder, categoryIds, file, clearImage
        ));
    }

    @DeleteMapping("/avatars/{id}")
    public ResponseEntity<Void> deleteAvatar(@PathVariable Long id) {
        checkAdmin();
        adminAvatarService.deleteAvatar(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // FRAME CATEGORIES
    // ============================================================
    @GetMapping("/frame-categories")
    public ResponseEntity<List<CategoryDto>> listFrameCategories() {
        checkAdmin();
        return ResponseEntity.ok(adminFrameService.listCategories());
    }

    @PostMapping("/frame-categories")
    public ResponseEntity<CategoryDto> createFrameCategory(@RequestBody CategoryDto dto) {
        checkAdmin();
        return ResponseEntity.ok(adminFrameService.createCategory(dto.getCode(), dto.getTitle(), dto.getSortOrder()));
    }

    @PatchMapping("/frame-categories/{id}")
    public ResponseEntity<CategoryDto> updateFrameCategory(@PathVariable Long id, @RequestBody CategoryDto dto) {
        checkAdmin();
        return ResponseEntity.ok(adminFrameService.updateCategory(id, dto.getTitle(), dto.getSortOrder()));
    }

    @DeleteMapping("/frame-categories/{id}")
    public ResponseEntity<Void> deleteFrameCategory(@PathVariable Long id) {
        checkAdmin();
        adminFrameService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // FRAMES
    // ============================================================
    @GetMapping("/frames")
    public ResponseEntity<List<AdminFrameDto>> listFrames() {
        checkAdmin();
        return ResponseEntity.ok(adminFrameService.listFrames());
    }

    @PostMapping(value = "/frames", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminFrameDto> createFrame(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "cssClass", required = false) String cssClass,
            @RequestParam(value = "hexColor", required = false) String hexColor,
            @RequestParam("price") Integer price,
            @RequestParam(value = "oldPrice", required = false) Integer oldPrice,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "categoryIds", required = false) List<Long> categoryIds,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        checkAdmin();
        return ResponseEntity.ok(adminFrameService.createFrame(
                title, description, code, cssClass, hexColor, price, oldPrice, sortOrder, categoryIds, file
        ));
    }

    @PatchMapping(value = "/frames/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminFrameDto> updateFrame(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "cssClass", required = false) String cssClass,
            @RequestParam(value = "hexColor", required = false) String hexColor,
            @RequestParam(value = "price", required = false) Integer price,
            @RequestParam(value = "oldPrice", required = false) Integer oldPrice,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "categoryIds", required = false) List<Long> categoryIds,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "clearImage", required = false) Boolean clearImage) {
        checkAdmin();
        return ResponseEntity.ok(adminFrameService.updateFrame(
                id, title, description, cssClass, hexColor, price, oldPrice, sortOrder, categoryIds, file, clearImage
        ));
    }

    @DeleteMapping("/frames/{id}")
    public ResponseEntity<Void> deleteFrame(@PathVariable Long id) {
        checkAdmin();
        adminFrameService.deleteFrame(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // ACCENT CATEGORIES
    // ============================================================
    @GetMapping("/accent-categories")
    public ResponseEntity<List<CategoryDto>> listAccentCategories() {
        checkAdmin();
        return ResponseEntity.ok(adminAccentService.listCategories());
    }

    @PostMapping("/accent-categories")
    public ResponseEntity<CategoryDto> createAccentCategory(@RequestBody CategoryDto dto) {
        checkAdmin();
        return ResponseEntity.ok(adminAccentService.createCategory(dto.getCode(), dto.getTitle(), dto.getSortOrder()));
    }

    @PatchMapping("/accent-categories/{id}")
    public ResponseEntity<CategoryDto> updateAccentCategory(@PathVariable Long id, @RequestBody CategoryDto dto) {
        checkAdmin();
        return ResponseEntity.ok(adminAccentService.updateCategory(id, dto.getTitle(), dto.getSortOrder()));
    }

    @DeleteMapping("/accent-categories/{id}")
    public ResponseEntity<Void> deleteAccentCategory(@PathVariable Long id) {
        checkAdmin();
        adminAccentService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // ACCENTS
    // ============================================================
    @GetMapping("/accents")
    public ResponseEntity<List<AdminAccentDto>> listAccents() {
        checkAdmin();
        return ResponseEntity.ok(adminAccentService.listAccents());
    }

    @PostMapping(value = "/accents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminAccentDto> createAccent(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam("hexColor") String hexColor,
            @RequestParam(value = "hexColorSecondary", required = false) String hexColorSecondary,
            @RequestParam(value = "isGradient", required = false) Boolean isGradient,
            @RequestParam("price") Integer price,
            @RequestParam(value = "oldPrice", required = false) Integer oldPrice,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "categoryIds", required = false) List<Long> categoryIds,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        checkAdmin();
        return ResponseEntity.ok(adminAccentService.createAccent(
                title, description, code, hexColor, hexColorSecondary, isGradient,
                price, oldPrice, sortOrder, categoryIds, file
        ));
    }

    @PatchMapping(value = "/accents/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminAccentDto> updateAccent(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "hexColor", required = false) String hexColor,
            @RequestParam(value = "hexColorSecondary", required = false) String hexColorSecondary,
            @RequestParam(value = "isGradient", required = false) Boolean isGradient,
            @RequestParam(value = "price", required = false) Integer price,
            @RequestParam(value = "oldPrice", required = false) Integer oldPrice,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "categoryIds", required = false) List<Long> categoryIds,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "clearImage", required = false) Boolean clearImage) {
        checkAdmin();
        return ResponseEntity.ok(adminAccentService.updateAccent(
                id, title, description, hexColor, hexColorSecondary, isGradient,
                price, oldPrice, sortOrder, categoryIds, file, clearImage
        ));
    }

    @DeleteMapping("/accents/{id}")
    public ResponseEntity<Void> deleteAccent(@PathVariable Long id) {
        checkAdmin();
        adminAccentService.deleteAccent(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    private void checkAdmin() {
        User user = currentUserService.getCurrentUser();
        if (!Boolean.TRUE.equals(user.getIsAdmin())) {
            throw new IllegalArgumentException("Недостаточно прав");
        }
    }
}