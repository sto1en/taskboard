package coursework.taskboard.service.shop;

import coursework.taskboard.dto.shop.AdminWeeklyRewardDto;
import coursework.taskboard.dto.shop.WeeklyRewardRequest;
import coursework.taskboard.model.reward.WeeklyRewardConfig;
import coursework.taskboard.repository.reward.WeeklyRewardConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminWeeklyRewardService {

    private final WeeklyRewardConfigRepository configRepository;
    private final ShopItemInfoService itemInfoService;

    @Transactional(readOnly = true)
    public List<AdminWeeklyRewardDto> list() {
        return configRepository.findAllByOrderByWeekStartAsc().stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Создать или обновить подарок на неделю. Дата нормализуется до
     * понедельника, поэтому повторный save на любой день той же недели
     * обновляет ту же строку.
     */
    @Transactional
    public AdminWeeklyRewardDto save(WeeklyRewardRequest req) {
        if (req == null) throw new IllegalArgumentException("Пустой запрос");

        String type = ShopItemInfoService.normalizeType(req.getItemType());
        if (type == null) {
            throw new IllegalArgumentException("Неизвестный тип предмета");
        }
        if (req.getItemCode() == null || req.getItemCode().isBlank()) {
            throw new IllegalArgumentException("Выбери предмет");
        }

        String code = req.getItemCode().trim();
        ShopItemInfoService.ItemInfo item = itemInfoService.resolve(type, code);
        if (item == null) {
            throw new IllegalArgumentException("Предмет не найден");
        }

        LocalDate weekStart = parseWeekStart(req.getWeekStart());

        WeeklyRewardConfig config = configRepository.findByWeekStart(weekStart)
                .orElseGet(() -> WeeklyRewardConfig.builder()
                        .weekStart(weekStart)
                        .build());

        config.setWeekStart(weekStart);
        config.setItemType(type);
        config.setItemCode(code);
        config.setEnabled(req.getEnabled() == null || req.getEnabled());

        configRepository.save(config);
        return toDto(config);
    }

    @Transactional
    public void delete(Long id) {
        if (!configRepository.existsById(id)) {
            throw new IllegalArgumentException("Подарок не найден");
        }
        configRepository.deleteById(id);
    }

    // ============================================================
    // Helpers
    // ============================================================

    private LocalDate parseWeekStart(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Укажи дату недели");
        }
        try {
            return LocalDate.parse(value.trim())
                    .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Неверный формат даты недели");
        }
    }

    private AdminWeeklyRewardDto toDto(WeeklyRewardConfig config) {
        ShopItemInfoService.ItemInfo item = itemInfoService.resolve(
                config.getItemType(), config.getItemCode());

        return AdminWeeklyRewardDto.builder()
                .id(config.getId())
                .weekStart(config.getWeekStart().toString())
                .weekEnd(config.getWeekStart().plusDays(6).toString())
                .itemType(config.getItemType())
                .itemCode(config.getItemCode())
                .itemTitle(item != null ? item.title() : config.getItemCode())
                .enabled(Boolean.TRUE.equals(config.getEnabled()))
                .createdAt(config.getCreatedAt())
                .build();
    }
}
