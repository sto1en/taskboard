package coursework.taskboard.service.tag;

import coursework.taskboard.dto.tag.*;
import coursework.taskboard.model.board.Board;
import coursework.taskboard.model.tag.Tag;
import coursework.taskboard.model.tag.TagAppearance;
import coursework.taskboard.model.user.User;
import coursework.taskboard.repository.board.BoardMemberRepository;
import coursework.taskboard.repository.board.BoardRepository;
import coursework.taskboard.repository.tag.TagAppearanceRepository;
import coursework.taskboard.repository.tag.TagRepository;
import coursework.taskboard.repository.task.TaskTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final TagAppearanceRepository tagAppearanceRepository;
    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final TaskTagRepository taskTagRepository;

    private final TagMapper tagMapper;

    // ============================================================
    // Список тегов доски
    // ============================================================
    @Transactional(readOnly = true)
    public List<TagDto> getBoardTags(Long boardId, User user) {
        checkBoardAccess(boardId, user);

        List<Tag> tags = tagRepository.findByBoardIdOrderByPositionAsc(boardId);
        List<TagDto> result = new ArrayList<>();

        for (Tag tag : tags) {
            TagAppearance appearance = tagAppearanceRepository
                    .findById(tag.getId()).orElse(null);
            long count = taskTagRepository.countByTagId(tag.getId());

            result.add(tagMapper.toTagDto(tag, appearance, count));
        }

        return result;
    }

    // ============================================================
    // Создать тег
    // ============================================================
    @Transactional
    public TagDto createTag(Long boardId, CreateTagRequest request, User user) {
        checkBoardAccess(boardId, user);

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("Board not found"));

        // сгенерировать code (машинное имя)
        String code = generateCode(request.getTitle());

        // проверка уникальности code в рамках доски
        if (tagRepository.existsByBoardIdAndCode(boardId, code)) {
            // добавить суффикс
            code = code + "-" + System.currentTimeMillis() % 1000;
        }

        int position = tagRepository.findByBoardIdOrderByPositionAsc(boardId).size();

        Tag tag = tagMapper.toTag(board, request, code, position);
        tagRepository.save(tag);

        TagAppearance appearance = tagMapper.toTagAppearance(
                tag, request.getAccentCode(), request.getIcon());
        tagAppearanceRepository.save(appearance);

        return tagMapper.toTagDto(tag, appearance, 0);
    }

    // ============================================================
    // Обновить тег
    // ============================================================
    @Transactional
    public TagDto updateTag(Long tagId, UpdateTagRequest request, User user) {
        Tag tag = getTagWithAccess(tagId, user);
        TagAppearance appearance = tagAppearanceRepository.findById(tagId)
                .orElseGet(() -> tagMapper.toTagAppearance(tag, null, null));

        if (request.getTitle() != null) {
            tag.setTitle(request.getTitle());
        }
        if (request.getPosition() != null) {
            tag.setPosition(request.getPosition());
        }
        tagRepository.save(tag);

        if (request.getAccentCode() != null) {
            appearance.setAccentCode(request.getAccentCode());
        }
        // icon можно сбросить в null
        if (request.getIcon() != null || request.getIcon() == null) {
            // просто всегда ставим, если поле пришло не undefined
            // но в Java null == отсутствие поля. Поэтому обновляем,
            // если пришло хоть что-то (включая пустую строку)
            appearance.setIcon(request.getIcon());
        }
        if (request.getIsBold() != null) {
            appearance.setIsBold(request.getIsBold());
        }
        tagAppearanceRepository.save(appearance);

        long count = taskTagRepository.countByTagId(tagId);
        return tagMapper.toTagDto(tag, appearance, count);
    }

    // ============================================================
    // Удалить тег
    // ============================================================
    @Transactional
    public void deleteTag(Long tagId, User user) {
        Tag tag = getTagWithAccess(tagId, user);

        if (Boolean.TRUE.equals(tag.getIsSystem())) {
            throw new IllegalArgumentException("Нельзя удалить системный тег");
        }

        tagRepository.delete(tag);
    }

    // ============================================================
    // Поиск тегов (autocomplete)
    // ============================================================
    @Transactional(readOnly = true)
    public List<TagDto> searchTags(Long boardId, String query, User user) {
        checkBoardAccess(boardId, user);

        if (query == null || query.isBlank()) {
            return getBoardTags(boardId, user);
        }

        List<Tag> tags = tagRepository.searchByTitle(boardId, query.trim());
        List<TagDto> result = new ArrayList<>();

        for (Tag tag : tags) {
            TagAppearance appearance = tagAppearanceRepository
                    .findById(tag.getId()).orElse(null);
            long count = taskTagRepository.countByTagId(tag.getId());
            result.add(tagMapper.toTagDto(tag, appearance, count));
        }

        return result;
    }

    // ============================================================
    // Helpers
    // ============================================================
    private String generateCode(String title) {
        return title.toLowerCase()
                .replaceAll("[^a-z0-9а-яё]+", "-")
                .replaceAll("^-|-$", "");
    }

    private void checkBoardAccess(Long boardId, User user) {
        if (!boardMemberRepository.existsByBoardIdAndUserId(boardId, user.getId())) {
            throw new IllegalArgumentException("No access to board");
        }
    }

    private Tag getTagWithAccess(Long tagId, User user) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found"));

        checkBoardAccess(tag.getBoard().getId(), user);

        return tag;
    }
}