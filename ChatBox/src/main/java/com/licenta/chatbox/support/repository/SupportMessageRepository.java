package com.licenta.chatbox.support.repository;

import com.licenta.chatbox.support.model.SupportMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportMessageRepository extends JpaRepository<SupportMessage, String> {
    List<SupportMessage> findAllBySessionIdOrderByCreatedAtAsc(String sessionId);
}

