package com.codewithola.tradelynkapi.dtos.requests;

import com.codewithola.tradelynkapi.entity.User;
import lombok.Data;

/**
 * Update Role Request DTO
 */
@Data
public class UpdateRoleRequest {
    private User.UserRole role;
}
