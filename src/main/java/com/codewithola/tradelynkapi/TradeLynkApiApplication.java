package com.codewithola.tradelynkapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TradeLynkApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(TradeLynkApiApplication.class, args);
	}

}
