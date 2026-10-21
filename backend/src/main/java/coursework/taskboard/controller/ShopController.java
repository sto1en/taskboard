package coursework.taskboard.controller;

import coursework.taskboard.dto.shop.CategoryDto;
import coursework.taskboard.dto.shop.ChestOpenResultDto;
import coursework.taskboard.dto.shop.ChestsDto;
import coursework.taskboard.dto.shop.UserShopDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.shop.ChestService;
import coursework.taskboard.service.shop.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;
    private final ChestService chestService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<UserShopDto> get(
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDir,
            @RequestParam(required = false) List<Long> avatarCategoryIds,
            @RequestParam(required = false) List<Long> frameCategoryIds,
            @RequestParam(required = false) List<Long> accentCategoryIds) {

        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(shopService.getShop(
                user, sortBy, sortDir,
                avatarCategoryIds, frameCategoryIds, accentCategoryIds
        ));
    }

    // Аватарки
    @PostMapping("/avatars/{id}/buy")
    public ResponseEntity<UserShopDto> buyAvatar(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.buyAvatar(currentUserService.getCurrentUser(), id));
    }

    @PostMapping("/avatars/{id}/equip")
    public ResponseEntity<UserShopDto> equipAvatar(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.equipAvatar(currentUserService.getCurrentUser(), id));
    }

    // Рамки
    @PostMapping("/frames/{id}/buy")
    public ResponseEntity<UserShopDto> buyFrame(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.buyFrame(currentUserService.getCurrentUser(), id));
    }

    @PostMapping("/frames/{id}/equip")
    public ResponseEntity<UserShopDto> equipFrame(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.equipFrame(currentUserService.getCurrentUser(), id));
    }

    @PostMapping("/frames/unequip")
    public ResponseEntity<UserShopDto> unequipFrame() {
        return ResponseEntity.ok(shopService.unequipFrame(currentUserService.getCurrentUser()));
    }

    // Деревья
    @PostMapping("/tree-skins/{id}/buy")
    public ResponseEntity<UserShopDto> buyTreeSkin(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.buyTreeSkin(currentUserService.getCurrentUser(), id));
    }

    @PostMapping("/tree-skins/{id}/equip")
    public ResponseEntity<UserShopDto> equipTreeSkin(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.equipTreeSkin(currentUserService.getCurrentUser(), id));
    }

    @PostMapping("/tree-skins/unequip")
    public ResponseEntity<UserShopDto> unequipTreeSkin() {
        return ResponseEntity.ok(shopService.unequipTreeSkin(currentUserService.getCurrentUser()));
    }

    /** Типы деревьев — нужны фильтрам магазина (доступно любому авторизованному). */
    @GetMapping("/tree-categories")
    public ResponseEntity<List<CategoryDto>> treeCategories() {
        return ResponseEntity.ok(shopService.getTreeCategories());
    }

    // ============================================================
    // Категории для чипов магазина.
    //
    // Магазин — обычная страница для всех пользователей, но категории он
    // брал из /api/admin/shop/*, где стоит checkAdmin() и кидается
    // IllegalArgumentException. Без обработчика ошибок Spring отдаёт на него
    // 403, фронт (api.js) трактует 403 как «токен протух» — чистит токен и
    // выкидывает на /login. Отсюда «магазин выкидывает из аккаунта» у всех,
    // кроме админов. Эти три ручки — только чтение справочников.
    // ============================================================

    @GetMapping("/avatar-categories")
    public ResponseEntity<List<CategoryDto>> avatarCategories() {
        return ResponseEntity.ok(shopService.getAvatarCategories());
    }

    @GetMapping("/frame-categories")
    public ResponseEntity<List<CategoryDto>> frameCategories() {
        return ResponseEntity.ok(shopService.getFrameCategories());
    }

    @GetMapping("/accent-categories")
    public ResponseEntity<List<CategoryDto>> accentCategories() {
        return ResponseEntity.ok(shopService.getAccentCategories());
    }

    // Сундуки
    @GetMapping("/chests")
    public ResponseEntity<ChestsDto> chests() {
        return ResponseEntity.ok(chestService.getChests(currentUserService.getCurrentUser()));
    }

    @PostMapping("/chests/keys/buy")
    public ResponseEntity<ChestsDto> buyKey() {
        return ResponseEntity.ok(chestService.buyKey(currentUserService.getCurrentUser()));
    }

    @PostMapping("/chests/{code}/open")
    public ResponseEntity<ChestOpenResultDto> openChest(@PathVariable String code) {
        return ResponseEntity.ok(chestService.openChest(currentUserService.getCurrentUser(), code));
    }

    // Акценты
    @PostMapping("/accents/{id}/buy")    public ResponseEntity<UserShopDto> buyAccent(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.buyAccent(currentUserService.getCurrentUser(), id));
    }

    @PostMapping("/accents/{id}/equip")
    public ResponseEntity<UserShopDto> equipAccent(@PathVariable Long id) {
        return ResponseEntity.ok(shopService.equipAccent(currentUserService.getCurrentUser(), id));
    }

    @PostMapping("/accents/unequip")
    public ResponseEntity<UserShopDto> unequipAccent() {
        return ResponseEntity.ok(shopService.unequipAccent(currentUserService.getCurrentUser()));
    }
}