CREATE TABLE "lyrics_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"track_id" text NOT NULL,
	"user_id" text,
	"content" text NOT NULL,
	"parent_id" text,
	"range_from" integer,
	"range_to" integer,
	"range_text" text,
	"resolved_at" timestamp,
	"resolved_by_id" text,
	"edited_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lyrics_comment" ADD CONSTRAINT "lyrics_comment_track_id_track_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."track"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyrics_comment" ADD CONSTRAINT "lyrics_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyrics_comment" ADD CONSTRAINT "lyrics_comment_parent_id_lyrics_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lyrics_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lyrics_comment" ADD CONSTRAINT "lyrics_comment_resolved_by_id_user_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;