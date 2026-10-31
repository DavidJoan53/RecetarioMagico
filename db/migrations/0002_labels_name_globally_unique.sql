ALTER TABLE "labels" DROP CONSTRAINT "labels_group_name_unique";--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_name_unique" UNIQUE("name");