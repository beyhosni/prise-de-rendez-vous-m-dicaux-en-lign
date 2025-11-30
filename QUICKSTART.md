# Guide de Démarrage Rapide

## Prérequis

- Java 17 ou supérieur
- Maven 3.8+
- PostgreSQL 15+
- Node.js 18+ (pour le frontend)
- Docker & Docker Compose (optionnel mais recommandé)

## Option 1: Démarrage avec Docker Compose (Recommandé)

### 1. Cloner le projet

```bash
git clone <repository-url>
cd prise-de-rendez-vous-m-dicaux-en-lign
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
# Éditer .env avec vos propres valeurs
```

**Important**: Modifiez au minimum:
- `JWT_SECRET`: Utilisez une clé secrète forte (minimum 256 bits)
- `STRIPE_API_KEY`: Votre clé API Stripe de test
- `SMTP_USERNAME` et `SMTP_PASSWORD`: Vos identifiants email

### 3. Démarrer tous les services

```bash
docker-compose up --build
```

Cette commande va:
- Créer la base de données PostgreSQL
- Compiler et démarrer tous les microservices
- Démarrer le frontend React

### 4. Accéder à l'application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080/graphql
- **GraphQL Playground**: http://localhost:8080/graphiql

## Option 2: Démarrage Manuel (Développement)

### 1. Démarrer PostgreSQL

```bash
docker run -d \
  --name medical-postgres \
  -e POSTGRES_DB=medical_db \
  -e POSTGRES_USER=medical_user \
  -e POSTGRES_PASSWORD=medical_pass \
  -p 5432:5432 \
  postgres:15
```

### 2. Initialiser la base de données

```bash
psql -h localhost -U medical_user -d medical_db -f database/schema.sql
```

### 3. Compiler le projet

```bash
mvn clean install
```

### 4. Démarrer les services (dans des terminaux séparés)

```bash
# Terminal 1 - Auth Service
cd auth-service
mvn spring-boot:run

# Terminal 2 - Patient Service
cd patient-service
mvn spring-boot:run

# Terminal 3 - Doctor Service
cd doctor-service
mvn spring-boot:run

# Terminal 4 - Appointment Service
cd appointment-service
mvn spring-boot:run

# Terminal 5 - Payment Service
cd payment-service
mvn spring-boot:run

# Terminal 6 - Video Service
cd video-service
mvn spring-boot:run

# Terminal 7 - Notification Service
cd notification-service
mvn spring-boot:run

# Terminal 8 - API Gateway
cd gateway-service
mvn spring-boot:run
```

### 5. Démarrer le frontend

```bash
cd frontend
npm install
npm run dev
```

## Tester l'API avec GraphQL

### 1. Ouvrir GraphQL Playground

Accédez à http://localhost:8080/graphiql

### 2. Créer un compte patient

```graphql
mutation {
  registerPatient(input: {
    email: "patient@example.com"
    password: "SecurePass123!"
    firstName: "Jean"
    lastName: "Dupont"
    phone: "+33612345678"
    city: "Paris"
  }) {
    accessToken
    refreshToken
    user {
      id
      email
      role
      patient {
        firstName
        lastName
      }
    }
  }
}
```

### 3. Se connecter

```graphql
mutation {
  login(input: {
    email: "patient@example.com"
    password: "SecurePass123!"
  }) {
    accessToken
    refreshToken
    user {
      id
      email
      role
    }
  }
}
```

### 4. Utiliser le token

Copiez le `accessToken` et ajoutez-le dans les headers HTTP:

```json
{
  "Authorization": "Bearer <votre-access-token>"
}
```

### 5. Récupérer votre profil

```graphql
query {
  me {
    id
    email
    role
    patient {
      firstName
      lastName
      city
    }
  }
}
```

## Comptes de Test

La base de données est initialisée avec des comptes de test:

### Admin
- Email: `admin@medical.com`
- Password: `admin123`

### Médecin
- Email: `doctor1@medical.com`
- Password: `doctor123`
- Spécialité: Cardiologue

### Patient
- Email: `patient1@medical.com`
- Password: `patient123`

## Ports des Services

| Service | Port |
|---------|------|
| API Gateway | 8080 |
| Auth Service | 8081 |
| Patient Service | 8082 |
| Doctor Service | 8083 |
| Appointment Service | 8084 |
| Payment Service | 8085 |
| Video Service | 8086 |
| Notification Service | 8087 |
| Frontend React | 3000 |
| PostgreSQL | 5432 |

## Dépannage

### Erreur de connexion à la base de données

Vérifiez que PostgreSQL est démarré:
```bash
docker ps | grep postgres
```

### Port déjà utilisé

Si un port est déjà utilisé, modifiez-le dans `docker-compose.yml` ou dans le fichier `application.yml` du service concerné.

### Erreur de compilation Maven

Assurez-vous d'avoir Java 17:
```bash
java -version
```

### Problème de mémoire Docker

Augmentez la mémoire allouée à Docker (minimum 4GB recommandé).

## Prochaines Étapes

1. Explorez l'API GraphQL via GraphiQL
2. Testez les différentes mutations et queries
3. Consultez la documentation complète dans `implementation_plan.md`
4. Développez le frontend React selon vos besoins

## Support

Pour toute question ou problème, consultez:
- [Documentation complète](implementation_plan.md)
- [Schéma de base de données](database/schema.sql)
- [Architecture](README.md)
