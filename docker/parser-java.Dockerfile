FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY packages/parser-java/pom.xml .
RUN mvn dependency:go-offline -q
COPY packages/parser-java/src ./src
RUN mvn package -q -DskipTests

FROM eclipse-temurin:17-jre
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/parser-java-0.1.0.jar app.jar
ENV PARSER_PORT=4000
EXPOSE 4000
CMD ["java", "-jar", "app.jar"]
