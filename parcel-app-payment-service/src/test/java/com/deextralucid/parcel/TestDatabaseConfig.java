package com.deextralucid.parcel;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.ActiveProfiles;

@TestConfiguration
@ActiveProfiles("test")
public class TestDatabaseConfig {
    // Test-specific configuration can be added here if needed
}
