package coursework.taskboard.config;

import coursework.taskboard.model.consts.Accent;
import coursework.taskboard.model.consts.MimeType;
import coursework.taskboard.model.consts.StatusCategory;
import coursework.taskboard.repository.consts.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AccentRepository accentRepository;
    private final StatusCategoryRepository statusCategoryRepository;
    private final MimeTypeRepository mimeTypeRepository;

    @Override
    public void run(String... args) {
        initAccents();
        initStatusCategories();
        initMimeTypes();
    }

    private void initAccents() {
        if (accentRepository.count() > 0) return;

        accentRepository.saveAll(List.of(
                Accent.builder().code("blue").label("Синий").build(),
                Accent.builder().code("indigo").label("Индиго").build(),
                Accent.builder().code("violet").label("Фиолетовый").build(),
                Accent.builder().code("purple").label("Пурпурный").build(),
                Accent.builder().code("pink").label("Розовый").build(),
                Accent.builder().code("magenta").label("Пурпурно-розовый").build(),
                Accent.builder().code("red").label("Красный").build(),
                Accent.builder().code("coral").label("Коралловый").build(),
                Accent.builder().code("orange").label("Оранжевый").build(),
                Accent.builder().code("amber").label("Янтарный").build(),
                Accent.builder().code("yellow").label("Жёлтый").build(),
                Accent.builder().code("lime").label("Лаймовый").build(),
                Accent.builder().code("green").label("Зелёный").build(),
                Accent.builder().code("mint").label("Мятный").build(),
                Accent.builder().code("teal").label("Бирюзовый").build(),
                Accent.builder().code("cyan").label("Голубой").build(),
                Accent.builder().code("sky").label("Небесный").build(),
                Accent.builder().code("navy").label("Тёмно-синий").build(),
                Accent.builder().code("maroon").label("Бордовый").build(),
                Accent.builder().code("olive").label("Оливковый").build(),
                Accent.builder().code("brown").label("Коричневый").build(),
                Accent.builder().code("gray").label("Серый").build(),
                Accent.builder().code("slate").label("Тёмно-серый").build()
        ));
    }

    private void initStatusCategories() {
        if (statusCategoryRepository.count() > 0) return;

        statusCategoryRepository.saveAll(List.of(
                StatusCategory.builder().code("ACTIVE").label("Активные").sortOrder(1).isFinal(false).build(),
                StatusCategory.builder().code("FROZEN").label("Отложенные").sortOrder(2).isFinal(false).build(),
                StatusCategory.builder().code("DONE").label("Выполненные").sortOrder(3).isFinal(true).build(),
                StatusCategory.builder().code("EXPIRED").label("Просроченные").sortOrder(4).isFinal(true).build(),
                StatusCategory.builder().code("CANCELLED").label("Отменённые").sortOrder(5).isFinal(true).build(),
                StatusCategory.builder().code("ARCHIVED").label("Архив").sortOrder(6).isFinal(true).build()
        ));
    }

    private void initMimeTypes() {
        if (mimeTypeRepository.count() > 0) return;

        mimeTypeRepository.saveAll(List.of(
                // Картинки
                MimeType.builder().code("image/jpeg").build(),
                MimeType.builder().code("image/png").build(),
                MimeType.builder().code("image/gif").build(),
                MimeType.builder().code("image/webp").build(),
                MimeType.builder().code("image/svg+xml").build(),
                // Документы
                MimeType.builder().code("application/pdf").build(),
                MimeType.builder().code("application/msword").build(),
                MimeType.builder().code("application/vnd.openxmlformats-officedocument.wordprocessingml.document").build(),
                MimeType.builder().code("application/vnd.ms-excel").build(),
                MimeType.builder().code("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet").build(),
                MimeType.builder().code("text/plain").build(),
                MimeType.builder().code("text/csv").build(),
                MimeType.builder().code("text/markdown").build(),
                // Архивы
                MimeType.builder().code("application/zip").build(),
                MimeType.builder().code("application/x-7z-compressed").build(),
                MimeType.builder().code("application/x-rar-compressed").build()
        ));
    }
}