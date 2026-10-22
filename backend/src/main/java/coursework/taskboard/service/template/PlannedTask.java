package coursework.taskboard.service.template;

import java.util.List;

/**
 * Задача, которую нужно создать на доске при применении шаблона или гайда.
 * deadlineOffsetDays — смещение от даты старта; null = без дедлайна.
 */
public record PlannedTask(
        String title,
        String description,
        Short priority,
        String statusCategoryCode,
        Integer deadlineOffsetDays,
        Integer estimatedMinutes,
        List<String> subtasks
) {
}
