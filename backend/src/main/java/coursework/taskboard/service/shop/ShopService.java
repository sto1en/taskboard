package coursework.taskboard.service.shop;

import coursework.taskboard.dto.shop.ShopItemDto;
import coursework.taskboard.dto.shop.UserShopDto;
import coursework.taskboard.model.shop.*;
import coursework.taskboard.model.user.User;
import coursework.taskboard.model.user.UserAppearance;
import coursework.taskboard.repository.shop.*;
import coursework.taskboard.repository.user.UserAppearanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final AvatarRepository avatarRepository;
    private final FrameRepository frameRepository;
    private final TreeSkinRepository treeSkinRepository;
    private final UserCurrencyRepository userCurrencyRepository;
    private final UserAvatarRepository userAvatarRepository;
    private final UserFrameRepository userFrameRepository;
    private final UserTreeSkinRepository userTreeSkinRepository;
    private final UserAppearanceRepository userAppearanceRepository;

    @Transactional(readOnly = true)
    public UserShopDto getShop(User user) {
        int leaves = getLeaves(user);

        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElse(null);
        Long activeAvatarId = appearance != null && appearance.getActiveAvatar() != null
                ? appearance.getActiveAvatar().getId() : null;
        Long activeFrameId = appearance != null && appearance.getActiveFrame() != null
                ? appearance.getActiveFrame().getId() : null;
        Long activeSkinId = appearance != null && appearance.getActiveTreeSkin() != null
                ? appearance.getActiveTreeSkin().getId() : null;

        Set<Long> ownedAvatars = new HashSet<>();
        for (UserAvatar ua : userAvatarRepository.findByUserId(user.getId())) {
            ownedAvatars.add(ua.getAvatar().getId());
        }

        List<ShopItemDto> avatarDtos = new ArrayList<>();
        for (Avatar a : avatarRepository.findAllByOrderBySortOrderAsc()) {
            avatarDtos.add(ShopItemDto.builder()
                    .id(a.getId())
                    .code(a.getCode())
                    .title(a.getTitle())
                    .description(a.getDescription())
                    .emoji(a.getEmoji())
                    .imageUrl(a.getImageUrl())   // ← добавили
                    .cssClass(a.getCssClass())
                    .price(a.getPrice())
                    .owned(ownedAvatars.contains(a.getId()))
                    .active(a.getId().equals(activeAvatarId))
                    .build());
        }

        Set<Long> ownedFrames = new HashSet<>();
        for (UserFrame uf : userFrameRepository.findByUserId(user.getId())) {
            ownedFrames.add(uf.getFrame().getId());
        }

        List<ShopItemDto> frameDtos = new ArrayList<>();
        for (Frame f : frameRepository.findAllByOrderBySortOrderAsc()) {
            frameDtos.add(ShopItemDto.builder()
                    .id(f.getId()).code(f.getCode()).title(f.getTitle())
                    .description(f.getDescription()).price(f.getPrice())
                    .cssClass(f.getCssClass())
                    .owned(ownedFrames.contains(f.getId()))
                    .active(f.getId().equals(activeFrameId))
                    .build());
        }

        Set<Long> ownedSkins = new HashSet<>();
        for (UserTreeSkin us : userTreeSkinRepository.findByUserId(user.getId())) {
            ownedSkins.add(us.getTreeSkin().getId());
        }

        List<ShopItemDto> skinDtos = new ArrayList<>();
        for (TreeSkin s : treeSkinRepository.findAllByOrderBySortOrderAsc()) {
            skinDtos.add(ShopItemDto.builder()
                    .id(s.getId()).code(s.getCode()).title(s.getTitle())
                    .description(s.getDescription()).price(s.getPrice())
                    .owned(ownedSkins.contains(s.getId()))
                    .active(s.getId().equals(activeSkinId))
                    .build());
        }

        return UserShopDto.builder()
                .leaves(leaves)
                .avatars(avatarDtos)
                .frames(frameDtos)
                .treeSkins(skinDtos)
                .build();
    }

    // ============================================================
    // Аватарки
    // ============================================================
    @Transactional
    public UserShopDto buyAvatar(User user, Long avatarId) {
        Avatar avatar = avatarRepository.findById(avatarId)
                .orElseThrow(() -> new IllegalArgumentException("Avatar not found"));
        if (userAvatarRepository.existsByUserIdAndAvatarId(user.getId(), avatarId)) {
            throw new IllegalArgumentException("Уже куплено");
        }
        deductLeaves(user, avatar.getPrice());
        userAvatarRepository.save(UserAvatar.builder().user(user).avatar(avatar).build());
        return getShop(user);
    }

    @Transactional
    public UserShopDto equipAvatar(User user, Long avatarId) {
        if (!userAvatarRepository.existsByUserIdAndAvatarId(user.getId(), avatarId)) {
            throw new IllegalArgumentException("Аватарка не куплена");
        }
        Avatar avatar = avatarRepository.findById(avatarId).orElseThrow();
        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElseThrow();
        appearance.setActiveAvatar(avatar);
        userAppearanceRepository.save(appearance);
        return getShop(user);
    }

    // ============================================================
    // Рамки
    // ============================================================
    @Transactional
    public UserShopDto buyFrame(User user, Long frameId) {
        Frame frame = frameRepository.findById(frameId)
                .orElseThrow(() -> new IllegalArgumentException("Frame not found"));
        if (userFrameRepository.existsByUserIdAndFrameId(user.getId(), frameId)) {
            throw new IllegalArgumentException("Уже куплено");
        }
        deductLeaves(user, frame.getPrice());
        userFrameRepository.save(UserFrame.builder().user(user).frame(frame).build());
        return getShop(user);
    }

    @Transactional
    public UserShopDto equipFrame(User user, Long frameId) {
        if (!userFrameRepository.existsByUserIdAndFrameId(user.getId(), frameId)) {
            throw new IllegalArgumentException("Рамка не куплена");
        }
        Frame frame = frameRepository.findById(frameId).orElseThrow();
        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElseThrow();
        appearance.setActiveFrame(frame);
        userAppearanceRepository.save(appearance);
        return getShop(user);
    }

    @Transactional
    public UserShopDto unequipFrame(User user) {
        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElseThrow();
        appearance.setActiveFrame(null);
        userAppearanceRepository.save(appearance);
        return getShop(user);
    }

    // ============================================================
    // Деревья
    // ============================================================
    @Transactional
    public UserShopDto buyTreeSkin(User user, Long skinId) {
        TreeSkin skin = treeSkinRepository.findById(skinId)
                .orElseThrow(() -> new IllegalArgumentException("Tree skin not found"));
        if (userTreeSkinRepository.existsByUserIdAndTreeSkinId(user.getId(), skinId)) {
            throw new IllegalArgumentException("Уже куплено");
        }
        deductLeaves(user, skin.getPrice());
        userTreeSkinRepository.save(UserTreeSkin.builder().user(user).treeSkin(skin).build());
        return getShop(user);
    }

    @Transactional
    public UserShopDto equipTreeSkin(User user, Long skinId) {
        if (!userTreeSkinRepository.existsByUserIdAndTreeSkinId(user.getId(), skinId)) {
            throw new IllegalArgumentException("Скин не куплен");
        }
        TreeSkin skin = treeSkinRepository.findById(skinId).orElseThrow();
        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElseThrow();
        appearance.setActiveTreeSkin(skin);
        userAppearanceRepository.save(appearance);
        return getShop(user);
    }

    @Transactional
    public UserShopDto unequipTreeSkin(User user) {
        UserAppearance appearance = userAppearanceRepository.findById(user.getId()).orElseThrow();
        appearance.setActiveTreeSkin(null);
        userAppearanceRepository.save(appearance);
        return getShop(user);
    }

    // ============================================================
    // Листья
    // ============================================================
    @Transactional
    public void addLeaves(User user, int amount) {
        if (amount <= 0) return;
        UserCurrency cur = userCurrencyRepository.findById(user.getId())
                .orElseGet(() -> userCurrencyRepository.save(
                        UserCurrency.builder()
                                .user(user)
                                .userId(user.getId())
                                .leaves(0)
                                .build()
                ));
        cur.setLeaves(cur.getLeaves() + amount);
        userCurrencyRepository.save(cur);
    }

    private int getLeaves(User user) {
        return userCurrencyRepository.findById(user.getId())
                .map(UserCurrency::getLeaves)
                .orElse(0);
    }

    /**
     * Списывает листья. Если у пользователя ещё нет записи — создаёт с 0,
     * затем выбрасывает корректную ошибку «Недостаточно листьев».
     */
    private void deductLeaves(User user, int amount) {
        UserCurrency cur = userCurrencyRepository.findById(user.getId())
                .orElseGet(() -> userCurrencyRepository.save(
                        UserCurrency.builder()
                                .user(user)
                                .userId(user.getId())
                                .leaves(0)
                                .build()
                ));
        if (cur.getLeaves() < amount) {
            throw new IllegalArgumentException("Недостаточно листьев");
        }
        cur.setLeaves(cur.getLeaves() - amount);
        userCurrencyRepository.save(cur);
    }
}