# Système de Prise de Rendez-vous Médicaux en Ligne

Application complète de gestion de rendez-vous médicaux avec architecture microservices.

## 🏗️ Architecture

- **Backend**: Java 17 / Spring Boot 3.2
- **API**: GraphQL
- **Base de données**: PostgreSQL
- **Frontend**: React + Apollo Client
- **Paiement**: Stripe
- **Vidéo**: Jitsi Meet

## 📦 Microservices

1. **API Gateway** (Port 8080) - Point d'entrée unique
2. **Auth Service** (Port 8081) - Authentification & Utilisateurs
3. **Patient Service** (Port 8082) - Gestion des patients
4. **Doctor Service** (Port 8083) - Gestion des médecins
5. **Appointment Service** (Port 8084) - Gestion des rendez-vous
6. **Payment Service** (Port 8085) - Paiements Stripe
7. **Video Service** (Port 8086) - Consultations vidéo
8. **Notification Service** (Port 8087) - Emails & SMS

## 🚀 Démarrage Rapide

### Prérequis

- Java 17+
- Maven 3.8+
- PostgreSQL 15+
- Node.js 18+
- Docker & Docker Compose (optionnel)

### Avec Docker Compose

```bash
docker-compose up -d
```

### Manuel

1. **Démarrer PostgreSQL**
```bash
docker run -d \
  --name medical-postgres \
  -e POSTGRES_DB=medical_db \
  -e POSTGRES_USER=medical_user \
  -e POSTGRES_PASSWORD=medical_pass \
  -p 5432:5432 \
  postgres:15
```

2. **Compiler les services**
```bash
mvn clean install
```

3. **Démarrer les services** (dans l'ordre)
```bash
# Auth Service
cd auth-service && mvn spring-boot:run &

# Patient Service
cd patient-service && mvn spring-boot:run &

# Doctor Service
cd doctor-service && mvn spring-boot:run &

# Appointment Service
cd appointment-service && mvn spring-boot:run &

# Payment Service
cd payment-service && mvn spring-boot:run &

# Video Service
cd video-service && mvn spring-boot:run &

# Notification Service
cd notification-service && mvn spring-boot:run &

# API Gateway
cd gateway-service && mvn spring-boot:run
```

4. **Démarrer le frontend**
```bash
cd frontend
npm install
npm run dev
```

## 🔗 URLs

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080/graphql
- **GraphQL Playground**: http://localhost:8080/graphiql

## 📊 Base de Données

Le schéma PostgreSQL sera créé automatiquement au démarrage via Flyway/Liquibase.

Tables principales:
- `users` - Comptes utilisateurs
- `patients` - Profils patients
- `doctors` - Profils médecins
- `availabilities` - Disponibilités des médecins
- `appointments` - Rendez-vous
- `payments` - Paiements
- `online_consultations` - Consultations vidéo
- `refresh_tokens` - Tokens JWT

## 🔐 Sécurité

- Authentification JWT
- Rôles: `PATIENT`, `DOCTOR`, `ADMIN`
- Mots de passe chiffrés avec BCrypt
- HTTPS en production
- Validation des entrées

## 📖 Documentation

Voir le fichier [implementation_plan.md](C:\Users\33656\.gemini\antigravity\brain\c2416033-773b-48e7-8d46-89b78a53881c\implementation_plan.md) pour l'architecture détaillée.

## 🧪 Tests

```bash
# Tests unitaires
mvn test

# Tests d'intégration
mvn verify
```

## 📝 Licence

MIT