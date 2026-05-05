package com.licenta.chatbox.support.repository;

import com.licenta.chatbox.support.model.SupportSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportSessionRepository extends JpaRepository<SupportSession, String> {
    Optional<SupportSession> findFirstByClientUsernameAndStatus(String clientUsername, String status);
    List<SupportSession> findAllByOrderByLastMessageAtDesc();
}

