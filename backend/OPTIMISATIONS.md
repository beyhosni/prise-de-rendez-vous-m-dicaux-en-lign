# Guide d'implémentation des optimisations PostgreSQL et Redis

## Table des matières

1. [Optimisations PostgreSQL](#optimisations-postgresql)
2. [Configuration de Redis](#configuration-de-redis)
3. [Mise en cache des requêtes](#mise-en-cache-des-requêtes)
4. [Réplication de la base de données](#réplication-de-la-base-de-données)
5. [Monitoring et maintenance](#monitoring-et-maintenance)

## Optimisations PostgreSQL

### Indexation des colonnes fréquemment interrogées

Pour appliquer les indexations créées dans `database/migrations/optimizations.sql` :

```bash
# Connectez-vous à votre base de données PostgreSQL
psql -h localhost -U postgres -d medapp

# Exécutez le script d'optimisations
\i backend/database/migrations/optimizations.sql
```

### Partitionnement des tables volumineuses

Le partitionnement est déjà configuré dans le script d'optimisations. Pour ajouter de nouvelles partitions mensuelles :

```sql
-- Créer une nouvelle partition pour le mois en cours
CREATE TABLE appointments_y2023m12 PARTITION OF appointments
    FOR VALUES FROM ('2023-12-01') TO ('2024-01-01');

-- Créer une nouvelle partition pour les messages
CREATE TABLE messages_y2023m12 PARTITION OF messages
    FOR VALUES FROM ('2023-12-01') TO ('2024-01-01');
```

### Configuration du pool de connexions

1. Installez PgBouncer :
```bash
sudo apt-get install pgbouncer
```

2. Copiez le fichier de configuration :
```bash
sudo cp backend/config/pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
```

3. Créez le fichier d'utilisateurs :
```bash
sudo nano /etc/pgbouncer/userlist.txt
# Ajoutez cette ligne :
"postgres" "your_password"
```

4. Démarrez PgBouncer :
```bash
sudo systemctl enable pgbouncer
sudo systemctl start pgbouncer
```

## Configuration de Redis

### Installation et configuration

1. Installez Redis :
```bash
sudo apt-get update
sudo apt-get install redis-server
```

2. Copiez le fichier de configuration :
```bash
sudo cp backend/config/redis.conf /etc/redis/redis.conf
```

3. Redémarrez Redis :
```bash
sudo systemctl restart redis-server
```

### Configuration de la persistance

Les paramètres de persistance sont déjà configurés dans le fichier `redis.conf`. Pour vérifier que Redis fonctionne correctement :

```bash
redis-cli ping
# Devrait retourner : PONG
```

## Mise en cache des requêtes

### Intégration dans l'application

1. Initialisez les services d'optimisation dans votre fichier principal (app.js ou index.js) :

```javascript
const OptimizationConfig = require('./src/config/optimization.config');

// Après avoir créé votre serveur HTTP
OptimizationConfig.initialize(server);

// Configurez l'arrêt gracieux
OptimizationConfig.setupGracefulShutdown();
```

2. Utilisez le middleware de cache GraphQL :

```javascript
const graphqlCacheMiddleware = require('./src/middleware/graphqlCache.middleware');

// Appliquez le middleware avant votre route GraphQL
app.use('/graphql', graphqlCacheMiddleware({
  enabledQueries: ['GetDoctors', 'GetDoctor', 'GetAppointments'],
  defaultTTL: 300
}));
```

3. Utilisez le service de cache directement dans vos résolveurs :

```javascript
const cacheService = require('./src/services/cache.service');

// Dans un résolveur GraphQL
const doctors = await cacheService.getOrSet(
  `doctors:${specialty || 'all'}:${city || 'all'}`,
  async () => await doctorRepository.findAll({ specialty, city }),
  600 // 10 minutes
);
```

## Réplication de la base de données

### Configuration du serveur maître

1. Appliquez la configuration de réplication :
```bash
# Copiez le fichier de configuration PostgreSQL
sudo cp backend/config/postgresql.conf /etc/postgresql/14/main/postgresql.conf

# Modifiez pg_hba.conf pour autoriser les connexions de réplication
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Ajoutez : host replication replicator replica_ip/32 md5

# Redémarrez PostgreSQL
sudo systemctl restart postgresql
```

2. Exécutez le script de configuration de la réplication :
```bash
psql -h localhost -U postgres -d medapp -f backend/config/replication-setup.sql
```

### Configuration du serveur réplica

1. Arrêtez PostgreSQL sur le réplica :
```bash
sudo systemctl stop postgresql
```

2. Effectuez une sauvegarde de base physique depuis le maître :
```bash
pg_basebackup -h master_ip -D /var/lib/postgresql/14/main -U replicator -v -P -W
```

3. Configurez le réplica en suivant les instructions dans `replication-setup.sql`.

## Monitoring et maintenance

### Monitoring de PostgreSQL

1. Installez l'extension pg_stat_statements :
```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

2. Surveillez les requêtes lentes :
```sql
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Monitoring de Redis

1. Vérifiez l'utilisation de la mémoire :
```bash
redis-cli info memory
```

2. Surveillez les clés expirées :
```bash
redis-cli info stats | grep expired
```

### Maintenance régulière

1. Nettoyage des sessions expirées (automatique via le service de session) :
```javascript
// Manuellement si nécessaire
const sessionService = require('./src/services/session.service');
const cleanedCount = await sessionService.cleanupExpiredSessions();
console.log(`${cleanedCount} sessions expirées ont été nettoyées`);
```

2. Mise à jour des statistiques PostgreSQL :
```sql
ANALYZE;
```

3. Réorganisation des tables fragmentées :
```sql
REINDEX DATABASE medapp;
VACUUM FULL ANALYZE;
```

## Dépannage

### Problèmes courants

1. **Connexion refusée à Redis**
   - Vérifiez que Redis est en cours d'exécution : `sudo systemctl status redis-server`
   - Vérifiez le fichier de configuration : `sudo nano /etc/redis/redis.conf`

2. **La réplication ne fonctionne pas**
   - Vérifiez la connectivité réseau entre le maître et le réplica
   - Consultez les logs PostgreSQL : `sudo tail -f /var/log/postgresql/postgresql-14-main.log`

3. **Performances dégradées après optimisation**
   - Vérifiez les plans d'exécution avec `EXPLAIN ANALYZE`
   - Surveillez les statistiques avec `pg_stat_statements`

### Ressources supplémentaires

- [Documentation PostgreSQL](https://www.postgresql.org/docs/current/)
- [Documentation Redis](https://redis.io/documentation)
- [Guide PgBouncer](https://pgbouncer.github.io/)
