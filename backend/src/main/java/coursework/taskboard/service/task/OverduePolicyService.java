package coursework.taskboard.service.task;

import java.time.LocalDateTime;

/**
 * Единая политика определения просроченности задачи.
 * Задача считается просроченной, если прошло больше {@link #GRACE_HOURS}
 * часов с момента дедлайна, и она не выполнена.
 */
public final class OverduePolicyService {

    public static final int GRACE_HOURS = 24;

    private OverduePolicyService() {}

    public static LocalDateTime thresholdNow() {
        return LocalDateTime.now().minusHours(GRACE_HOURS);
    }

    public static boolean isOverdue(LocalDateTime deadline, LocalDateTime completedAt) {
        if (deadline == null) return false;
        if (completedAt != null) return false;
        return deadline.isBefore(thresholdNow());
    }
}