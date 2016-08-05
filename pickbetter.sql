--
-- PostgreSQL database dump
--

-- Dumped from database version 9.4.4
-- Dumped by pg_dump version 9.4.0
-- Started on 2016-06-13 15:23:43

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- TOC entry 188 (class 3079 OID 11855)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

-- CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2103 (class 0 OID 0)
-- Dependencies: 188
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

-- COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_with_oids = false;

--
-- TOC entry 187 (class 1259 OID 16698)
-- Name: email_verification_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE email_verification_statuses (
    id integer NOT NULL,
    name character varying NOT NULL
);


--
-- TOC entry 186 (class 1259 OID 16696)
-- Name: email_verification_statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE email_verification_statuses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2104 (class 0 OID 0)
-- Dependencies: 186
-- Name: email_verification_statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE email_verification_statuses_id_seq OWNED BY email_verification_statuses.id;


--
-- TOC entry 185 (class 1259 OID 16655)
-- Name: log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE log (
    id integer NOT NULL,
    action integer NOT NULL,
    headers json NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    ip_address character varying NOT NULL,
    "user" integer,
    thing1 integer,
    thing2 integer,
    thing1_start_elo integer,
    thing1_end_elo integer,
    thing2_start_elo integer,
    thing2_end_elo integer,
    thing_submitted integer,
    start_value character varying,
    end_value character varying
);


--
-- TOC entry 183 (class 1259 OID 16644)
-- Name: log_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE log_actions (
    id integer NOT NULL,
    name character varying NOT NULL
);


--
-- TOC entry 182 (class 1259 OID 16642)
-- Name: log_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE log_actions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2105 (class 0 OID 0)
-- Dependencies: 182
-- Name: log_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE log_actions_id_seq OWNED BY log_actions.id;


--
-- TOC entry 184 (class 1259 OID 16653)
-- Name: log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2106 (class 0 OID 0)
-- Dependencies: 184
-- Name: log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE log_id_seq OWNED BY log.id;


--
-- TOC entry 178 (class 1259 OID 16584)
-- Name: picture_credits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE picture_credits_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 174 (class 1259 OID 16536)
-- Name: picture_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE picture_credits (
    id integer DEFAULT nextval('picture_credits_id_seq'::regclass) NOT NULL,
    name character varying(50),
    url character varying(300)
);


--
-- TOC entry 177 (class 1259 OID 16581)
-- Name: pictures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE pictures_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 173 (class 1259 OID 16531)
-- Name: pictures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE pictures (
    id integer DEFAULT nextval('pictures_id_seq'::regclass) NOT NULL,
    filename character varying(32) NOT NULL,
    credit integer
);


--
-- TOC entry 181 (class 1259 OID 16633)
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- TOC entry 176 (class 1259 OID 16578)
-- Name: things_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE things_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 172 (class 1259 OID 16526)
-- Name: things; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE things (
    id integer DEFAULT nextval('things_id_seq'::regclass) NOT NULL,
    name character varying(30) NOT NULL,
    date_added timestamp with time zone DEFAULT now() NOT NULL,
    picture integer NOT NULL,
    elo integer DEFAULT 1000 NOT NULL,
    visibility smallint DEFAULT 0 NOT NULL,
    votes_for_or_against integer DEFAULT 0 NOT NULL,
    added_by integer
);


--
-- TOC entry 180 (class 1259 OID 16601)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE users (
    id integer NOT NULL,
    username character varying(20) NOT NULL,
    password character varying(60) NOT NULL,
    join_time timestamp with time zone DEFAULT now() NOT NULL,
    display_name character varying(20),
    email character varying(50),
    reset_token character varying(50),
    reset_request_time timestamp with time zone,
    email_verification_token character varying(50),
    email_verification_send_time timestamp with time zone,
    email_verification_status integer
);


--
-- TOC entry 179 (class 1259 OID 16599)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 2107 (class 0 OID 0)
-- Dependencies: 179
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- TOC entry 175 (class 1259 OID 16558)
-- Name: votes; Type: TABLE; Schema: public; Owner: -
--

--CREATE TABLE votes (
--    thing1 integer NOT NULL,
--    thing2 integer NOT NULL,
--    votes_for_thing1 integer DEFAULT 0 NOT NULL,
--    votes_for_thing2 integer DEFAULT 0 NOT NULL,
--    CONSTRAINT "Votes_check" CHECK ((thing1 < thing2))
--);


--
-- TOC entry 1945 (class 2604 OID 16701)
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY email_verification_statuses ALTER COLUMN id SET DEFAULT nextval('email_verification_statuses_id_seq'::regclass);


--
-- TOC entry 1943 (class 2604 OID 16658)
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY log ALTER COLUMN id SET DEFAULT nextval('log_id_seq'::regclass);


--
-- TOC entry 1942 (class 2604 OID 16647)
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY log_actions ALTER COLUMN id SET DEFAULT nextval('log_actions_id_seq'::regclass);


--
-- TOC entry 1940 (class 2604 OID 16604)
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- TOC entry 1976 (class 2606 OID 16706)
-- Name: email_verification_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY email_verification_statuses
    ADD CONSTRAINT email_verification_statuses_pkey PRIMARY KEY (id);


--
-- TOC entry 1972 (class 2606 OID 16652)
-- Name: log_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY log_actions
    ADD CONSTRAINT log_actions_pkey PRIMARY KEY (id);


--
-- TOC entry 1974 (class 2606 OID 16664)
-- Name: log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY log
    ADD CONSTRAINT log_pkey PRIMARY KEY (id);


--
-- TOC entry 1958 (class 2606 OID 16540)
-- Name: pk_picturecredits; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY picture_credits
    ADD CONSTRAINT pk_picturecredits PRIMARY KEY (id);


--
-- TOC entry 1956 (class 2606 OID 16535)
-- Name: pk_pictures; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY pictures
    ADD CONSTRAINT pk_pictures PRIMARY KEY (id);


--
-- TOC entry 1949 (class 2606 OID 16530)
-- Name: pk_things; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY things
    ADD CONSTRAINT pk_things PRIMARY KEY (id);


--
-- TOC entry 1963 (class 2606 OID 16606)
-- Name: pk_users; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY users
    ADD CONSTRAINT pk_users PRIMARY KEY (id);


--
-- TOC entry 1960 (class 2606 OID 16563)
-- Name: pk_votes; Type: CONSTRAINT; Schema: public; Owner: -
--

--ALTER TABLE ONLY votes
--    ADD CONSTRAINT pk_votes PRIMARY KEY (thing1, thing2);


--
-- TOC entry 1970 (class 2606 OID 16640)
-- Name: session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- TOC entry 1965 (class 2606 OID 16691)
-- Name: users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 1968 (class 2606 OID 16608)
-- Name: users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 1946 (class 1259 OID 16614)
-- Name: fki_added_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_added_by ON things USING btree (added_by);


--
-- TOC entry 1961 (class 1259 OID 16712)
-- Name: fki_email_verification_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_email_verification_status ON users USING btree (email_verification_status);


--
-- TOC entry 1947 (class 1259 OID 16552)
-- Name: fki_picture; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_picture ON things USING btree (picture);


--
-- TOC entry 1954 (class 1259 OID 16546)
-- Name: fki_picturecredit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fki_picturecredit ON pictures USING btree (credit);


--
-- TOC entry 1950 (class 1259 OID 16713)
-- Name: things_ci_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX things_ci_name_idx ON things USING btree (lower((name)::text));


--
-- TOC entry 1951 (class 1259 OID 16641)
-- Name: things_elo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX things_elo_idx ON things USING btree (elo);


--
-- TOC entry 1952 (class 1259 OID 16632)
-- Name: things_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX things_name_idx ON things USING btree (name);


--
-- TOC entry 1966 (class 1259 OID 16695)
-- Name: users_reset_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_reset_token_idx ON users USING btree (reset_token);


--
-- TOC entry 1953 (class 1259 OID 16588)
-- Name: visibility_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX visibility_index ON things USING btree (visibility);


--
-- TOC entry 1978 (class 2606 OID 16609)
-- Name: fk_added_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY things
    ADD CONSTRAINT fk_added_by FOREIGN KEY (added_by) REFERENCES users(id);


--
-- TOC entry 1982 (class 2606 OID 16707)
-- Name: fk_email_verification_status; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY users
    ADD CONSTRAINT fk_email_verification_status FOREIGN KEY (email_verification_status) REFERENCES email_verification_statuses(id);


--
-- TOC entry 1977 (class 2606 OID 16547)
-- Name: fk_picture; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY things
    ADD CONSTRAINT fk_picture FOREIGN KEY (picture) REFERENCES pictures(id);


--
-- TOC entry 1979 (class 2606 OID 16541)
-- Name: fk_picturecredit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY pictures
    ADD CONSTRAINT fk_picturecredit FOREIGN KEY (credit) REFERENCES picture_credits(id);


--
-- TOC entry 1980 (class 2606 OID 16564)
-- Name: fk_thing1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

--ALTER TABLE ONLY votes
--    ADD CONSTRAINT fk_thing1 FOREIGN KEY (thing1) REFERENCES things(id);


--
-- TOC entry 1981 (class 2606 OID 16569)
-- Name: fk_thing2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

--ALTER TABLE ONLY votes
--    ADD CONSTRAINT fk_thing2 FOREIGN KEY (thing2) REFERENCES things(id);


--
-- TOC entry 1983 (class 2606 OID 16665)
-- Name: log_action_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY log
    ADD CONSTRAINT log_action_fkey FOREIGN KEY (action) REFERENCES log_actions(id);


--
-- TOC entry 1985 (class 2606 OID 16675)
-- Name: log_thing1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY log
    ADD CONSTRAINT log_thing1_fkey FOREIGN KEY (thing1) REFERENCES things(id);


--
-- TOC entry 1986 (class 2606 OID 16680)
-- Name: log_thing2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY log
    ADD CONSTRAINT log_thing2_fkey FOREIGN KEY (thing2) REFERENCES things(id);


--
-- TOC entry 1987 (class 2606 OID 16685)
-- Name: log_thing_submitted_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY log
    ADD CONSTRAINT log_thing_submitted_fkey FOREIGN KEY (thing_submitted) REFERENCES things(id);


--
-- TOC entry 1984 (class 2606 OID 16670)
-- Name: log_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY log
    ADD CONSTRAINT log_user_fkey FOREIGN KEY ("user") REFERENCES users(id);


-- Completed on 2016-06-13 15:23:43

--
-- PostgreSQL database dump complete
--

