CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant', 'boundary');--> statement-breakpoint
CREATE TYPE "public"."unit" AS ENUM('g', 'ml', 'unidad', 'cucharada', 'cucharadita', 'taza', 'pizca');--> statement-breakpoint
CREATE TABLE "dinner_recipes" (
	"dinner_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	CONSTRAINT "dinner_recipes_dinner_id_recipe_id_pk" PRIMARY KEY("dinner_id","recipe_id")
);
--> statement-breakpoint
CREATE TABLE "dinners" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"eaten_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"photo_url" text,
	CONSTRAINT "ingredients_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "label_groups" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "label_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"label_group_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pantry" (
	"ingredient_id" uuid PRIMARY KEY NOT NULL,
	"quantity" numeric(10, 2),
	"unit" "unit",
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"unit" "unit" NOT NULL,
	"quantity" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "recipe_labels" (
	"recipe_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	CONSTRAINT "recipe_labels_recipe_id_label_id_pk" PRIMARY KEY("recipe_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"prep_time_minutes" integer,
	"instructions" text[] DEFAULT '{}' NOT NULL,
	"links" text[] DEFAULT '{}' NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dinner_recipes" ADD CONSTRAINT "dinner_recipes_dinner_id_dinners_id_fk" FOREIGN KEY ("dinner_id") REFERENCES "public"."dinners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dinner_recipes" ADD CONSTRAINT "dinner_recipes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_label_group_id_label_groups_id_fk" FOREIGN KEY ("label_group_id") REFERENCES "public"."label_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pantry" ADD CONSTRAINT "pantry_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_labels" ADD CONSTRAINT "recipe_labels_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_labels" ADD CONSTRAINT "recipe_labels_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dinner_recipes_recipe_idx" ON "dinner_recipes" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "dinners_eaten_at_idx" ON "dinners" USING btree ("eaten_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "labels_group_idx" ON "labels" USING btree ("label_group_id");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_recipe_idx" ON "recipe_ingredients" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_labels_label_idx" ON "recipe_labels" USING btree ("label_id");