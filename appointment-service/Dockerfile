FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy parent pom and common module first
COPY pom.xml .
COPY common ./common

# Copy appointment-service
COPY appointment-service ./appointment-service

# Build the application
RUN mvn clean package -pl appointment-service -am -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built jar
COPY --from=build /app/appointment-service/target/*.jar app.jar

# Expose port
EXPOSE 8084

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
