CREATE DATABASE dispatch
  WITH OWNER = postgres
       ENCODING = 'UTF8'
       TABLESPACE = pg_default
       CONNECTION LIMIT = -1;

-- Table: events

-- DROP TABLE events;

CREATE TABLE events
(
  incident text, -- Intrusion detector, Armed, Alarmed, etc
  object_id text,
  params text,
  "time" timestamp without time zone,
  type text, -- Usually CAM
  operator text,
  state text, -- New, In Progress, Resolved, Closed
  comment text, -- Operator comment abour incident
  response_time timestamp without time zone,
  resolution_time timestamp without time zone,
  priority text, -- High, Medium, Low
  procedure text, -- â€˜Started monitoring the incidentâ€™...
  action text, -- Transfer,False Alarm,Export Incident
  id bigserial NOT NULL,
  name text,
  cam_id text,
  CONSTRAINT events_pkey PRIMARY KEY (id )
)
WITH (
  OIDS=FALSE
);
ALTER TABLE events
  OWNER TO postgres;
COMMENT ON COLUMN events.incident IS 'Intrusion detector, Armed, Alarmed, etc';
COMMENT ON COLUMN events.type IS 'Usually CAM
';
COMMENT ON COLUMN events.state IS 'New, In Progress, Resolved, Closed';
COMMENT ON COLUMN events.comment IS 'Operator comment abour incident';
COMMENT ON COLUMN events.priority IS 'High, Medium, Low';
COMMENT ON COLUMN events.action IS 'Transfer,False Alarm,Export Incident';

-- Table: logs

-- DROP TABLE logs;

CREATE TABLE logs
(
  id bigserial NOT NULL,
  incident_id bigint,
  "time" timestamp without time zone,
  operator text,
  event text,
  CONSTRAINT logs_pkey PRIMARY KEY (id )
)
WITH (
  OIDS=FALSE
);
ALTER TABLE logs
  OWNER TO postgres;

-- Table: public.comments

-- DROP TABLE public.comments;

CREATE TABLE public.comments
(
    panel text COLLATE pg_catalog."default",
    comment text COLLATE pg_catalog."default",
    date timestamp without time zone,
    "user" text COLLATE pg_catalog."default",
    eventid text COLLATE pg_catalog."default"
)

TABLESPACE pg_default;

ALTER TABLE public.comments
    OWNER to postgres;