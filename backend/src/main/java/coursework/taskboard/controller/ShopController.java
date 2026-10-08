package coursework.taskboard.controller;

import coursework.taskboard.dto.shop.UserShopDto;
import coursework.taskboard.model.user.User;
import coursework.taskboard.service.auth.CurrentUserService;
import coursework.taskboard.service.shop.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shop")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<UserShopDto> get() {
        User user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(shopService.getShop(user));
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

    // Акценты
    @PostMapping("/accents/{id}/buy")
    public ResponseEntity<UserShopDto> buyAccent(@PathVariable Long id) {
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