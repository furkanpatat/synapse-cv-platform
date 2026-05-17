# syntax=docker/dockerfile:1.7

# ─── Build stage ─────────────────────────────────────────────────
# Use the Eclipse Temurin JDK 21 + the project's own Maven wrapper
# (./mvnw) so we never depend on the host's Maven install. The split
# COPY for pom.xml + .mvn first gives us a docker-cached `dependency:go-offline`
# layer that only invalidates when pom.xml itself changes.
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

# Wrapper + pom first → cached deps layer
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q -DskipTests dependency:go-offline

# Now the source
COPY src ./src
RUN ./mvnw -B -q -DskipTests package \
 && cp target/*.jar app.jar

# ─── Runtime stage ────────────────────────────────────────────────
# Minimal Alpine JRE, non-root user, healthcheck against actuator.
FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /workspace/app.jar /app/app.jar

# Spring's context-path is /api — health probe must include it.
HEALTHCHECK --interval=15s --timeout=3s --start-period=45s --retries=3 \
    CMD wget -q --spider http://localhost:8080/api/actuator/health || exit 1

USER app
EXPOSE 8080

# `exec` form + JAVA_TOOL_OPTIONS so K8s can pass extra flags
# (e.g. -XX:MaxRAMPercentage=75) without rebuilding the image.
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
