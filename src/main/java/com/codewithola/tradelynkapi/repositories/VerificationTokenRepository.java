package com.codewithola.tradelynkapi.repositories;


import com.codewithola.tradelynkapi.entity.User;
import com.codewithola.tradelynkapi.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByToken(String token);

    Optional<VerificationToken> findByUser(User user);
}

