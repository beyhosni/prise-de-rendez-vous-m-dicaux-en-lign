-- Optimisations PostgreSQL pour la base de données de rendez-vous médicaux

-- Index pour les tables d'utilisateurs
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Index pour les tables de rendez-vous
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON appointments(patient_id, appointment_date);

-- Index pour les tables de médecins
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_city ON doctors(city);
CREATE INDEX IF NOT EXISTS idx_doctors_verified ON doctors(is_verified);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty_city ON doctors(specialty, city);

-- Index pour les tables de messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);

-- Index pour les tables de documents
CREATE INDEX IF NOT EXISTS idx_documents_patient_id ON medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_doctor_id ON medical_documents(doctor_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON medical_documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON medical_documents(created_at);

-- Index pour les tables d'évaluations
CREATE INDEX IF NOT EXISTS idx_reviews_doctor_id ON reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_patient_id ON reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Index pour les tables de disponibilités
CREATE INDEX IF NOT EXISTS idx_availabilities_doctor_id ON doctor_availabilities(doctor_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_day ON doctor_availabilities(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availabilities_active ON doctor_availabilities(is_active);

-- Index pour les tables de notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at);

-- Index pour les tables de conversations
CREATE INDEX IF NOT EXISTS idx_conversations_patient_id ON conversations(patient_id);
CREATE INDEX IF NOT EXISTS idx_conversations_doctor_id ON conversations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);

-- Analyse des tables pour mettre à jour les statistiques
ANALYZE users;
ANALYZE doctors;
ANALYZE patients;
ANALYZE appointments;
ANALYZE messages;
ANALYZE medical_documents;
ANALYZE reviews;
ANALYZE doctor_availabilities;
ANALYZE notifications;
ANALYZE conversations;
