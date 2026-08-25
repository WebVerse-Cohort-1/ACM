# ACM TSEC — Sanity Database Documentation

> **Project ID:** `9js05zdy` | **Dataset:** `production` | **Studio:** `studio-a_c_m/`
> **Generated:** 2026-07-18 | **Schema Version:** Sanity v6

---

## Architecture Overview

The database is hosted on **Sanity.io** (a headless CMS with a real-time document store). All data is stored as JSON documents in the `production` dataset.

### Entity Relationship Diagram

```
┌─────────┐      ┌─────────────────┐      ┌─────────────────┐
│  event  │──1:N─▶ quizSession      │      │ quizSubmission  │
│         │      │ (via eventSlug) │      │ (ref → quiz)    │
└────┬────┘      └────────┬────────┘      └─────────────────┘
     │                    │                       ▲
     │ 1:N                │ ref                   │ ref
     ▼                    ▼                       │
┌─────────┐      ┌─────────────────┐      ┌──────┴──────────┐
│ gallery │      │  registration   │──ref─▶    quiz          │
│(string) │      │  (via eventSlug)│      │ (questions +    │
└─────────┘      └─────────────────┘      │  answers)       │
                                          └─────────────────┘

┌─────────┐      ┌─────────┐      ┌─────────┐
│  about  │      │ member  │      │ message │
│(1 doc)  │      │(roster) │      │(contact)│
└─────────┘      └─────────┘      └─────────┘
```

> **Note:** Fields marked `(string)` instead of `(ref)` are loose string references that lack referential integrity. See [Schema Issues](#schema-issues) for details.

---

## Schema Reference

---

### 1. `about` — Site Settings

**Purpose:** A singleton document (one per site) that holds all content for the "About" and "Home" pages. Manage it at `Studio → Site Settings (About)`.

**Fields:**

| Field Name | Type | Required | Description |
|---|---|---|---|
| `whatIsAcm` | `text` | No | Long-form paragraph describing ACM |
| `vision` | `text` | No | The chapter's vision statement |
| `mission` | `text` | No | Mission lines, separated by `\n` |
| `benefits` | `text` | No | Benefits of joining, line-separated |
| `eventsConducted` | `text` | No | Events conducted list, line-separated |
| `stats` | `array<object>` | No | Array of stat counters (see below) |
| `legacyLogs` | `array<object>` | No | Timeline of milestones (see below) |

**Nested: `stats[]`**

| Field | Type | Description |
|---|---|---|
| `label` | `string` | Counter label, e.g. `"MEMBERS"` |
| `value` | `number` | Numeric value, e.g. `500` |

**Nested: `legacyLogs[]`**

| Field | Type | Description |
|---|---|---|
| `year` | `string` | e.g. `"2025"` |
| `title` | `string` | Milestone title, e.g. `"National Apex"` |
| `desc` | `text` | Description of what happened |

**Example GROQ:**
```groq
// Fetch all About data
*[_type == "about"][0] {
  whatIsAcm, vision, mission,
  stats[] { label, value },
  legacyLogs[] { year, title, desc }
}
```

---

### 2. `event` — Events

**Purpose:** Represents a single ACM event (hackathon, workshop, seminar, etc.). Displayed on the Events page and Event Detail page.

**Fields:**

| Field Name | Type | Required | Validation | Description |
|---|---|---|---|---|
| `title` | `string` | ✅ Yes | Required | Display name of the event |
| `slug` | `slug` | ✅ Yes | Required, auto-generated from title | URL-safe identifier (e.g. `devsprint-2k26`) |
| `category` | `string` | No | — | Tag like `"HACKATHON"`, `"WORKSHOP"` |
| `dateText` | `string` | No | — | Human-readable date, e.g. `"MAR 15 • 48H"` |
| `eventDate` | `datetime` | No | — | ISO datetime for countdown timer |
| `desc` | `text` | No | — | Full description |
| `images` | `array<string>` | No | — | Array of Google Drive URLs or IDs |
| `prizePool` | `number` | No | — | Total prize pool in ₹ |
| `maxTeamSize` | `number` | No | — | Max members per team |
| `tracks` | `array<object>` | No | — | Innovation tracks (see below) |
| `speakers` | `array<object>` | No | — | Speakers/Judges (see below) |
| `faqs` | `array<object>` | No | — | Frequently asked questions (see below) |

**Nested: `tracks[]`**

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Track name, e.g. `"AI & ML"` |
| `desc` | `text` | Track description |

**Nested: `speakers[]`**

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Speaker's full name |
| `role` | `string` | Title/role, e.g. `"Co-Founder, TechCorp"` |
| `image` | `string` | Google Drive URL/ID of profile photo |
| `linkedin` | `string` | LinkedIn profile URL |

**Nested: `faqs[]`**

| Field | Type | Description |
|---|---|---|
| `q` | `string` | Question text |
| `a` | `text` | Answer text |

**Example GROQ:**
```groq
// All events, sorted newest first
*[_type == "event"] | order(_createdAt desc) {
  title,
  "slug": slug.current,
  category,
  dateText,
  eventDate,
  desc,
  images,
  prizePool,
  maxTeamSize
}

// Single event by slug
*[_type == "event" && slug.current == $slug][0] {
  title, desc, images, prizePool, maxTeamSize,
  tracks[] { name, desc },
  speakers[] { name, role, image, linkedin },
  faqs[] { q, a }
}
```

> **🔗 Referenced by:** `gallery` (via string `eventSlug`), `registration` (via string `eventSlug`), `quizSession` (via string `eventSlug`)

---

### 3. `gallery` — Gallery Images

**Purpose:** Standalone photos not directly part of an event. Shown in the `FusionGallery` 3D archive page.

**Fields:**

| Field Name | Type | Required | Validation | Description |
|---|---|---|---|---|
| `src` | `string` | ✅ Yes | Required | Google Drive URL or file ID |
| `caption` | `string` | No | — | Alt text/caption for the image |
| `eventSlug` | `string` | No | — | ⚠️ Loose string reference to an event slug |

> [!WARNING]
> `eventSlug` is a plain string, **not** a Sanity `reference`. This means if an event slug changes, orphaned gallery images won't automatically update. Should be changed to a `reference` type pointing to `event`.

**Example GROQ:**
```groq
// All gallery images
*[_type == "gallery"] { src, caption, eventSlug }

// Gallery images for a specific event
*[_type == "gallery" && eventSlug == $slug] { src, caption }
```

---

### 4. `member` — Team Members / Roster

**Purpose:** Represents an ACM TSEC team member or committee member. Displayed on the Team page.

**Fields:**

| Field Name | Type | Required | Validation | Description |
|---|---|---|---|---|
| `name` | `string` | ✅ Yes | Required | Full name |
| `email` | `string` | ✅ Yes | Required, must be valid email | Email address |
| `phone` | `string` | No | — | Phone number |
| `branch` | `string` | No | — | Engineering branch, e.g. `"COMPS"` |
| `year` | `string` | No | — | Academic year, e.g. `"TE"`, `"BE"` |
| `role` | `string` | No | — | Position title, e.g. `"Webmaster"`, `"Chair"` |
| `category` | `string` | No | — | Team category, e.g. `"Website"`, `"Marketing"` |
| `linkedin` | `string` | No | — | Full LinkedIn profile URL |
| `desc` | `text` | No | — | Bio displayed on hover card |
| `acmId` | `string` | No | — | Official ACM membership ID |
| `joinedDate` | `date` | No | — | Date joined the chapter |
| `driveProfilePictureId` | `string` | No | — | Google Drive File ID of profile photo (uploaded via `api/`) |

**Example GROQ:**
```groq
// All members grouped by category
*[_type == "member"] | order(category asc, name asc) {
  name, role, category, desc, linkedin, driveProfilePictureId
}

// Members in a specific category
*[_type == "member" && category == $category] {
  name, role, desc, linkedin, driveProfilePictureId
}
```

---

### 5. `message` — Contact Form Messages

**Purpose:** Persists messages submitted via the Contact page form.

> [!NOTE]
> This schema currently uses `export default` which is inconsistent with the other schemas. It should be changed to `export const message = defineType(...)`.

**Fields:**

| Field Name | Type | Required | Description |
|---|---|---|---|
| `user` | `string` | No | User ID / Name submitted in form |
| `email` | `string` | No | Email address of sender |
| `content` | `text` | No | Message body |
| `timestamp` | `string` | No | Submission time as a string (not `datetime`!) |

> [!WARNING]
> `timestamp` is a plain `string` but should be `datetime` for proper sorting and filtering in GROQ.

**Example GROQ:**
```groq
// All messages, newest first
*[_type == "message"] | order(_createdAt desc) {
  user, email, content, timestamp
}
```

---

### 6. `quiz` — Quiz / Exam Configuration

**Purpose:** Defines a quiz exam that can be assigned to an event. Contains all questions, options, and correct answers. Manage at `Studio → Quizzes`.

**Fields:**

| Field Name | Type | Required | Validation | Description |
|---|---|---|---|---|
| `title` | `string` | ✅ Yes | Required | Quiz name, e.g. `"AI Tools Quiz – Round 1"` |
| `eventSlug` | `string` | No | — | ⚠️ Loose string reference to an event |
| `driveCoverImageId` | `string` | No | — | Google Drive ID for the quiz cover banner |
| `durationMinutes` | `number` | No | — | Exam duration in minutes |
| `marksPerQuestion` | `number` | No | Default: `1` | Marks awarded per correct answer |
| `negativeMarks` | `number` | No | Default: `0` | Marks deducted per wrong answer |
| `questions` | `array<object>` | No | — | Question bank (see below) |

**Nested: `questions[]`**

| Field | Type | Default | Description |
|---|---|---|---|
| `text` | `text` | — | The question body (required) |
| `type` | `string` | `multiple_choice` | One of: `multiple_choice`, `short_answer`, `paragraph`, `link` |
| `options` | `array<string>` | — | Answer options (shown only for `multiple_choice`) |
| `correctIndex` | `number` | — | 0-based index of the correct option (shown only for `multiple_choice`) |
| `explanation` | `text` | — | Explanation shown after submission |

**Supported Question Types:**

| Value | Label | Uses `options`? | Uses `correctIndex`? |
|---|---|---|---|
| `multiple_choice` | Multiple Choice | ✅ Yes | ✅ Yes |
| `short_answer` | Short Answer | ❌ No | ❌ No |
| `paragraph` | Paragraph | ❌ No | ❌ No |
| `link` | Link / URL | ❌ No | ❌ No |

**Example GROQ:**
```groq
// Quiz by event slug (without revealing answers)
*[_type == "quiz" && eventSlug == $slug][0] {
  _id, title, durationMinutes, marksPerQuestion, negativeMarks,
  questions[] {
    _key, text, type, options
    // NOTE: Do NOT include correctIndex in frontend queries!
  }
}
```

> 🔴 **Security Note:** Never include `correctIndex` in frontend GROQ queries. It must only be fetched server-side for grading.

---

### 7. `quizSession` — Proctoring Session

**Purpose:** Tracks a team's real-time state during a proctored exam. Powers the `ProctoringDashboard` custom tool in Sanity Studio.

**Fields:**

| Field Name | Type | Required | Description |
|---|---|---|---|
| `teamName` | `string` | No | Team display name |
| `registrationRef` | `reference → registration` | No | Reference to the team's registration document |
| `eventSlug` | `string` | No | Loose string for which event |
| `quizRef` | `string` | No | ⚠️ Should be `reference → quiz` — currently a plain string |
| `members` | `array<object>` | No | Per-member proctoring status (see below) |
| `proctorLogs` | `array<object>` | No | Tamper/event log (see below) |
| `startedAt` | `datetime` | No | When the exam was started by the admin |

**Nested: `members[]`**

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | — | Member's name |
| `email` | `string` | — | Member's email |
| `status` | `string` | `offline` | One of: `active`, `offline`, `locked` |
| `isLocked` | `boolean` | `false` | If `true`, the member is barred from submitting |
| `timeRemaining` | `number` | — | Seconds remaining for this member |
| `answers` | `text` | — | ⚠️ Serialized JSON string of saved answers |

> [!WARNING]
> `answers` is stored as a serialized JSON `text` field. This is brittle. It should be structured as an `array` of answer objects, matching the `quizSubmission.answers` format.

**Nested: `proctorLogs[]`**

| Field | Type | Description |
|---|---|---|
| `memberName` | `string` | Who triggered the event |
| `action` | `string` | What happened (e.g. `"TAB_SWITCH"`, `"FULLSCREEN_EXIT"`) |
| `timestamp` | `datetime` | When it happened |
| `details` | `string` | Optional additional details |

**Example GROQ:**
```groq
// All active sessions for an event
*[_type == "quizSession" && eventSlug == $slug] {
  teamName, startedAt,
  members[] { name, email, status, isLocked, timeRemaining },
  proctorLogs[] | order(timestamp desc) [0..10] { memberName, action, timestamp }
}
```

---

### 8. `quizSubmission` — Final Quiz Answers

**Purpose:** Records the final submitted answers from a quiz participant after they submit the exam.

**Fields:**

| Field Name | Type | Required | Validation | Description |
|---|---|---|---|---|
| `quiz` | `reference → quiz` | ✅ Yes | Required | Links to the quiz being answered |
| `participantId` | `string` | ✅ Yes | Required | Email or unique identifier of the participant |
| `answers` | `array<object>` | No | — | All submitted answers (see below) |
| `score` | `number` | No | — | Final calculated or judge-assigned score |
| `status` | `string` | `pending` | — | One of: `pending`, `graded` |

**Nested: `answers[]`**

| Field | Type | Description |
|---|---|---|
| `questionId` | `string` | The `_key` of the question in `quiz.questions[]` |
| `selectedOptionIndex` | `number` | For MCQ: 0-based selected option |
| `textAnswer` | `text` | For subjective: the typed answer |

**Grading Flow:**
```
1. Participant submits → quizSubmission created with status: "pending"
2. Admin reviews subjective answers OR system auto-grades MCQ
3. Admin sets score and changes status → "graded"
```

**Example GROQ:**
```groq
// All submissions for a quiz, with quiz title
*[_type == "quizSubmission" && quiz._ref == $quizId] {
  participantId, score, status,
  quiz->{ title },
  answers[] { questionId, selectedOptionIndex, textAnswer }
}

// Leaderboard for a quiz
*[_type == "quizSubmission" && quiz._ref == $quizId && status == "graded"] 
  | order(score desc) {
    participantId, score
  }
```

---

### 9. `registration` — Event Registrations

**Purpose:** Stores a team/individual's registration for an event. Also acts as the link between a registered team and their `quizSession`.

**Fields:**

| Field Name | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | No | Lead registrant's name |
| `email` | `string` | No | Lead registrant's email |
| `phone` | `string` | No | Lead registrant's phone number |
| `year` | `string` | No | Academic year (e.g. `"TE"`, `"BE"`) |
| `branch` | `string` | No | Engineering branch |
| `college` | `string` | No | College name |
| `team` | `string` | No | Team name |
| `eventSlug` | `string` | No | ⚠️ Loose string reference to the event slug |
| `members` | `array<object>` | No | Additional team members (see below) |
| `message` | `text` | No | Any message/comments from the registrant |
| `isApprovedForExam` | `boolean` | `false` | Toggle to approve team for the quiz |
| `submittedAt` | `datetime` | No | Timestamp of form submission |

**Nested: `members[]`**

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Team member's name |
| `email` | `string` | Team member's email |

**Example GROQ:**
```groq
// All registrations for an event
*[_type == "registration" && eventSlug == $slug] | order(submittedAt desc) {
  name, email, team, college, year, branch, isApprovedForExam, submittedAt,
  members[] { name, email }
}

// Approved teams only
*[_type == "registration" && eventSlug == $slug && isApprovedForExam == true] {
  name, team, email, members[] { name, email }
}
```

---

## Schema Issues & Recommendations

| # | Schema | Issue | Fix |
|---|--------|-------|-----|
| I1 | `quizSession` | `quizRef` is a `string` not a Sanity `reference` | Change to `type: 'reference', to: [{type: 'quiz'}]` |
| I2 | `quizSession` | `answers` in `members[]` is a JSON string | Restructure as typed `array` of answer objects |
| I3 | `gallery` | `eventSlug` is a `string` not a `reference` | Change to `type: 'reference', to: [{type: 'event'}]` |
| I4 | `registration` | `eventSlug` is a `string` not a `reference` | Change to `type: 'reference', to: [{type: 'event'}]` |
| I5 | `quiz` | `eventSlug` is a `string` not a `reference` | Change to `type: 'reference', to: [{type: 'event'}]` |
| I6 | `message` | `timestamp` is `string` not `datetime` | Change to `type: 'datetime'` |
| I7 | `message` | Uses `export default` instead of named export | Change to `export const message = ...` |
| I8 | All schemas | Multiple `as any` TypeScript casts | Remove by using correct Sanity `defineArrayMember` generic types |
| I9 | `about` | No slug field — impossible to have multiple About configurations | Add `type: 'slug'` if multi-tenancy is ever needed |
| I10 | `event` | No `status` field (`draft`, `published`, `completed`) | Add `status` field with options list |

---

## GROQ Cheat Sheet

```groq
// Fetch all documents of a type
*[_type == "event"]

// Sort
*[_type == "member"] | order(name asc)

// Filter + project (select fields)
*[_type == "event" && slug.current == $slug][0] {
  title, desc, "slug": slug.current
}

// Join (dereference a reference with ->)
*[_type == "quizSubmission"] {
  participantId,
  "quizTitle": quiz->title
}

// Count
count(*[_type == "registration" && eventSlug == $slug])

// Nested filter
*[_type == "registration"] {
  name,
  members[email == $email]
}
```

---

## Studio Navigation Guide

| Studio Section | Schema | Purpose |
|---|---|---|
| **Members** | `member` | Add/edit team roster. Upload photos via the API. |
| **Events** | `event` | Create events with tracks, speakers, FAQs. |
| **Quizzes** | `quiz` | Build question banks for events. |
| **Gallery** | `gallery` | Add standalone photos to the archive. |
| **Site Settings (About)** | `about` | Edit homepage/about page content. |
| **Registrations** | `registration` | View and approve event registrations. |
| **Messages** | `message` | View contact form submissions. |
| **Quiz Submissions** | `quizSubmission` | Grade and review submitted exams. |
| **Proctoring Dashboard** | `quizSession` | Real-time exam monitoring tool. |
