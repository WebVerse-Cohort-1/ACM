# ACM TSEC Database Schema

The database for ACM TSEC is entirely hosted on **Sanity CMS**. The schema is defined in `studio-a_c_m/schemaTypes/`.

## 1. Core Content

### `about` (Site Settings)
A singleton document controlling global site settings and statistics.
- **Fields**: `totalMembers` (number), `eventsConducted` (number), `upcomingEvents` (number), `activeProjects` (number).

### `member`
Represents an ACM committee member.
- **Fields**:
  - `name` (string)
  - `role` (string)
  - `category` (string: "Core", "Co-Committee", "Faculty", "Alumni")
  - `image` (string: Google Drive File ID or direct URL)
  - `github`, `linkedin`, `instagram` (urls)

### `event`
Represents an event, workshop, or hackathon.
- **Fields**:
  - `title` (string)
  - `slug` (slug)
  - `dateText` (string: e.g., "MAR 15 • 48H")
  - `eventDate` (datetime)
  - `category` (string)
  - `desc` (text)
  - `prizePool` (number)
  - `maxTeamSize` (number)
  - `images` (array of strings for Google Drive URLs)

### `gallery`
Standalone images or memories.
- **Fields**:
  - `src` (string: Google Drive URL)
  - `caption` (string)
  - `eventSlug` (reference to `event`)

## 2. User Generated Data

### `registration`
An entry created when a user registers for an event.
- **Fields**:
  - `name`, `email`, `phone`, `college`, `branch`, `year`
  - `eventSlug` (string)
  - `team` (string)
  - `members` (array of objects containing name and email)
  - `message` (text)
  - `submittedAt` (datetime)

### `message` (Contact Form)
A message sent from the `/contact` page.
- **Fields**:
  - `user` (string: Name)
  - `email` (string)
  - `content` (text)
  - `timestamp` (string)

## 3. Quiz Engine

### `quiz`
A configuration for a proctored quiz.
- **Fields**:
  - `title` (string)
  - `questions` (array of objects with `question`, `options`, `correctAnswer`, `type`, `points`)
  - `timeLimit` (number in minutes)
  - `isActive` (boolean)

### `quizSubmission`
The answers submitted by a participant for a specific quiz.
- **Fields**:
  - `quiz` (reference to `quiz`)
  - `participantId` (string)
  - `answers` (text - JSON stringified map of question ID to selected answer)
  - `status` (string: "pending", "graded")

### `quizSession`
Tracking of a user taking a quiz (used for proctoring).
- **Fields**:
  - `quizRef` (reference to `quiz`)
  - `participantId` (string)
  - `startTime`, `lastPing` (datetime)
  - `tabSwitches`, `warnings` (number)
  - `status` (string: "active", "completed", "terminated")
