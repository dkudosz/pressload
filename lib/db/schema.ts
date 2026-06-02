import {
  pgTable, uuid, text, integer, bigint, boolean,
  timestamp, jsonb, index, uniqueIndex, primaryKey
} from 'drizzle-orm/pg-core'

// ─── pl_users ────────────────────────────────────────────────────────────────
export const users = pgTable('pl_users', {
  id:                uuid('id').primaryKey().defaultRandom(),
  userLogin:         text('user_login').notNull().unique(),
  userPass:          text('user_pass').notNull(),
  userNicename:      text('user_nicename').notNull(),
  userEmail:         text('user_email').notNull().unique(),
  userUrl:           text('user_url').default(''),
  userRegistered:    timestamp('user_registered').defaultNow(),
  userActivationKey: text('user_activation_key').default(''),
  userStatus:        integer('user_status').default(0),
  displayName:       text('display_name').notNull(),
}, (t) => [
  index('pl_users_login_idx').on(t.userLogin),
  index('pl_users_email_idx').on(t.userEmail),
])

// ─── pl_usermeta ─────────────────────────────────────────────────────────────
export const usermeta = pgTable('pl_usermeta', {
  umetaId:   bigint('umeta_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  metaKey:   text('meta_key'),
  metaValue: text('meta_value'),
}, (t) => [
  index('pl_usermeta_user_id_idx').on(t.userId),
  index('pl_usermeta_meta_key_idx').on(t.metaKey),
])

// ─── pl_posts ─────────────────────────────────────────────────────────────────
export const posts = pgTable('pl_posts', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  postAuthor:          uuid('post_author').references(() => users.id),
  postDate:            timestamp('post_date').defaultNow(),
  postDateGmt:         timestamp('post_date_gmt').defaultNow(),
  postContent:         text('post_content').default(''),
  postContentJson:     jsonb('post_content_json'),
  postTitle:           text('post_title').notNull().default(''),
  postExcerpt:         text('post_excerpt').default(''),
  postStatus:          text('post_status').notNull().default('draft'),
  commentStatus:       text('comment_status').notNull().default('open'),
  pingStatus:          text('ping_status').notNull().default('open'),
  postPassword:        text('post_password').default(''),
  postName:            text('post_name').notNull().default(''),
  toPing:              text('to_ping').default(''),
  pinged:              text('pinged').default(''),
  postModified:        timestamp('post_modified').defaultNow(),
  postModifiedGmt:     timestamp('post_modified_gmt').defaultNow(),
  postContentFiltered: text('post_content_filtered').default(''),
  postParent:          uuid('post_parent'),
  guid:                text('guid').default(''),
  menuOrder:           integer('menu_order').default(0),
  postType:            text('post_type').notNull().default('post'),
  postMimeType:        text('post_mime_type').default(''),
  commentCount:        bigint('comment_count', { mode: 'number' }).default(0),
}, (t) => [
  index('pl_posts_post_name_idx').on(t.postName),
  index('pl_posts_post_type_idx').on(t.postType),
  index('pl_posts_post_status_idx').on(t.postStatus),
  index('pl_posts_post_author_idx').on(t.postAuthor),
  index('pl_posts_post_parent_idx').on(t.postParent),
  index('pl_posts_post_date_idx').on(t.postDate),
])

// ─── pl_postmeta ──────────────────────────────────────────────────────────────
export const postmeta = pgTable('pl_postmeta', {
  metaId:    bigint('meta_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  postId:    uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  metaKey:   text('meta_key'),
  metaValue: text('meta_value'),
}, (t) => [
  index('pl_postmeta_post_id_idx').on(t.postId),
  index('pl_postmeta_meta_key_idx').on(t.metaKey),
])

// ─── pl_terms ─────────────────────────────────────────────────────────────────
export const terms = pgTable('pl_terms', {
  termId:    uuid('term_id').primaryKey().defaultRandom(),
  name:      text('name').notNull(),
  slug:      text('slug').notNull(),
  termGroup: bigint('term_group', { mode: 'number' }).default(0),
}, (t) => [
  uniqueIndex('pl_terms_slug_idx').on(t.slug),
  index('pl_terms_name_idx').on(t.name),
])

// ─── pl_term_taxonomy ─────────────────────────────────────────────────────────
export const termTaxonomy = pgTable('pl_term_taxonomy', {
  termTaxonomyId: uuid('term_taxonomy_id').primaryKey().defaultRandom(),
  termId:         uuid('term_id').notNull().references(() => terms.termId, { onDelete: 'cascade' }),
  taxonomy:       text('taxonomy').notNull(),
  description:    text('description').default(''),
  parent:         uuid('parent'),
  count:          bigint('count', { mode: 'number' }).default(0),
}, (t) => [
  index('pl_term_taxonomy_taxonomy_idx').on(t.taxonomy),
  uniqueIndex('pl_term_taxonomy_term_id_taxonomy_idx').on(t.termId, t.taxonomy),
])

// ─── pl_term_relationships ────────────────────────────────────────────────────
export const termRelationships = pgTable('pl_term_relationships', {
  objectId:       uuid('object_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  termTaxonomyId: uuid('term_taxonomy_id').notNull().references(() => termTaxonomy.termTaxonomyId, { onDelete: 'cascade' }),
  termOrder:      integer('term_order').default(0),
}, (t) => [
  primaryKey({ columns: [t.objectId, t.termTaxonomyId] }),
  index('pl_term_relationships_term_taxonomy_id_idx').on(t.termTaxonomyId),
])

// ─── pl_termmeta ──────────────────────────────────────────────────────────────
export const termmeta = pgTable('pl_termmeta', {
  metaId:    bigint('meta_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  termId:    uuid('term_id').notNull().references(() => terms.termId, { onDelete: 'cascade' }),
  metaKey:   text('meta_key'),
  metaValue: text('meta_value'),
}, (t) => [
  index('pl_termmeta_term_id_idx').on(t.termId),
  index('pl_termmeta_meta_key_idx').on(t.metaKey),
])

// ─── pl_comments ──────────────────────────────────────────────────────────────
export const comments = pgTable('pl_comments', {
  commentId:          uuid('comment_id').primaryKey().defaultRandom(),
  commentPostId:      uuid('comment_post_id').references(() => posts.id, { onDelete: 'cascade' }),
  commentAuthor:      text('comment_author').notNull().default(''),
  commentAuthorEmail: text('comment_author_email').notNull().default(''),
  commentAuthorUrl:   text('comment_author_url').default(''),
  commentAuthorIp:    text('comment_author_ip').default(''),
  commentDate:        timestamp('comment_date').defaultNow(),
  commentDateGmt:     timestamp('comment_date_gmt').defaultNow(),
  commentContent:     text('comment_content').notNull(),
  commentKarma:       integer('comment_karma').default(0),
  commentApproved:    text('comment_approved').notNull().default('1'),
  commentAgent:       text('comment_agent').default(''),
  commentType:        text('comment_type').default('comment'),
  commentParent:      uuid('comment_parent'),
  userId:             uuid('user_id'),
}, (t) => [
  index('pl_comments_comment_post_id_idx').on(t.commentPostId),
  index('pl_comments_comment_approved_idx').on(t.commentApproved),
  index('pl_comments_comment_parent_idx').on(t.commentParent),
  index('pl_comments_user_id_idx').on(t.userId),
  index('pl_comments_author_email_idx').on(t.commentAuthorEmail),
])

// ─── pl_commentmeta ───────────────────────────────────────────────────────────
export const commentmeta = pgTable('pl_commentmeta', {
  metaId:    bigint('meta_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  commentId: uuid('comment_id').notNull().references(() => comments.commentId, { onDelete: 'cascade' }),
  metaKey:   text('meta_key'),
  metaValue: text('meta_value'),
}, (t) => [
  index('pl_commentmeta_comment_id_idx').on(t.commentId),
  index('pl_commentmeta_meta_key_idx').on(t.metaKey),
])

// ─── pl_options ───────────────────────────────────────────────────────────────
export const options = pgTable('pl_options', {
  optionId:    bigint('option_id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  optionName:  text('option_name').notNull().unique(),
  optionValue: text('option_value').notNull().default(''),
  autoload:    text('autoload').notNull().default('yes'),
}, (t) => [
  uniqueIndex('pl_options_option_name_idx').on(t.optionName),
  index('pl_options_autoload_idx').on(t.autoload),
])

// ─── pl_menus ─────────────────────────────────────────────────────────────────
export const menus = pgTable('pl_menus', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name').notNull(),
  slug:      text('slug').notNull(),
  location:  text('location').default(''), // primary | footer | social | ''
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('pl_menus_location_idx').on(t.location),
])

// ─── pl_menu_items ────────────────────────────────────────────────────────────
export const menuItems = pgTable('pl_menu_items', {
  id:        uuid('id').primaryKey().defaultRandom(),
  menuId:    uuid('menu_id').notNull().references(() => menus.id, { onDelete: 'cascade' }),
  parentId:  uuid('parent_id'),
  label:     text('label').notNull(),
  url:       text('url').default(''),
  postId:    uuid('post_id').references(() => posts.id, { onDelete: 'set null' }),
  menuOrder: integer('menu_order').notNull().default(0),
}, (t) => [
  index('pl_menu_items_menu_id_idx').on(t.menuId),
])

// ─── pl_links ─────────────────────────────────────────────────────────────────
export const links = pgTable('pl_links', {
  linkId:          uuid('link_id').primaryKey().defaultRandom(),
  linkUrl:         text('link_url').notNull().default(''),
  linkName:        text('link_name').notNull().default(''),
  linkImage:       text('link_image').default(''),
  linkTarget:      text('link_target').default(''),
  linkDescription: text('link_description').default(''),
  linkVisible:     text('link_visible').notNull().default('Y'),
  linkOwner:       uuid('link_owner').references(() => users.id),
  linkRating:      integer('link_rating').default(0),
  linkUpdated:     timestamp('link_updated').defaultNow(),
  linkRel:         text('link_rel').default(''),
  linkNotes:       text('link_notes').default(''),
  linkRss:         text('link_rss').default(''),
})
