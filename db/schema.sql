SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: main; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA main;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    NEW.updated_at = CURRENT_TIMESTAMP;
    return NEW;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: dashboard; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main.dashboard (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    owner_uuid uuid NOT NULL,
    name text NOT NULL,
    stars_count integer DEFAULT 0 NOT NULL,
    visibility character varying(7) NOT NULL,
    execution_count integer DEFAULT 0 NOT NULL,
    CONSTRAINT dashboard_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['private'::character varying, 'public'::character varying])::text[])))
);


--
-- Name: execution; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main.execution (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_uuid uuid NOT NULL,
    dashboard_uuid uuid NOT NULL,
    blockchain text NOT NULL,
    signed_data_payload jsonb NOT NULL,
    gas_used numeric DEFAULT 0 NOT NULL,
    status character varying(9) NOT NULL,
    CONSTRAINT execution_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: user; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main."user" (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    wallet_address text NOT NULL,
    last_active timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    login_message text DEFAULT ''::text NOT NULL,
    login_signature text DEFAULT ''::text NOT NULL
);


--
-- Name: user_stars; Type: TABLE; Schema: main; Owner: -
--

CREATE TABLE main.user_stars (
    uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_uuid uuid NOT NULL,
    dashboard_uuid uuid NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(128) NOT NULL
);


--
-- Name: dashboard dashboard_owner_uuid_name_key; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.dashboard
    ADD CONSTRAINT dashboard_owner_uuid_name_key UNIQUE (owner_uuid, name);


--
-- Name: dashboard dashboard_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.dashboard
    ADD CONSTRAINT dashboard_pkey PRIMARY KEY (uuid);


--
-- Name: execution execution_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.execution
    ADD CONSTRAINT execution_pkey PRIMARY KEY (uuid);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (uuid);


--
-- Name: user_stars user_stars_pkey; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.user_stars
    ADD CONSTRAINT user_stars_pkey PRIMARY KEY (uuid);


--
-- Name: user_stars user_stars_user_uuid_dashboard_uuid_key; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.user_stars
    ADD CONSTRAINT user_stars_user_uuid_dashboard_uuid_key UNIQUE (user_uuid, dashboard_uuid);


--
-- Name: user user_wallet_address_key; Type: CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main."user"
    ADD CONSTRAINT user_wallet_address_key UNIQUE (wallet_address);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: idx_dashboard_owner; Type: INDEX; Schema: main; Owner: -
--

CREATE INDEX idx_dashboard_owner ON main.dashboard USING btree (owner_uuid);


--
-- Name: idx_dashboard_visibility; Type: INDEX; Schema: main; Owner: -
--

CREATE INDEX idx_dashboard_visibility ON main.dashboard USING btree (visibility);


--
-- Name: dashboard updated_at; Type: TRIGGER; Schema: main; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON main.dashboard FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: execution updated_at; Type: TRIGGER; Schema: main; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON main.execution FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: user updated_at; Type: TRIGGER; Schema: main; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON main."user" FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: user_stars updated_at; Type: TRIGGER; Schema: main; Owner: -
--

CREATE TRIGGER updated_at BEFORE UPDATE ON main.user_stars FOR EACH ROW EXECUTE FUNCTION public.updated_at();


--
-- Name: dashboard dashboard_owner_uuid_fkey; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.dashboard
    ADD CONSTRAINT dashboard_owner_uuid_fkey FOREIGN KEY (owner_uuid) REFERENCES main."user"(uuid);


--
-- Name: execution execution_dashboard_uuid_fkey; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.execution
    ADD CONSTRAINT execution_dashboard_uuid_fkey FOREIGN KEY (dashboard_uuid) REFERENCES main.dashboard(uuid);


--
-- Name: execution execution_user_uuid_fkey; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.execution
    ADD CONSTRAINT execution_user_uuid_fkey FOREIGN KEY (user_uuid) REFERENCES main."user"(uuid);


--
-- Name: user_stars user_stars_dashboard_uuid_fkey; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.user_stars
    ADD CONSTRAINT user_stars_dashboard_uuid_fkey FOREIGN KEY (dashboard_uuid) REFERENCES main.dashboard(uuid);


--
-- Name: user_stars user_stars_user_uuid_fkey; Type: FK CONSTRAINT; Schema: main; Owner: -
--

ALTER TABLE ONLY main.user_stars
    ADD CONSTRAINT user_stars_user_uuid_fkey FOREIGN KEY (user_uuid) REFERENCES main."user"(uuid);


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20250205000000');
