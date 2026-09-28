import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob, file } from "astro/loaders";
import type { SchemaContext } from "astro:content";

// Shared shapes: a labelled link (internal variant requires a root-relative
// href) and an image that must carry alt text.
const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});
const internalLinkSchema = linkSchema.extend({ href: z.string().startsWith("/") });
const imageWithAlt = (image: SchemaContext["image"]) =>
  z.object({
    src: image(),
    alt: z.string().min(1),
  });

// Machine-readable facts for a bookable dwelling. Drives the facts strip on
// the page and Accommodation JSON-LD; prose should not restate these numbers.
const dwellingSchema = ({ image }: SchemaContext) =>
  z.object({
    name: z.string(),
    hero: imageWithAlt(image),
    // Photos listed in the Accommodation JSON-LD image array, hero first.
    // Search engines want several views of a place; the page prose photos
    // are resolved after the plugins run, so the set is declared here.
    images: z.array(image()).default([]),
    sleeps: z.number().int().positive(),
    bedrooms: z.array(
      z.object({
        bed: z.enum(["queen", "king", "double", "twin"]),
        sleeps: z.number().int().positive().default(2),
        ensuite: z.boolean().default(false),
      }),
    ),
    bathrooms: z.number().int().positive(),
    amenities: z.array(z.string().min(1)),
    // Features worth declaring to search engines but too minor for the
    // facts strip; appended to amenities in the Accommodation JSON-LD only.
    schemaAmenities: z.array(z.string().min(1)).default([]),
    // Combined House & Villa bookings are direct-only, so that page points its
    // header CTA at the contact page instead of the booking engine.
    cta: internalLinkSchema.default({ label: "Book Direct", href: "/book/" }),
  });

// Homepage-only content: section copy, image picks, captions and the
// pull-quote id live here so all content edits stay in markdown.
const homepageSchema = ({ image }: SchemaContext) =>
  z.object({
    heroLine: z.string().min(1),
    arrival: z.array(z.string().min(1)).min(1).max(3),
    dwellings: z.array(
      z.object({
        slug: z.string(),
        href: z.string().startsWith("/"),
        image: imageWithAlt(image),
        line: z.string().min(1),
      }),
    ).length(2),
    combinedLine: z.string().min(1),
    photoBand: z.array(
      imageWithAlt(image).extend({ caption: z.string().min(1) }),
    ).length(3),
    pullQuote: z.object({
      reviewId: z.string(),
      excerpt: z.string().min(1),
    }),
    reviewBand: z.array(
      z.object({
        reviewId: z.string(),
        excerpt: z.string().min(1),
      }),
    ).length(3),
    closing: z.object({
      image: imageWithAlt(image),
      line: z.string().min(1),
    }),
  });

// Scannable card groups rendered by CardGroups.astro: facts (distance,
// drive time, duration, schedule) live here as data, matching the
// dwelling-facts rule: prose should not restate these numbers.
const cardItemSchema = <const T extends [string, ...string[]]>(icons: T) =>
  z.object({
    name: z.string().min(1),
    facts: z
      .array(
        z.object({
          icon: z.enum(icons),
          label: z.string().min(1),
        }),
      )
      .default([]),
    tag: z.string().min(1).optional(),
  });

const cardGroupSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    heading: z.string().min(1),
    intro: z.string().min(1).optional(),
    items: z.array(item).min(1),
  });

// Place cards (walks, lookouts, markets) for area-guide pages.
const placeGroupSchema = ({ image }: SchemaContext) =>
  cardGroupSchema(
    cardItemSchema(["walk", "car", "calendar"]).extend({
      blurb: z.string().min(1),
      link: linkSchema.optional(),
      image: imageWithAlt(image).optional(),
    }),
  );

// Treatment menu cards (mobile massage page): duration/price facts,
// pressure as the chip.
const treatmentGroupSchema = cardGroupSchema(
  cardItemSchema(["clock"]).extend({
    blurb: z.string().min(1).optional(),
    addons: z.string().min(1).optional(),
  }),
);

// Hero videos live in the hillside-media R2 bucket, which answers byte-range
// requests; Workers static assets do not, and iOS Safari needs them to play video.
const videoUrl = z.string().startsWith("https://media.thehillside.com.au/videos/");

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: (ctx) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      dwelling: dwellingSchema(ctx).optional(),
      heroVideo: z
        .object({
          src: videoUrl,
          srcAv1: videoUrl.optional(),
          // Higher-resolution pair served from 64rem up.
          wide: z
            .object({
              src: videoUrl,
              srcAv1: videoUrl.optional(),
            })
            .optional(),
          poster: ctx.image(),
        })
        .optional(),
      homepage: homepageSchema(ctx).optional(),
      // Restructure the body as an FAQ page (rehype-faq-page.mjs) and emit
      // FAQPage JSON-LD from its h3 questions (h2s are topic groups).
      faqSchema: z.boolean().default(false),
      // Body photos open in the lightbox viewer by default; set false on
      // pages where enlarging adds nothing (e.g. the hosts portrait).
      lightbox: z.boolean().default(true),
      // Restructure the body as the guest-info policy page
      // (rehype-policy-page.mjs): chip strip, topic cards, numbered terms.
      policyPage: z.boolean().default(false),
      placeGroups: z.array(placeGroupSchema(ctx)).min(1).optional(),
      treatmentGroups: z.array(treatmentGroupSchema).min(1).optional(),
      // Fine-print lines rendered after the card groups (e.g. the
      // massage oil ingredients note).
      notes: z.array(z.string().min(1)).min(1).optional(),
      // Prominent outbound links (e.g. local visitor guides) rendered as
      // outline buttons after the place groups.
      moreLinks: z
        .object({
          intro: z.string().min(1).optional(),
          links: z.array(linkSchema).min(1),
        })
        .optional(),
      // Button rendered after the place groups, since the groups render
      // below the markdown body.
      closingCta: internalLinkSchema.optional(),
    }),
});

const gallery = defineCollection({
  loader: file("src/content/gallery.yaml"),
  schema: ({ image }) => imageWithAlt(image),
});

const reviews = defineCollection({
  loader: file("src/content/reviews.yaml"),
  schema: z.object({
    quote: z.string().min(1),
    author: z.string().min(1),
    location: z.string().min(1).optional(),
    // Short excerpt marking this review as the /reviews/ pull-quote; the
    // full quote is then left out of the grid.
    featured: z.string().min(1).optional(),
  }),
});

const reviewSources = defineCollection({
  loader: file("src/content/review-sources.yaml"),
  schema: z.object({
    platform: z.string().min(1),
    rating: z.number().positive().nullable(),
    scale: z.union([z.literal(5), z.literal(10)]),
    count: z.number().int().positive().nullable(),
    url: z.string().startsWith("https://"),
  }),
});

export const collections = { pages, gallery, reviews, reviewSources };
