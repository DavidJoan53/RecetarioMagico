DROP INDEX "recipe_ingredients_recipe_idx";--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ALTER COLUMN "quantity" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_ingredient_key" UNIQUE("recipe_id","ingredient_id");