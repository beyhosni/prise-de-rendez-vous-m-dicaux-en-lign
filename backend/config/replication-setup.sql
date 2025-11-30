-- Configuration de la réplication PostgreSQL pour la base de données de rendez-vous médicaux

-- Sur le serveur maître (primary)

-- 1. Créer un utilisateur pour la réplication
CREATE ROLE replicator WITH LOGIN REPLICATION PASSWORD 'replicator_password';

-- 2. Modifier le fichier postgresql.conf pour activer la réplication
-- wal_level = replica
-- max_wal_senders = 3
-- max_replication_slots = 3
-- wal_keep_size = 1GB
-- archive_mode = on
-- archive_command = 'cp %p /var/lib/postgresql/archive/%f'

-- 3. Modifier le fichier pg_hba.conf pour autoriser les connexions de réplication
-- host replication replicator replica_ip/32 md5

-- 4. Redémarrer PostgreSQL pour appliquer les changements

-- 5. Créer un slot de réplication
SELECT * FROM pg_create_physical_replication_slot('replication_slot');

-- Sur le serveur réplica (standby)

-- 1. Arrêter PostgreSQL

-- 2. Effectuer une sauvegarde de base physique du serveur maître
-- pg_basebackup -h master_ip -D /var/lib/postgresql/data -U replicator -v -P -W

-- 3. Créer le fichier recovery.conf dans le répertoire de données du réplica
-- standby_mode = 'on'
-- primary_conninfo = 'host=master_ip port=5432 user=replicator password=replicator_password'
-- restore_command = 'cp /var/lib/postgresql/archive/%f %p'
-- recovery_target_timeline = 'latest'

-- 4. Démarrer PostgreSQL sur le réplica

-- Vérification de la réplication

-- Sur le maître, vérifier les processus d'envoi WAL
SELECT pid, state, client_addr, sync_state, replay_lag 
FROM pg_stat_replication;

-- Sur le réplica, vérifier la réception des WAL
SELECT pid, state, last_sent_location, last_write_location, last_replay_location, 
       reply_time, now() - reply_time AS replication_lag
FROM pg_stat_wal_receiver;

-- Monitoring de la réplication

-- Créer une vue pour surveiller la réplication
CREATE OR REPLACE VIEW replication_status AS
SELECT 
  'primary' AS server_type,
  pg_current_wal_lsn() AS current_lsn,
  (SELECT count(*) FROM pg_stat_replication) AS replica_count
UNION ALL
SELECT 
  'standby' AS server_type,
  pg_last_wal_replay_lsn() AS current_lsn,
  (SELECT count(*) FROM pg_stat_wal_receiver) AS replica_count;

-- Surveillance du décalage de réplication
CREATE OR REPLACE VIEW replication_lag AS
SELECT 
  client_addr,
  state,
  sync_state,
  pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes,
  pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) / 1024 / 1024 AS lag_mb
FROM pg_stat_replication;

-- Configuration de la réplication synchrone (optionnel)

-- Sur le maître, modifier postgresql.conf
-- synchronous_standby_names = 'replica1,replica2'

-- Sur le réplica, modifier recovery.conf
-- synchronous_commit = on

-- Basculement manuel (failover)

-- Sur le réplica, promouvoir en maître
-- SELECT pg_promote();

-- Configuration de la réplication logique (alternative à la réplication physique)

-- Sur le maître
-- CREATE PUBLICATION medapp_publication FOR ALL TABLES;

-- Sur le réplica
-- CREATE SUBSCRIPTION medapp_subscription 
-- CONNECTION 'host=master_ip port=5432 dbname=medapp user=replicator password=replicator_password' 
-- PUBLICATION medapp_publication;
