CREATE TABLE "pl_commentmeta" (
	"meta_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pl_commentmeta_meta_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"comment_id" uuid NOT NULL,
	"meta_key" text,
	"meta_value" text
);
--> statement-breakpoint
CREATE TABLE "pl_comments" (
	"comment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_post_id" uuid,
	"comment_author" text DEFAULT '' NOT NULL,
	"comment_author_email" text DEFAULT '' NOT NULL,
	"comment_author_url" text DEFAULT '',
	"comment_author_ip" text DEFAULT '',
	"comment_date" timestamp DEFAULT now(),
	"comment_date_gmt" timestamp DEFAULT now(),
	"comment_content" text NOT NULL,
	"comment_karma" integer DEFAULT 0,
	"comment_approved" text DEFAULT '1' NOT NULL,
	"comment_agent" text DEFAULT '',
	"comment_type" text DEFAULT 'comment',
	"comment_parent" uuid,
	"user_id" uuid
);
--> statement-breakpoint
CREATE TABLE "pl_links" (
	"link_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_url" text DEFAULT '' NOT NULL,
	"link_name" text DEFAULT '' NOT NULL,
	"link_image" text DEFAULT '',
	"link_target" text DEFAULT '',
	"link_description" text DEFAULT '',
	"link_visible" text DEFAULT 'Y' NOT NULL,
	"link_owner" uuid,
	"link_rating" integer DEFAULT 0,
	"link_updated" timestamp DEFAULT now(),
	"link_rel" text DEFAULT '',
	"link_notes" text DEFAULT '',
	"link_rss" text DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "pl_menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"parent_id" uuid,
	"label" text NOT NULL,
	"url" text DEFAULT '',
	"post_id" uuid,
	"menu_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pl_menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"location" text DEFAULT '',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pl_options" (
	"option_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pl_options_option_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"option_name" text NOT NULL,
	"option_value" text DEFAULT '' NOT NULL,
	"autoload" text DEFAULT 'yes' NOT NULL,
	CONSTRAINT "pl_options_option_name_unique" UNIQUE("option_name")
);
--> statement-breakpoint
CREATE TABLE "pl_postmeta" (
	"meta_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pl_postmeta_meta_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"post_id" uuid NOT NULL,
	"meta_key" text,
	"meta_value" text
);
--> statement-breakpoint
CREATE TABLE "pl_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_author" uuid,
	"post_date" timestamp DEFAULT now(),
	"post_date_gmt" timestamp DEFAULT now(),
	"post_content" text DEFAULT '',
	"post_content_json" jsonb,
	"post_title" text DEFAULT '' NOT NULL,
	"post_excerpt" text DEFAULT '',
	"post_status" text DEFAULT 'draft' NOT NULL,
	"comment_status" text DEFAULT 'open' NOT NULL,
	"ping_status" text DEFAULT 'open' NOT NULL,
	"post_password" text DEFAULT '',
	"post_name" text DEFAULT '' NOT NULL,
	"to_ping" text DEFAULT '',
	"pinged" text DEFAULT '',
	"post_modified" timestamp DEFAULT now(),
	"post_modified_gmt" timestamp DEFAULT now(),
	"post_content_filtered" text DEFAULT '',
	"post_parent" uuid,
	"guid" text DEFAULT '',
	"menu_order" integer DEFAULT 0,
	"post_type" text DEFAULT 'post' NOT NULL,
	"post_mime_type" text DEFAULT '',
	"comment_count" bigint DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "pl_term_relationships" (
	"object_id" uuid NOT NULL,
	"term_taxonomy_id" uuid NOT NULL,
	"term_order" integer DEFAULT 0,
	CONSTRAINT "pl_term_relationships_object_id_term_taxonomy_id_pk" PRIMARY KEY("object_id","term_taxonomy_id")
);
--> statement-breakpoint
CREATE TABLE "pl_term_taxonomy" (
	"term_taxonomy_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"taxonomy" text NOT NULL,
	"description" text DEFAULT '',
	"parent" uuid,
	"count" bigint DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "pl_termmeta" (
	"meta_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pl_termmeta_meta_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"term_id" uuid NOT NULL,
	"meta_key" text,
	"meta_value" text
);
--> statement-breakpoint
CREATE TABLE "pl_terms" (
	"term_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"term_group" bigint DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "pl_usermeta" (
	"umeta_id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pl_usermeta_umeta_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"meta_key" text,
	"meta_value" text
);
--> statement-breakpoint
CREATE TABLE "pl_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_login" text NOT NULL,
	"user_pass" text NOT NULL,
	"user_nicename" text NOT NULL,
	"user_email" text NOT NULL,
	"user_url" text DEFAULT '',
	"user_registered" timestamp DEFAULT now(),
	"user_activation_key" text DEFAULT '',
	"user_status" integer DEFAULT 0,
	"display_name" text NOT NULL,
	CONSTRAINT "pl_users_user_login_unique" UNIQUE("user_login"),
	CONSTRAINT "pl_users_user_email_unique" UNIQUE("user_email")
);
--> statement-breakpoint
ALTER TABLE "pl_commentmeta" ADD CONSTRAINT "pl_commentmeta_comment_id_pl_comments_comment_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."pl_comments"("comment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pl_comments" ADD CONSTRAINT "pl_comments_comment_post_id_pl_posts_id_fk" FOREIGN KEY ("comment_post_id") REFERENCES "public"."pl_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pl_links" ADD CONSTRAINT "pl_links_link_owner_pl_users_id_fk" FOREIGN KEY ("link_owner") REFERENCES "public"."pl_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pl_menu_items" ADD CONSTRAINT "pl_menu_items_menu_id_pl_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."pl_menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pl_menu_items" ADD CONSTRAINT "pl_menu_items_post_id_pl_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."pl_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pl_postmeta" ADD CONSTRAINT "pl_postmeta_post_id_pl_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."pl_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pl_posts" ADD CONSTRAINT "pl_posts_post_author_pl_users_id_fk" FOREIGN KEY ("post_author") REFERENCES "public"."pl_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pl_term_relationships" ADD CONSTRAINT "pl_term_relationships_object_id_pl_posts_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."pl_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pl_term_relationships" ADD CONSTRAINT "pl_term_relationships_term_taxonomy_id_pl_term_taxonomy_term_taxonomy_id_fk" FOREIGN KEY ("term_taxonomy_id") REFERENCES "public"."pl_term_taxonomy"("term_taxonomy_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pl_term_taxonomy" ADD CONSTRAINT "pl_term_taxonomy_term_id_pl_terms_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."pl_terms"("term_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pl_termmeta" ADD CONSTRAINT "pl_termmeta_term_id_pl_terms_term_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."pl_terms"("term_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pl_usermeta" ADD CONSTRAINT "pl_usermeta_user_id_pl_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pl_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pl_commentmeta_comment_id_idx" ON "pl_commentmeta" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "pl_commentmeta_meta_key_idx" ON "pl_commentmeta" USING btree ("meta_key");--> statement-breakpoint
CREATE INDEX "pl_comments_comment_post_id_idx" ON "pl_comments" USING btree ("comment_post_id");--> statement-breakpoint
CREATE INDEX "pl_comments_comment_approved_idx" ON "pl_comments" USING btree ("comment_approved");--> statement-breakpoint
CREATE INDEX "pl_comments_comment_parent_idx" ON "pl_comments" USING btree ("comment_parent");--> statement-breakpoint
CREATE INDEX "pl_comments_user_id_idx" ON "pl_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pl_comments_author_email_idx" ON "pl_comments" USING btree ("comment_author_email");--> statement-breakpoint
CREATE INDEX "pl_menu_items_menu_id_idx" ON "pl_menu_items" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX "pl_menus_location_idx" ON "pl_menus" USING btree ("location");--> statement-breakpoint
CREATE UNIQUE INDEX "pl_options_option_name_idx" ON "pl_options" USING btree ("option_name");--> statement-breakpoint
CREATE INDEX "pl_options_autoload_idx" ON "pl_options" USING btree ("autoload");--> statement-breakpoint
CREATE INDEX "pl_postmeta_post_id_idx" ON "pl_postmeta" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "pl_postmeta_meta_key_idx" ON "pl_postmeta" USING btree ("meta_key");--> statement-breakpoint
CREATE INDEX "pl_posts_post_name_idx" ON "pl_posts" USING btree ("post_name");--> statement-breakpoint
CREATE INDEX "pl_posts_post_type_idx" ON "pl_posts" USING btree ("post_type");--> statement-breakpoint
CREATE INDEX "pl_posts_post_status_idx" ON "pl_posts" USING btree ("post_status");--> statement-breakpoint
CREATE INDEX "pl_posts_post_author_idx" ON "pl_posts" USING btree ("post_author");--> statement-breakpoint
CREATE INDEX "pl_posts_post_parent_idx" ON "pl_posts" USING btree ("post_parent");--> statement-breakpoint
CREATE INDEX "pl_posts_post_date_idx" ON "pl_posts" USING btree ("post_date");--> statement-breakpoint
CREATE INDEX "pl_term_relationships_term_taxonomy_id_idx" ON "pl_term_relationships" USING btree ("term_taxonomy_id");--> statement-breakpoint
CREATE INDEX "pl_term_taxonomy_taxonomy_idx" ON "pl_term_taxonomy" USING btree ("taxonomy");--> statement-breakpoint
CREATE UNIQUE INDEX "pl_term_taxonomy_term_id_taxonomy_idx" ON "pl_term_taxonomy" USING btree ("term_id","taxonomy");--> statement-breakpoint
CREATE INDEX "pl_termmeta_term_id_idx" ON "pl_termmeta" USING btree ("term_id");--> statement-breakpoint
CREATE INDEX "pl_termmeta_meta_key_idx" ON "pl_termmeta" USING btree ("meta_key");--> statement-breakpoint
CREATE UNIQUE INDEX "pl_terms_slug_idx" ON "pl_terms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "pl_terms_name_idx" ON "pl_terms" USING btree ("name");--> statement-breakpoint
CREATE INDEX "pl_usermeta_user_id_idx" ON "pl_usermeta" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pl_usermeta_meta_key_idx" ON "pl_usermeta" USING btree ("meta_key");--> statement-breakpoint
CREATE INDEX "pl_users_login_idx" ON "pl_users" USING btree ("user_login");--> statement-breakpoint
CREATE INDEX "pl_users_email_idx" ON "pl_users" USING btree ("user_email");