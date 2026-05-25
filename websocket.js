import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { track, session, project, projectMember } from "./lib/db/schema.js";
import { eq, and } from "drizzle-orm";
import "dotenv/config";

const { Pool } = pg;

// Initialize database connection with explicit Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);

const server = new Server({
  port: process.env.WEBSOCKET_PORT || 3001,

  extensions: [
    new Database({
      // Fetch lyrics from database when document is loaded
      fetch: async ({ documentName }) => {
        try {
          console.log(
            `[Hocuspocus] Fetching lyrics for track: ${documentName}`
          );

          const result = await db
            .select({ lyrics: track.lyrics })
            .from(track)
            .where(eq(track.id, documentName))
            .limit(1);

          if (result.length === 0 || !result[0].lyrics) {
            console.log(
              `[Hocuspocus] No lyrics found for track: ${documentName}, starting with empty document`
            );
            return null; // Empty document
          }

          // Convert base64 string back to Uint8Array
          const buffer = Buffer.from(result[0].lyrics, "base64");
          console.log(
            `[Hocuspocus] Loaded lyrics for track: ${documentName} (${buffer.length} bytes)`
          );
          return new Uint8Array(buffer);
        } catch (error) {
          console.error("[Hocuspocus] Error fetching lyrics:", error);
          return null;
        }
      },

      // Store lyrics to database when document changes
      store: async ({ documentName, state }) => {
        try {
          // Convert Uint8Array to base64 for storage
          const base64 = Buffer.from(state).toString("base64");

          await db
            .update(track)
            .set({
              lyrics: base64,
              updatedAt: new Date(),
            })
            .where(eq(track.id, documentName));

          console.log(
            `[Hocuspocus] Saved lyrics for track: ${documentName} (${state.length} bytes)`
          );
        } catch (error) {
          console.error("[Hocuspocus] Error storing lyrics:", error);
          throw error; // Re-throw to let Hocuspocus handle it
        }
      },
    }),
  ],

  // Logging
  onConnect({ documentName }) {
    console.log(`[Hocuspocus] Client connected to ${documentName}.`);
  },

  onDisconnect({ documentName }) {
    console.log(`[Hocuspocus] Client disconnected from ${documentName}.`);
  },

  // Authentication: Validate session token and check project access
  async onAuthenticate(data) {
    try {
      const { token, documentName } = data;
      if (!token) {
        console.error("[Hocuspocus] No token provided");
        throw new Error("Authentication required");
      }

      // Validate session token
      const sessionResult = await db
        .select({ userId: session.userId, expiresAt: session.expiresAt })
        .from(session)
        .where(eq(session.token, token))
        .limit(1);

      if (sessionResult.length === 0) {
        console.error("[Hocuspocus] Invalid session token");
        throw new Error("Invalid session token");
      }

      const userSession = sessionResult[0];

      // Check if session is expired
      if (new Date() > new Date(userSession.expiresAt)) {
        console.error("[Hocuspocus] Session expired");
        throw new Error("Session expired");
      }

      // documentName is trackId, verify user has access to this track's project
      const trackId = documentName;

      const trackResult = await db
        .select({
          projectId: track.projectId,
          projectOwnerId: project.ownerId,
        })
        .from(track)
        .innerJoin(project, eq(track.projectId, project.id))
        .where(eq(track.id, trackId))
        .limit(1);

      if (trackResult.length === 0) {
        console.error(`[Hocuspocus] Track not found: ${trackId}`);
        throw new Error("Track not found");
      }

      const { projectId, projectOwnerId } = trackResult[0];

      // Check if user is owner or collaborator
      const isOwner = projectOwnerId === userSession.userId;

      const collaboratorResult = await db
        .select()
        .from(projectMember)
        .where(
          and(
            eq(projectMember.projectId, projectId),
            eq(projectMember.userId, userSession.userId)
          )
        )
        .limit(1);

      const isCollaborator = collaboratorResult.length > 0;

      if (!isOwner && !isCollaborator) {
        console.error(
          `[Hocuspocus] User ${userSession.userId} has no access to track ${trackId}`
        );
        throw new Error("Access denied");
      }

      console.log(
        `[Hocuspocus] User ${userSession.userId} authenticated for track ${trackId}`
      );

      return {
        userId: userSession.userId,
      };
    } catch (error) {
      console.error("[Hocuspocus] Authentication error:", error);
      throw error;
    }
  },
});

server.listen();
