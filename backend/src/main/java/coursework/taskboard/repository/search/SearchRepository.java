package coursework.taskboard.repository.search;

import coursework.taskboard.model.user.User;
import coursework.taskboard.dto.search.SearchFilterRequestDto;
import coursework.taskboard.dto.search.SearchItemDto;
import coursework.taskboard.model.board.Board;
import coursework.taskboard.model.project.Project;
import coursework.taskboard.model.tag.Tag;
import coursework.taskboard.model.task.Task;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Простой репозиторий поиска через JPQL.
 * Собирает результаты из 4 источников: boards, projects, tasks, tags.
 * Все запросы ограничены досками пользователя.
 */
@Repository
@RequiredArgsConstructor
public class SearchRepository {

    @PersistenceContext
    private EntityManager em;

    public List<Board> searchBoards(Long userId, SearchFilterRequestDto f) {
        StringBuilder jpql = new StringBuilder(
                "SELECT b FROM Board b WHERE b.owner.id = :userId"
        );

        if (f.hasQuery()) {
            jpql.append(" AND (LOWER(b.title) LIKE :q OR LOWER(b.description) LIKE :q)");
        }
        if (f.getBoardIds() != null && !f.getBoardIds().isEmpty()) {
            jpql.append(" AND b.id IN :boardIds");
        }
        if (f.getFrom() != null) {
            jpql.append(" AND b.createdAt >= :from");
        }
        if (f.getTo() != null) {
            jpql.append(" AND b.createdAt <= :to");
        }
        jpql.append(" ORDER BY b.position ASC, b.id DESC");

        TypedQuery<Board> q = em.createQuery(jpql.toString(), Board.class);
        q.setParameter("userId", userId);
        if (f.hasQuery()) q.setParameter("q", "%" + f.getQNormalized() + "%");
        if (f.getBoardIds() != null && !f.getBoardIds().isEmpty()) q.setParameter("boardIds", f.getBoardIds());
        if (f.getFrom() != null) q.setParameter("from", f.getFrom().atStartOfDay());
        if (f.getTo() != null) q.setParameter("to", f.getTo().plusDays(1).atStartOfDay());

        return q.getResultList();
    }

    public List<Project> searchProjects(Long userId, SearchFilterRequestDto f) {
        StringBuilder jpql = new StringBuilder(
                "SELECT p FROM Project p JOIN p.board b WHERE b.owner.id = :userId"
        );

        if (f.hasQuery()) {
            jpql.append(" AND (LOWER(p.title) LIKE :q OR LOWER(p.description) LIKE :q)");
        }
        if (f.getBoardIds() != null && !f.getBoardIds().isEmpty()) {
            jpql.append(" AND b.id IN :boardIds");
        }
        if (f.getProjectIds() != null && !f.getProjectIds().isEmpty()) {
            jpql.append(" AND p.id IN :projectIds");
        }
        if (f.getFrom() != null) {
            jpql.append(" AND p.createdAt >= :from");
        }
        if (f.getTo() != null) {
            jpql.append(" AND p.createdAt <= :to");
        }
        jpql.append(" ORDER BY p.board.id ASC, p.position ASC, p.id DESC");

        TypedQuery<Project> q = em.createQuery(jpql.toString(), Project.class);
        q.setParameter("userId", userId);
        if (f.hasQuery()) q.setParameter("q", "%" + f.getQNormalized() + "%");
        if (f.getBoardIds() != null && !f.getBoardIds().isEmpty()) q.setParameter("boardIds", f.getBoardIds());
        if (f.getProjectIds() != null && !f.getProjectIds().isEmpty()) q.setParameter("projectIds", f.getProjectIds());
        if (f.getFrom() != null) q.setParameter("from", f.getFrom().atStartOfDay());
        if (f.getTo() != null) q.setParameter("to", f.getTo().plusDays(1).atStartOfDay());

        return q.getResultList();
    }

    public List<Task> searchTasks(Long userId, SearchFilterRequestDto f) {
        StringBuilder jpql = new StringBuilder(
                "SELECT t FROM Task t " +
                        "JOIN t.project p JOIN p.board b " +
                        "LEFT JOIN t.settings s " +
                        "WHERE b.owner.id = :userId"
        );

        if (f.hasQuery()) {
            jpql.append(" AND (LOWER(t.title) LIKE :q OR LOWER(t.description) LIKE :q)");
        }
        if (f.getBoardIds() != null && !f.getBoardIds().isEmpty()) {
            jpql.append(" AND b.id IN :boardIds");
        }
        if (f.getProjectIds() != null && !f.getProjectIds().isEmpty()) {
            jpql.append(" AND p.id IN :projectIds");
        }
        if (f.getStatusIds() != null && !f.getStatusIds().isEmpty()) {
            jpql.append(" AND s.status.id IN :statusIds");
        }
        if (f.getPriorities() != null && !f.getPriorities().isEmpty()) {
            jpql.append(" AND s.priority IN :priorities");
        }
        if (f.getTagIds() != null && !f.getTagIds().isEmpty()) {
            jpql.append(" AND EXISTS (SELECT 1 FROM TaskTag tt WHERE tt.task = t AND tt.tag.id IN :tagIds)");
        }
        if (f.getHasDeadline() != null) {
            if (Boolean.TRUE.equals(f.getHasDeadline())) {
                jpql.append(" AND EXISTS (SELECT 1 FROM TaskSchedule sc WHERE sc.task = t AND sc.deadline IS NOT NULL)");
            } else {
                jpql.append(" AND NOT EXISTS (SELECT 1 FROM TaskSchedule sc WHERE sc.task = t AND sc.deadline IS NOT NULL)");
            }
        }
        if (f.getFrom() != null) {
            jpql.append(" AND t.createdAt >= :from");
        }
        if (f.getTo() != null) {
            jpql.append(" AND t.createdAt <= :to");
        }
        jpql.append(" ORDER BY t.updatedAt DESC, t.id DESC");

        TypedQuery<Task> q = em.createQuery(jpql.toString(), Task.class);
        q.setParameter("userId", userId);
        if (f.hasQuery()) q.setParameter("q", "%" + f.getQNormalized() + "%");
        if (f.getBoardIds() != null && !f.getBoardIds().isEmpty()) q.setParameter("boardIds", f.getBoardIds());
        if (f.getProjectIds() != null && !f.getProjectIds().isEmpty()) q.setParameter("projectIds", f.getProjectIds());
        if (f.getStatusIds() != null && !f.getStatusIds().isEmpty()) q.setParameter("statusIds", f.getStatusIds());
        if (f.getPriorities() != null && !f.getPriorities().isEmpty()) q.setParameter("priorities", f.getPriorities());
        if (f.getTagIds() != null && !f.getTagIds().isEmpty()) q.setParameter("tagIds", f.getTagIds());
        if (f.getFrom() != null) q.setParameter("from", f.getFrom().atStartOfDay());
        if (f.getTo() != null) q.setParameter("to", f.getTo().plusDays(1).atStartOfDay());

        return q.getResultList();
    }

    public List<Tag> searchTags(Long userId, SearchFilterRequestDto f) {
        StringBuilder jpql = new StringBuilder(
                "SELECT tg FROM Tag tg JOIN tg.board b WHERE b.owner.id = :userId"
        );

        if (f.hasQuery()) {
            jpql.append(" AND LOWER(tg.title) LIKE :q");
        }
        if (f.getBoardIds() != null && !f.getBoardIds().isEmpty()) {
            jpql.append(" AND b.id IN :boardIds");
        }
        if (f.getTagIds() != null && !f.getTagIds().isEmpty()) {
            jpql.append(" AND tg.id IN :tagIds");
        }
        jpql.append(" ORDER BY tg.board.id ASC, tg.position ASC, tg.id DESC");

        TypedQuery<Tag> q = em.createQuery(jpql.toString(), Tag.class);
        q.setParameter("userId", userId);
        if (f.hasQuery()) q.setParameter("q", "%" + f.getQNormalized() + "%");
        if (f.getBoardIds() != null && !f.getBoardIds().isEmpty()) q.setParameter("boardIds", f.getBoardIds());
        if (f.getTagIds() != null && !f.getTagIds().isEmpty()) q.setParameter("tagIds", f.getTagIds());

        return q.getResultList();
    }
}