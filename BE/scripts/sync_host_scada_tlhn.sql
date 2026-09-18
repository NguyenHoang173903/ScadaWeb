-- =============================================================================
-- Sync host DB scada_tlhn @ 100.99.230.105 to match BE EF mappings.
-- Idempotent. Does NOT drop existing ERD SCADA tables/data.
-- Source of truth: BE IEntityTypeConfiguration + bootstrap scripts.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS app;

-- -----------------------------------------------------------------------------
-- 1) public."Users" (ScadaUser) — MISSING on host ERD dump
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."Users" (
    "Id"                bigserial PRIMARY KEY,
    "Username"          text NOT NULL,
    "PasswordHash"      text NOT NULL,
    "FullName"          text NOT NULL,
    "Email"             text NULL,
    "Role"              text NOT NULL,
    "IsActive"          boolean NOT NULL DEFAULT true,
    "CreatedTime"       timestamptz NOT NULL DEFAULT now(),
    "UpdatedTime"       timestamptz NOT NULL DEFAULT now(),
    -- security / profile extensions required by auth flows
    "LastLoginAt"       timestamptz NULL,
    "Unit"              text NULL,
    "Level"             integer NULL,
    "Department"        text NULL,
    "Position"          text NULL,
    "Description"       text NULL,
    "CreatedBy"         text NULL,
    "UpdatedBy"         text NULL,
    "MustChangePassword" boolean NOT NULL DEFAULT false,
    "PasswordUpdatedAt" timestamptz NULL,
    "FailedLoginCount"  integer NOT NULL DEFAULT 0,
    "LockoutUntil"      timestamptz NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Username" ON public."Users" ("Username");

ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "LastLoginAt" timestamptz NULL;
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "Unit" text NULL;
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "Level" integer NULL;
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "Department" text NULL;
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "Position" text NULL;
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "Description" text NULL;
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "CreatedBy" text NULL;
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "UpdatedBy" text NULL;
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "MustChangePassword" boolean NOT NULL DEFAULT false;
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "PasswordUpdatedAt" timestamptz NULL;
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "FailedLoginCount" integer NOT NULL DEFAULT 0;
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "LockoutUntil" timestamptz NULL;

-- -----------------------------------------------------------------------------
-- 2) ERD column extensions
-- -----------------------------------------------------------------------------
ALTER TABLE public."Device" ADD COLUMN IF NOT EXISTS "DeviceTypeId" integer NULL;
ALTER TABLE public."Tag" ADD COLUMN IF NOT EXISTS "IsActive" boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='Device' AND column_name='DeviceTypeId'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name='DeviceType'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'FK_Device_DeviceType'
    ) THEN
      ALTER TABLE public."Device"
        ADD CONSTRAINT "FK_Device_DeviceType"
        FOREIGN KEY ("DeviceTypeId") REFERENCES public."DeviceType"("Id")
        ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3) history_30s + UserActivityLogs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.history_30s (
    "Time"  timestamptz NOT NULL,
    "TagId" bigint NOT NULL,
    "Value" double precision NOT NULL,
    PRIMARY KEY ("Time", "TagId")
);
CREATE INDEX IF NOT EXISTS "IX_history_30s_TagId_Time" ON public.history_30s ("TagId", "Time");

CREATE TABLE IF NOT EXISTS public."UserActivityLogs" (
    "Id"          bigserial PRIMARY KEY,
    "CreatedAt"   timestamptz NOT NULL DEFAULT now(),
    "UserId"      bigint NULL,
    "UserName"    text NULL,
    "Role"        text NULL,
    "ActionType"  text NOT NULL,
    "Module"      text NULL,
    "Description" text NULL,
    "IPAddress"   text NULL,
    "Status"      text NULL
);
CREATE INDEX IF NOT EXISTS "IX_UserActivityLogs_CreatedAt" ON public."UserActivityLogs" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_UserActivityLogs_UserName" ON public."UserActivityLogs" ("UserName");
CREATE INDEX IF NOT EXISTS "IX_UserActivityLogs_ActionType" ON public."UserActivityLogs" ("ActionType");
CREATE INDEX IF NOT EXISTS "IX_UserActivityLogs_UserId" ON public."UserActivityLogs" ("UserId");

-- -----------------------------------------------------------------------------
-- 4) App auth / audit / settings (SCADA runtime)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app.refresh_tokens (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES public."Users"("Id") ON DELETE CASCADE,
    token_hash varchar(128) NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz NULL,
    revoked_by_ip varchar(50) NULL,
    created_by_ip varchar(50) NULL,
    replaced_by_token_id bigint NULL,
    session_id varchar(64) NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_refresh_tokens_token_hash" ON app.refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS "IX_refresh_tokens_user_id" ON app.refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS "IX_refresh_tokens_session_id" ON app.refresh_tokens (session_id);

CREATE TABLE IF NOT EXISTS app.password_reset_tokens (
    id bigserial PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES public."Users"("Id") ON DELETE CASCADE,
    token_hash varchar(128) NOT NULL,
    expires_at timestamptz NOT NULL,
    used_at timestamptz NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_password_reset_tokens_token_hash" ON app.password_reset_tokens (token_hash);
CREATE INDEX IF NOT EXISTS "IX_password_reset_tokens_user_id" ON app.password_reset_tokens (user_id);

CREATE TABLE IF NOT EXISTS app.system_audit_logs (
    id bigserial PRIMARY KEY,
    action varchar(100) NOT NULL,
    event_type varchar(50) NOT NULL,
    status varchar(20) NOT NULL,
    user_id bigint NULL,
    user_name varchar(100) NULL,
    description text NULL,
    module varchar(100) NULL,
    endpoint varchar(300) NULL,
    http_method varchar(10) NULL,
    http_status_code integer NULL,
    ip_address varchar(64) NULL,
    user_agent varchar(512) NULL,
    entity_type varchar(100) NULL,
    entity_id varchar(100) NULL,
    correlation_id varchar(100) NULL,
    additional_data jsonb NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS "IX_system_audit_logs_created_at" ON app.system_audit_logs (created_at);
CREATE INDEX IF NOT EXISTS "IX_system_audit_logs_action" ON app.system_audit_logs (action);
CREATE INDEX IF NOT EXISTS "IX_system_audit_logs_user_name" ON app.system_audit_logs (user_name);

CREATE TABLE IF NOT EXISTS app.app_settings (
    id bigserial PRIMARY KEY,
    setting_key varchar(100) NOT NULL,
    setting_value text NULL,
    data_type varchar(50) NOT NULL,
    description text NULL,
    is_enable boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_app_settings_setting_key" ON app.app_settings (setting_key);

CREATE TABLE IF NOT EXISTS app.system_licenses (
    "Id" uuid PRIMARY KEY,
    "LicenseKey" varchar(200) NOT NULL,
    "MaxConcurrentUsers" integer NOT NULL,
    "IsEnabled" boolean NOT NULL DEFAULT true,
    "Description" varchar(500) NULL,
    "ValidFrom" timestamptz NULL,
    "ValidTo" timestamptz NULL,
    "CreatedAt" timestamptz NOT NULL DEFAULT now(),
    "CreatedBy" varchar(100) NULL,
    "ModifiedAt" timestamptz NULL,
    "ModifiedBy" varchar(100) NULL,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "DeletedAt" timestamptz NULL,
    "DeletedBy" varchar(100) NULL
);

CREATE TABLE IF NOT EXISTS app.tag_screen_mapping (
    id bigserial PRIMARY KEY,
    tag_id bigint NOT NULL REFERENCES public."Tag"("Id") ON DELETE CASCADE,
    screen_type integer NOT NULL,
    is_realtime boolean NOT NULL DEFAULT true,
    mapping_label varchar(200) NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_tag_screen_mapping_tag_screen" ON app.tag_screen_mapping (tag_id, screen_type);

CREATE TABLE IF NOT EXISTS app.communication_config (
    id bigserial PRIMARY KEY,
    code varchar(50) NOT NULL,
    name varchar(100) NOT NULL,
    protocol varchar(50) NOT NULL,
    description text NULL,
    is_enable boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_communication_config_code" ON app.communication_config (code);

CREATE TABLE IF NOT EXISTS app.mqtt_config (
    id bigserial PRIMARY KEY,
    code varchar(50) NOT NULL,
    name varchar(100) NOT NULL,
    broker varchar(255) NOT NULL,
    port integer NOT NULL,
    username varchar(100) NULL,
    password varchar(255) NULL,
    client_id varchar(100) NULL,
    topic_publish varchar(255) NULL,
    topic_subscribe varchar(255) NULL,
    keep_alive integer NOT NULL DEFAULT 60,
    qos integer NOT NULL DEFAULT 0,
    retain boolean NOT NULL DEFAULT false,
    use_tls boolean NOT NULL DEFAULT false,
    is_enable boolean NOT NULL DEFAULT true,
    description text NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_mqtt_config_code" ON app.mqtt_config (code);

CREATE TABLE IF NOT EXISTS app.event_logs (
    id bigserial PRIMARY KEY,
    time timestamptz NOT NULL,
    level varchar(30) NOT NULL,
    module varchar(100) NOT NULL,
    message text NOT NULL,
    exception text NULL,
    machine varchar(100) NULL
);
CREATE INDEX IF NOT EXISTS "IX_event_logs_time" ON app.event_logs (time);

CREATE TABLE IF NOT EXISTS app.map_layers
(
    "Id"            uuid PRIMARY KEY,
    "Name"          varchar(200)  NOT NULL,
    "FileName"      varchar(260)  NOT NULL,
    "StoragePath"   varchar(500)  NOT NULL,
    "ContentType"   varchar(120)  NOT NULL,
    "Opacity"       numeric(5,4)  NOT NULL DEFAULT 1,
    "Weight"        numeric(8,2)  NOT NULL DEFAULT 2,
    "Visible"       boolean       NOT NULL DEFAULT true,
    "Color"         varchar(32)   NOT NULL DEFAULT '#3388ff',
    "SortOrder"     integer       NOT NULL DEFAULT 0,
    "CreatedBy"     text          NULL,
    "ModifiedBy"    text          NULL,
    "IsDeleted"     boolean       NOT NULL DEFAULT false,
    "DeletedDate"   timestamp without time zone NULL,
    "DeletedBy"     text          NULL,
    "CreatedDate"   timestamp without time zone NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "ModifiedDate"  timestamp without time zone NULL
);
CREATE INDEX IF NOT EXISTS "IX_map_layers_IsDeleted" ON app.map_layers ("IsDeleted");

CREATE TABLE IF NOT EXISTS app."AuditLogs"
(
    "Id"             uuid PRIMARY KEY,
    "EntityName"     varchar(100) NOT NULL,
    "EntityId"       varchar(100) NULL,
    "Action"         varchar(50)  NOT NULL,
    "UserId"         varchar(100) NULL,
    "UserName"       varchar(100) NULL,
    "OldValues"      text NULL,
    "NewValues"      text NULL,
    "IpAddress"      varchar(64) NULL,
    "CorrelationId"  varchar(100) NULL,
    "CreatedDate"    timestamptz NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "ModifiedDate"   timestamptz NULL
);
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_CreatedDate" ON app."AuditLogs" ("CreatedDate");
CREATE INDEX IF NOT EXISTS "IX_AuditLogs_EntityName_EntityId" ON app."AuditLogs" ("EntityName", "EntityId");

-- -----------------------------------------------------------------------------
-- 5) IAM placeholder tables (app default schema) — EF convention column names
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app."Users" (
    "Id" uuid PRIMARY KEY,
    "Email" varchar(256) NOT NULL,
    "FirstName" varchar(100) NOT NULL DEFAULT '',
    "LastName" varchar(100) NOT NULL DEFAULT '',
    "PasswordHash" varchar(500) NOT NULL DEFAULT '',
    "PhoneNumber" varchar(20) NULL,
    "Status" varchar(30) NOT NULL DEFAULT 'Active',
    "FailedLoginAttempts" integer NOT NULL DEFAULT 0,
    "LockoutEndUtc" timestamptz NULL,
    "LastLoginAtUtc" timestamptz NULL,
    "CreatedDate" timestamp without time zone NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "ModifiedDate" timestamp without time zone NULL,
    "CreatedBy" varchar(100) NULL,
    "ModifiedBy" varchar(100) NULL,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "DeletedDate" timestamp without time zone NULL,
    "DeletedBy" varchar(100) NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_app_Users_Email" ON app."Users" ("Email");

CREATE TABLE IF NOT EXISTS app."Roles" (
    "Id" uuid PRIMARY KEY,
    "Name" varchar(100) NOT NULL,
    "Description" varchar(500) NULL,
    "IsSystemRole" boolean NOT NULL DEFAULT false,
    "CreatedDate" timestamp without time zone NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "ModifiedDate" timestamp without time zone NULL,
    "CreatedBy" varchar(100) NULL,
    "ModifiedBy" varchar(100) NULL,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "DeletedDate" timestamp without time zone NULL,
    "DeletedBy" varchar(100) NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_app_Roles_Name" ON app."Roles" ("Name");

CREATE TABLE IF NOT EXISTS app."Permissions" (
    "Id" uuid PRIMARY KEY,
    "Name" varchar(150) NOT NULL,
    "Module" varchar(100) NOT NULL,
    "Description" varchar(500) NULL,
    "CreatedDate" timestamp without time zone NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "ModifiedDate" timestamp without time zone NULL,
    "CreatedBy" varchar(100) NULL,
    "ModifiedBy" varchar(100) NULL,
    "IsDeleted" boolean NOT NULL DEFAULT false,
    "DeletedDate" timestamp without time zone NULL,
    "DeletedBy" varchar(100) NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_app_Permissions_Name" ON app."Permissions" ("Name");

CREATE TABLE IF NOT EXISTS app."RolePermissions" (
    "Id" uuid PRIMARY KEY,
    "RoleId" uuid NOT NULL REFERENCES app."Roles"("Id") ON DELETE CASCADE,
    "PermissionId" uuid NOT NULL REFERENCES app."Permissions"("Id") ON DELETE CASCADE,
    "CreatedDate" timestamp without time zone NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "ModifiedDate" timestamp without time zone NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_RolePermissions_Role_Permission" ON app."RolePermissions" ("RoleId", "PermissionId");

CREATE TABLE IF NOT EXISTS app."UserRoles" (
    "Id" uuid PRIMARY KEY,
    "UserId" uuid NOT NULL REFERENCES app."Users"("Id") ON DELETE CASCADE,
    "RoleId" uuid NOT NULL REFERENCES app."Roles"("Id") ON DELETE RESTRICT,
    "AssignedAtUtc" timestamptz NOT NULL DEFAULT now(),
    "CreatedDate" timestamp without time zone NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "ModifiedDate" timestamp without time zone NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserRoles_User_Role" ON app."UserRoles" ("UserId", "RoleId");

CREATE TABLE IF NOT EXISTS app."RefreshTokens" (
    "Id" uuid PRIMARY KEY,
    "UserId" uuid NOT NULL REFERENCES app."Users"("Id") ON DELETE CASCADE,
    "Token" varchar(500) NOT NULL,
    "ExpiresAtUtc" timestamptz NOT NULL,
    "CreatedByIp" varchar(64) NULL,
    "RevokedAtUtc" timestamptz NULL,
    "RevokedByIp" varchar(64) NULL,
    "ReplacedByToken" varchar(500) NULL,
    "CreatedDate" timestamp without time zone NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
    "ModifiedDate" timestamp without time zone NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_RefreshTokens_Token" ON app."RefreshTokens" ("Token");

-- -----------------------------------------------------------------------------
-- 6) Default settings
-- -----------------------------------------------------------------------------
INSERT INTO app.app_settings (setting_key, setting_value, data_type, description, is_enable, created_at, updated_at)
SELECT 'session.idleTimeoutMinutes', '10', 'int', 'FE idle timeout (minutes)', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM app.app_settings WHERE setting_key = 'session.idleTimeoutMinutes');
