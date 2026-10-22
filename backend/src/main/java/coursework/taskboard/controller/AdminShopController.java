package coursework.taskboard.controller;

import coursework.taskboard.dto.shop.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.shop.AdminAccentService;
import coursework.taskboard.service.shop.AdminAvatarService;
import coursework.taskboard.service.shop.AdminBackgroundService;
import coursework.taskboard.service.shop.AdminFrameService;
import coursework.taskboard.service.shop.AdminTreeService;
import coursework.taskboard.service.shop.AdminWeeklyRewardService;
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
    private final AdminBackgroundService adminBackgroundService;
    private final AdminTreeService adminTreeService;
    private final AdminWeeklyRewardService adminWeeklyRewardService;
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
            @RequestParam(value = "hexColorTertiary", required = false) String hexColorTertiary,
            @RequestParam(value = "isGradient", required = false) Boolean isGradient,
            @RequestParam(value = "isRare", required = false) Boolean isRare,
            @RequestParam("price") Integer price,
            @RequestParam(value = "oldPrice", required = false) Integer oldPrice,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "categoryIds", required = false) List<Long> categoryIds,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        checkAdmin();
        return ResponseEntity.ok(adminAccentService.createAccent(
                title, description, code, hexColor, hexColorSecondary, hexColorTertiary,
                isGradient, isRare, price, oldPrice, sortOrder, categoryIds, file
        ));
    }

    @PatchMapping(value = "/accents/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminAccentDto> updateAccent(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "hexColor", required = false) String hexColor,
            @RequestParam(value = "hexColorSecondary", required = false) String hexColorSecondary,
            @RequestParam(value = "hexColorTertiary", required = false) String hexColorTertiary,
            @RequestParam(value = "isGradient", required = false) Boolean isGradient,
            @RequestParam(value = "isRare", required = false) Boolean isRare,
            @RequestParam(value = "price", required = false) Integer price,
            @RequestParam(value = "oldPrice", required = false) Integer oldPrice,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "categoryIds", required = false) List<Long> categoryIds,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "clearImage", required = false) Boolean clearImage) {
        checkAdmin();
        return ResponseEntity.ok(adminAccentService.updateAccent(
                id, title, description, hexColor, hexColorSecondary, hexColorTertiary,
                isGradient, isRare, price, oldPrice, sortOrder, categoryIds, file, clearImage
        ));
    }

    @DeleteMapping("/accents/{id}")
    public ResponseEntity<Void> deleteAccent(@PathVariable Long id) {
        checkAdmin();
        adminAccentService.deleteAccent(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // BACKGROUNDS
    // ============================================================
    @GetMapping("/backgrounds")
    public ResponseEntity<List<AdminBackgroundDto>> listBackgrounds() {
        checkAdmin();
        return ResponseEntity.ok(adminBackgroundService.listBackgrounds());
    }

    @PostMapping(value = "/backgrounds", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminBackgroundDto> createBackground(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "cssClass", required = false) String cssClass,
            @RequestParam("price") Integer price,
            @RequestParam(value = "oldPrice", required = false) Integer oldPrice,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        checkAdmin();
        return ResponseEntity.ok(adminBackgroundService.createBackground(
                title, description, code, cssClass, price, oldPrice, sortOrder, file
        ));
    }

    @PatchMapping(value = "/backgrounds/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminBackgroundDto> updateBackground(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "cssClass", required = false) String cssClass,
            @RequestParam(value = "price", required = false) Integer price,
            @RequestParam(value = "oldPrice", required = false) Integer oldPrice,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "clearImage", required = false) Boolean clearImage) {
        checkAdmin();
        return ResponseEntity.ok(adminBackgroundService.updateBackground(
                id, title, description, cssClass, price, oldPrice, sortOrder, file, clearImage
        ));
    }

    @DeleteMapping("/backgrounds/{id}")
    public ResponseEntity<Void> deleteBackground(@PathVariable Long id) {
        checkAdmin();
        adminBackgroundService.deleteBackground(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // TREE CATEGORIES
    // ============================================================
    @GetMapping("/tree-categories")
    public ResponseEntity<List<CategoryDto>> listTreeCategories() {
        checkAdmin();
        return ResponseEntity.ok(adminTreeService.listCategories());
    }

    @PostMapping("/tree-categories")
    public ResponseEntity<CategoryDto> createTreeCategory(@RequestBody CategoryDto dto) {
        checkAdmin();
        return ResponseEntity.ok(adminTreeService.createCategory(dto.getCode(), dto.getTitle(), dto.getSortOrder()));
    }

    @PatchMapping("/tree-categories/{id}")
    public ResponseEntity<CategoryDto> updateTreeCategory(@PathVariable Long id, @RequestBody CategoryDto dto) {
        checkAdmin();
        return ResponseEntity.ok(adminTreeService.updateCategory(id, dto.getTitle(), dto.getSortOrder()));
    }

    @DeleteMapping("/tree-categories/{id}")
    public ResponseEntity<Void> deleteTreeCategory(@PathVariable Long id) {
        checkAdmin();
        adminTreeService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // TREES
    // ============================================================
    @GetMapping("/trees")
    public ResponseEntity<List<AdminTreeDto>> listTrees() {
        checkAdmin();
        return ResponseEntity.ok(adminTreeService.listTrees());
    }

    @PostMapping("/trees")
    public ResponseEntity<AdminTreeDto> createTree(@RequestBody AdminTreeRequest request) {
        checkAdmin();
        return ResponseEntity.ok(adminTreeService.createTree(request));
    }

    @PatchMapping("/trees/{id}")
    public ResponseEntity<AdminTreeDto> updateTree(@PathVariable Long id,
                                                   @RequestBody AdminTreeRequest request) {
        checkAdmin();
        return ResponseEntity.ok(adminTreeService.updateTree(id, request));
    }

    @DeleteMapping("/trees/{id}")
    public ResponseEntity<Void> deleteTree(@PathVariable Long id) {
        checkAdmin();
        adminTreeService.deleteTree(id);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // ПОДАРОК НЕДЕЛИ
    // ============================================================
    @GetMapping("/weekly-rewards")
    public ResponseEntity<List<AdminWeeklyRewardDto>> listWeeklyRewards() {
        checkAdmin();
        return ResponseEntity.ok(adminWeeklyRewardService.list());
    }

    @PostMapping("/weekly-rewards")
    public ResponseEntity<AdminWeeklyRewardDto> saveWeeklyReward(
            @RequestBody WeeklyRewardRequest request) {
        checkAdmin();
        return ResponseEntity.ok(adminWeeklyRewardService.save(request));
    }

    @DeleteMapping("/weekly-rewards/{id}")
    public ResponseEntity<Void> deleteWeeklyReward(@PathVariable Long id) {
        checkAdmin();
        adminWeeklyRewardService.delete(id);
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