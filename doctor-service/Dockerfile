FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy parent pom and common module first
COPY pom.xml .
COPY common ./common

# Copy doctor-service
COPY doctor-service ./doctor-service

# Build the application
RUN mvn clean package -pl doctor-service -am -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built jar
COPY --from=build /app/doctor-service/target/*.jar app.jar

# Expose port
EXPOSE 8083

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
