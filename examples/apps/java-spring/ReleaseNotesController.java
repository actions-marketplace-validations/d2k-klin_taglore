package com.example.app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Map;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * GET /release-notes/latest.json is served as a static resource already.
 * This controller shows how to read the same file in Java code.
 */
@RestController
public class ReleaseNotesController {
  private final JsonNode latest;

  public ReleaseNotesController(ObjectMapper mapper) throws IOException {
    this.latest = mapper.readTree(new ClassPathResource("static/release-notes/latest.json").getInputStream());
  }

  @GetMapping("/api/version")
  public Map<String, String> version() {
    return Map.of("version", latest.path("version").asText(), "title", latest.path("title").asText());
  }
}
