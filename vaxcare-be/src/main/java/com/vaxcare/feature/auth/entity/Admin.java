package com.vaxcare.feature.auth.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "admins")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Admin {

    @Id
    @Column(name = "admin_id")
    private Long adminId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "admin_id")
    private Account account;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "admin_level", length = 50)
    @Builder.Default
    private String adminLevel = "SYSTEM";
}
