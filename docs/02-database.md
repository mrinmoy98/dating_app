> **Implementation note (current):** the backend now uses **MongoDB (Mongoose)**,
> not PostgreSQL. The document schemas actually in use live in
> `backend/src/entity/` (`user.entity.ts`, `admin.entity.ts`, `otp.entity.ts`).
> The relational design below is kept as reference for the domain model; each
> table maps to a Mongo collection / embedded sub-document. See `backend/README.md`.

# Database Structure (PostgreSQL + PostGIS)

> Fully **normalized / relational**. No JSON blob columns — every attribute is a real
> typed column, and every one-to-many uses its own table with foreign keys.
> Enum-like values live in their own lookup tables (`genders`, `report_reasons`, …).

## ER overview

```
genders ─┐
         ├─< users >─┬─< photos
         │           ├─< user_interests >── interests
         │           ├── user_preferences
         │           └── user_locations
users ─< swipes >─ users
users ─< matches >─ users ── conversations ─< messages
users ─< follows >─ users
users ─< reels >─┬─< reel_likes
                 └─< reel_comments
users ─< video_calls >─ users
users ─< blocks / reports / notifications / devices
```

---

## 1. Lookup tables

```
genders
--------------------------------------------------
id            SERIAL PK
code          VARCHAR(20)  UNIQUE   -- 'man','woman','nonbinary','all'
label         VARCHAR(50)           -- 'Man','Woman','Non-binary'

report_reasons
--------------------------------------------------
id            SERIAL PK
code          VARCHAR(30) UNIQUE    -- 'spam','fake','harassment','nudity'
label         VARCHAR(100)

interests
--------------------------------------------------
id            SERIAL PK
name          VARCHAR(60) UNIQUE    -- 'Travel','Music','Gym','Coffee'...
```

## 2. Users & identity

```
users
--------------------------------------------------
id              BIGSERIAL PK
email           VARCHAR(255) UNIQUE
phone           VARCHAR(20)  UNIQUE NULL
password_hash   VARCHAR(255)
first_name      VARCHAR(80)
last_name       VARCHAR(80) NULL
birth_date      DATE                  -- age computed from this
gender_id       INT  FK -> genders(id)
bio             VARCHAR(500) NULL
job_title       VARCHAR(120) NULL
company         VARCHAR(120) NULL
school          VARCHAR(120) NULL
height_cm       SMALLINT NULL
is_verified     BOOLEAN DEFAULT false
is_active       BOOLEAN DEFAULT true
last_active_at  TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()

INDEX (gender_id), INDEX (last_active_at)
```

```
devices                           -- for push notifications, multi-device
--------------------------------------------------
id            BIGSERIAL PK
user_id       BIGINT FK -> users(id)
push_token    VARCHAR(255)
platform      VARCHAR(10)          -- 'ios','android','web'
created_at    TIMESTAMPTZ DEFAULT now()
UNIQUE (user_id, push_token)
```

## 3. Profile detail (all separate tables — no JSON)

```
photos
--------------------------------------------------
id            BIGSERIAL PK
user_id       BIGINT FK -> users(id)
url           VARCHAR(500)
position      SMALLINT              -- 0..5 ordering on profile
is_primary    BOOLEAN DEFAULT false
uploaded_at   TIMESTAMPTZ DEFAULT now()
INDEX (user_id, position)
```

```
user_interests                    -- junction (many-to-many)
--------------------------------------------------
user_id       BIGINT FK -> users(id)
interest_id   INT    FK -> interests(id)
PRIMARY KEY (user_id, interest_id)
```

```
user_preferences                  -- who this user wants to see
--------------------------------------------------
user_id                BIGINT PK FK -> users(id)
interested_in_gender_id INT  FK -> genders(id)   -- man / woman / all
min_age                SMALLINT DEFAULT 18
max_age                SMALLINT DEFAULT 60
max_distance_km        SMALLINT DEFAULT 50
show_me                BOOLEAN  DEFAULT true      -- visible in others' feed
updated_at             TIMESTAMPTZ DEFAULT now()
```

```
user_locations                    -- latest known location (for suggestions)
--------------------------------------------------
user_id       BIGINT PK FK -> users(id)
latitude      DOUBLE PRECISION
longitude     DOUBLE PRECISION
geo           GEOGRAPHY(Point,4326)  -- PostGIS, for ST_DWithin distance queries
city          VARCHAR(120) NULL
country       VARCHAR(120) NULL
updated_at    TIMESTAMPTZ DEFAULT now()
GIST INDEX (geo)
```

## 4. Matching (swipe → match)

```
swipes
--------------------------------------------------
id            BIGSERIAL PK
swiper_id     BIGINT FK -> users(id)
swiped_id     BIGINT FK -> users(id)
action        VARCHAR(10)          -- 'like','dislike','superlike'
created_at    TIMESTAMPTZ DEFAULT now()
UNIQUE (swiper_id, swiped_id)
INDEX (swiped_id, action)
```

```
matches                           -- created when both like each other
--------------------------------------------------
id            BIGSERIAL PK
user_low_id   BIGINT FK -> users(id)   -- always the smaller user id
user_high_id  BIGINT FK -> users(id)   -- always the larger user id
created_at    TIMESTAMPTZ DEFAULT now()
is_active     BOOLEAN DEFAULT true     -- false if unmatched/blocked
UNIQUE (user_low_id, user_high_id)     -- prevents duplicate matches
```
> Storing the pair as (low, high) ids guarantees one row per pair regardless of who swiped first.

## 5. Chat (only between matched users)

```
conversations
--------------------------------------------------
id              BIGSERIAL PK
match_id        BIGINT FK -> matches(id) UNIQUE
created_at      TIMESTAMPTZ DEFAULT now()
last_message_at TIMESTAMPTZ NULL
```

```
messages
--------------------------------------------------
id               BIGSERIAL PK
conversation_id  BIGINT FK -> conversations(id)
sender_id        BIGINT FK -> users(id)
message_type     VARCHAR(10)          -- 'text','image','gif'
content          VARCHAR(2000) NULL    -- text body
media_url        VARCHAR(500) NULL     -- if image/gif
is_read          BOOLEAN DEFAULT false
read_at          TIMESTAMPTZ NULL
created_at       TIMESTAMPTZ DEFAULT now()
INDEX (conversation_id, created_at)
```

## 6. Follow graph + Reels

```
follows                           -- directional: follower -> followee
--------------------------------------------------
follower_id   BIGINT FK -> users(id)
followee_id   BIGINT FK -> users(id)
created_at    TIMESTAMPTZ DEFAULT now()
PRIMARY KEY (follower_id, followee_id)
INDEX (followee_id)
```

```
reels
--------------------------------------------------
id            BIGSERIAL PK
user_id       BIGINT FK -> users(id)
video_url     VARCHAR(500)
thumbnail_url VARCHAR(500)
caption       VARCHAR(300) NULL
duration_sec  SMALLINT
view_count    BIGINT DEFAULT 0
created_at    TIMESTAMPTZ DEFAULT now()
INDEX (user_id, created_at)
```
> **Follow-based reels feed** = reels WHERE user_id IN (SELECT followee_id FROM follows WHERE follower_id = :me) ORDER BY created_at DESC.

```
reel_likes
--------------------------------------------------
reel_id       BIGINT FK -> reels(id)
user_id       BIGINT FK -> users(id)
created_at    TIMESTAMPTZ DEFAULT now()
PRIMARY KEY (reel_id, user_id)
```

```
reel_comments
--------------------------------------------------
id            BIGSERIAL PK
reel_id       BIGINT FK -> reels(id)
user_id       BIGINT FK -> users(id)
content       VARCHAR(500)
created_at    TIMESTAMPTZ DEFAULT now()
INDEX (reel_id, created_at)
```

## 7. Video call (1-to-1)

```
video_calls
--------------------------------------------------
id            BIGSERIAL PK
match_id      BIGINT FK -> matches(id)
caller_id     BIGINT FK -> users(id)
callee_id     BIGINT FK -> users(id)
status        VARCHAR(12)          -- 'ringing','ongoing','ended','missed','rejected'
started_at    TIMESTAMPTZ NULL
ended_at      TIMESTAMPTZ NULL
duration_sec  INT DEFAULT 0
created_at    TIMESTAMPTZ DEFAULT now()
INDEX (caller_id), INDEX (callee_id)
```

## 8. Safety & notifications

```
blocks
--------------------------------------------------
blocker_id    BIGINT FK -> users(id)
blocked_id    BIGINT FK -> users(id)
created_at    TIMESTAMPTZ DEFAULT now()
PRIMARY KEY (blocker_id, blocked_id)
```

```
reports
--------------------------------------------------
id            BIGSERIAL PK
reporter_id   BIGINT FK -> users(id)
reported_id   BIGINT FK -> users(id)
reason_id     INT FK -> report_reasons(id)
description   VARCHAR(500) NULL
created_at    TIMESTAMPTZ DEFAULT now()
```

```
notifications
--------------------------------------------------
id            BIGSERIAL PK
user_id       BIGINT FK -> users(id)   -- recipient
type          VARCHAR(20)              -- 'match','message','like','follow','call'
actor_id      BIGINT FK -> users(id)   -- who caused it
entity_id     BIGINT NULL              -- id of match/message/reel etc.
is_read       BOOLEAN DEFAULT false
created_at    TIMESTAMPTZ DEFAULT now()
INDEX (user_id, is_read, created_at)
```

---

## Why this is "no JSON, direct storage"
- Interests → **junction table**, not a JSON array.
- Photos → **rows**, not a JSON list.
- Preferences → **typed columns**, not a settings JSON.
- Location → real lat/lng + PostGIS geometry, not a JSON `{lat,lng}`.
- Enums (gender, report reason) → **lookup tables** with FKs.
