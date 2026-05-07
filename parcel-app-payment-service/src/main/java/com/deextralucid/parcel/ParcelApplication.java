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
		setPropertyIfPresent(dotenv, "PAYSTACK_SECRET_KEY");

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
