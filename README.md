# WIPStudio

A self-hosted collaborative platform for music producers to share, review, and gather feedback on audio tracks. Built for teams and artists who need a centralized place to manage work-in-progress recordings with version control and time-stamped comments.

Self-hosted alternative to [Highnote](https://highnote.fm), [Boombox](https://boombox.io).

## Features

- **Project Management** - Organize your music production work into projects
- **Track Versioning** - Upload multiple versions of tracks
- **Time-stamped Comments** - Leave feedback at specific points in the audio with threaded replies
- **Collaboration** - Invite team members via email or shareable links
- **Notifications** - In-app and email notifications for new tracks, versions, and comments
- **Authentication** - Email/password auth with optional OIDC/SSO support
- **S3 Storage** - Store audio files in any S3-compatible storage (AWS S3, MinIO, etc.)

## Installation

1. **Download the required files**

  ```bash
  mkdir wipstudio && cd wipstudio
  curl -O https://raw.githubusercontent.com/pruizlezcano/wipstudio/main/docker-compose.yml
  curl -O https://raw.githubusercontent.com/pruizlezcano/wipstudio/main/.env.example
  mv .env.example .env
  ```

2. **Configure**

  Edit `.env` with your values (see [Configuration](#configuration) below).

3. **Deploy**

   ```bash
   docker compose up -d
   ```

   This starts WIPStudio, PostgreSQL, MinIO (S3 storage), and Caddy (reverse proxy).

## Configuration

All configuration is done via environment variables in `.env`.

### Application

| Variable   | Description                      |
| ---------- | -------------------------------- |
| `WEB_URL`  | Public URL of your application   |

### Reverse Proxy (Caddy)

| Variable    | Description                        |
| ----------- | ---------------------------------- |
| `MINIO_HOST`| MinIO service hostname             |
| `MINIO_PORT`| MinIO service port                 |
| `APP_HOST`  | WIPStudio application hostname     |
| `APP_PORT`  | WIPStudio application port         |

### Authentication

| Variable                       | Description                                   | Default    |
| ------------------------------ | --------------------------------------------- | ---------- |
| `BETTER_AUTH_SECRET`           | Secret key for session encryption             | *Required* |
| `REQUIRE_EMAIL_VERIFICATION`   | Require email verification on sign up         | `false`    |
| `DISABLE_SIGN_UP`              | Disable new user registration                 | `false`    |
| `DISABLE_EMAIL_PASSWORD_AUTH`  | Disable email/password auth (OIDC only)       | `false`    |

### Database

| Variable            | Description              |
| ------------------- | ------------------------ |
| `POSTGRES_USER`     | PostgreSQL username      |
| `POSTGRES_PASSWORD` | PostgreSQL password      |
| `POSTGRES_DB`       | Database name            |
| `DATABASE_URL`      | Full connection string   |

### S3 Storage

| Variable               | Description             |
| ---------------------- | ----------------------- |
| `S3_ENDPOINT`          | S3 endpoint URL         |
| `S3_ACCESS_KEY_ID`     | S3 access key           |
| `S3_SECRET_ACCESS_KEY` | S3 secret key           |
| `S3_BUCKET`            | Bucket name for uploads |
| `S3_REGION`            | S3 region               |

### File Upload

| Variable            | Description                            | Default         |
| ------------------- | -------------------------------------- | --------------- |
| `UPLOAD_CHUNK_SIZE` | Chunk size for multipart uploads       | `5242880` (5MB) |

### Email (Optional)

| Variable         | Description                      |
| ---------------- | -------------------------------- |
| `EMAIL_ENABLED`  | Enable email notifications       |
| `SMTP_HOST`      | SMTP server host                 |
| `SMTP_PORT`      | SMTP server port                 |
| `SMTP_USER`      | SMTP username                    |
| `SMTP_PASSWORD`  | SMTP password or app password    |
| `EMAIL_FROM`     | From address for emails          |

### OIDC/SSO (Optional)

| Variable               | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `OPENID_NAME`          | Display name for the provider                     |
| `OPENID_ID`            | Provider identifier                               |
| `OPENID_CLIENT_ID`     | OAuth client ID                                   |
| `OPENID_CLIENT_SECRET` | OAuth client secret                               |
| `OPENID_REDIRECT_URI`  | OAuth redirect URI                                |
| `OPENID_DISCOVERY_URL` | OpenID Connect discovery URL                      |
| `OPENID_SCOPES`        | OAuth scopes (default: `openid profile email`)    |


## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
