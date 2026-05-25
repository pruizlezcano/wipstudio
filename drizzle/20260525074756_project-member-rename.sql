ALTER TABLE "project_collaborator" RENAME TO "project_member";--> statement-breakpoint
ALTER TABLE "project_member" DROP CONSTRAINT "project_collaborator_project_id_project_id_fk";
--> statement-breakpoint
ALTER TABLE "project_member" DROP CONSTRAINT "project_collaborator_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_member" ADD CONSTRAINT "project_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;