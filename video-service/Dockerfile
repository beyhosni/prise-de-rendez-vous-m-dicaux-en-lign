FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/video-service-*.jar app.jar

EXPOSE 8086

ENTRYPOINT ["java", "-jar", "app.jar"]
