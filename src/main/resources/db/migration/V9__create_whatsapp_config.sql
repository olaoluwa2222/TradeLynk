-- WhatsApp configuration for each seller store
CREATE TABLE whatsapp_configs (
                                  id BIGSERIAL PRIMARY KEY,
                                  seller_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Meta WhatsApp API credentials
                                  phone_number_id VARCHAR(50) NOT NULL,
                                  phone_number VARCHAR(20) NOT NULL,
                                  access_token TEXT NOT NULL,
                                  webhook_verify_token VARCHAR(100) NOT NULL,

    -- Status
                                  status VARCHAR(20) DEFAULT 'PENDING_SETUP',
                                  is_enabled BOOLEAN DEFAULT TRUE,

    -- Analytics
                                  total_conversations INTEGER DEFAULT 0,
                                  total_messages_sent INTEGER DEFAULT 0,
                                  total_messages_received INTEGER DEFAULT 0,
                                  last_message_at TIMESTAMP,

    -- Timestamps
                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                  CONSTRAINT unique_phone_number_id UNIQUE (phone_number_id),
                                  CONSTRAINT unique_phone_number UNIQUE (phone_number)
);

CREATE INDEX idx_whatsapp_configs_seller ON whatsapp_configs(seller_id);
CREATE INDEX idx_whatsapp_configs_status ON whatsapp_configs(status);
CREATE INDEX idx_whatsapp_configs_phone_id ON whatsapp_configs(phone_number_id);

-- Conversation tracking
CREATE TABLE whatsapp_conversations (
                                        id BIGSERIAL PRIMARY KEY,
                                        seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                        customer_phone VARCHAR(20) NOT NULL,

                                        last_message TEXT,
                                        message_count INTEGER DEFAULT 0,
                                        context JSONB DEFAULT '{}',

                                        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                        CONSTRAINT unique_seller_customer UNIQUE (seller_id, customer_phone)
);

CREATE INDEX idx_conversations_seller ON whatsapp_conversations(seller_id);
CREATE INDEX idx_conversations_customer ON whatsapp_conversations(customer_phone);
CREATE INDEX idx_conversations_last_message ON whatsapp_conversations(last_message_at);