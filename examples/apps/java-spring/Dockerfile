FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY . .
# Files under src/main/resources/static/ are served by Spring Boot automatically.
# Point Taglore there: output-dir: src/main/resources/static/release-notes
RUN ./mvnw -q package -DskipTests

FROM eclipse-temurin:21-jre
COPY --from=build /src/target/*.jar /app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
