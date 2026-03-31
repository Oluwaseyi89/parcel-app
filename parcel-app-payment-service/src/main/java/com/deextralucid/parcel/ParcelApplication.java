package com.deextralucid.parcel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class ParcelApplication {

	public static void main(String[] args) {
		// Load .env file for local development (optional)
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

		// Set .env variables as system properties if not already set
		setPropertyIfPresent(dotenv, "DB_HOST");
		setPropertyIfPresent(dotenv, "DB_PORT");
		setPropertyIfPresent(dotenv, "POSTGRES_DB");
		setPropertyIfPresent(dotenv, "POSTGRES_USER");
		setPropertyIfPresent(dotenv, "POSTGRES_PASSWORD");
		setPropertyIfPresent(dotenv, "SPRING_PROFILES_ACTIVE");
		setPropertyIfPresent(dotenv, "SERVER_PORT");

		// Log environment variables for debugging
		System.out.println("=== Database Configuration ===");
		System.out.println("DB_HOST=" + System.getProperty("DB_HOST", dotenv.get("DB_HOST", System.getenv("DB_HOST"))));
		System.out.println("DB_PORT=" + System.getProperty("DB_PORT", dotenv.get("DB_PORT", System.getenv("DB_PORT"))));
		System.out.println("POSTGRES_DB=" + System.getProperty("POSTGRES_DB", dotenv.get("POSTGRES_DB", System.getenv("POSTGRES_DB"))));
		System.out.println("POSTGRES_USER=" + System.getProperty("POSTGRES_USER", dotenv.get("POSTGRES_USER", System.getenv("POSTGRES_USER"))));
		System.out.println("POSTGRES_PASSWORD=" + (System.getProperty("POSTGRES_PASSWORD", dotenv.get("POSTGRES_PASSWORD", System.getenv("POSTGRES_PASSWORD"))) != null ? "***SET***" : "NOT SET"));
		System.out.println("SPRING_PROFILES_ACTIVE=" + System.getProperty("SPRING_PROFILES_ACTIVE", dotenv.get("SPRING_PROFILES_ACTIVE", System.getenv("SPRING_PROFILES_ACTIVE"))));
		System.out.println("SERVER_PORT=" + System.getProperty("SERVER_PORT", dotenv.get("SERVER_PORT", System.getenv("SERVER_PORT"))));
		System.out.println("================================");

		SpringApplication.run(ParcelApplication.class, args);
	}

	/**
	 * Helper method to set system properties from .env file values
	 * Checks in order: System property -> .env file -> System environment variable
	 */
	private static void setPropertyIfPresent(Dotenv dotenv, String propertyName) {
		// Try to get from .env file first
		String value = dotenv.get(propertyName);
		
		// If not in .env, try system environment variables
		if (value == null || value.isEmpty()) {
			value = System.getenv(propertyName);
		}
		
		// Set as system property if found
		if (value != null && !value.isEmpty()) {
			System.setProperty(propertyName, value);
		}
	}

}
