declare module 'astro:content' {
	interface Render {
		'.mdx': Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
			components: import('astro').MDXInstance<{}>['components'];
		}>;
	}
}

declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"wiki": {
"Actualites-Repressions.md": {
	id: "Actualites-Repressions.md";
  slug: "actualites-repressions";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Argumentaires.md": {
	id: "Argumentaires.md";
  slug: "argumentaires";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Axe-sanitaire.md": {
	id: "Axe-sanitaire.md";
  slug: "axe-sanitaire";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Camouflage-Evenement.md": {
	id: "Camouflage-Evenement.md";
  slug: "camouflage-evenement";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Changelog.md": {
	id: "Changelog.md";
  slug: "changelog";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Chronologie.md": {
	id: "Chronologie.md";
  slug: "chronologie";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Coalitions.md": {
	id: "Coalitions.md";
  slug: "coalitions";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Contacts-Allies.md": {
	id: "Contacts-Allies.md";
  slug: "contacts-allies";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Contestation.md": {
	id: "Contestation.md";
  slug: "contestation";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Coordination-Decentralisee.md": {
	id: "Coordination-Decentralisee.md";
  slug: "coordination-decentralisee";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Coordination-Defaillante.md": {
	id: "Coordination-Defaillante.md";
  slug: "coordination-defaillante";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Culturel.md": {
	id: "Culturel.md";
  slug: "culturel";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Declaration-Preuve-Legitimite.md": {
	id: "Declaration-Preuve-Legitimite.md";
  slug: "declaration-preuve-legitimite";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Definition-Ambigue-Organisateur.md": {
	id: "Definition-Ambigue-Organisateur.md";
  slug: "definition-ambigue-organisateur";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Documentation-Preemptive.md": {
	id: "Documentation-Preemptive.md";
  slug: "documentation-preemptive";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Espaces-Semi-Publics.md": {
	id: "Espaces-Semi-Publics.md";
  slug: "espaces-semi-publics";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Fragmentation-Geographique.md": {
	id: "Fragmentation-Geographique.md";
  slug: "fragmentation-geographique";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Histoire-&-Culture.md": {
	id: "Histoire-&-Culture.md";
  slug: "histoire--culture";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Home.md": {
	id: "Home.md";
  slug: "home";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Incidents-répressifs.md": {
	id: "Incidents-répressifs.md";
  slug: "incidents-répressifs";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Juridique.md": {
	id: "Juridique.md";
  slug: "juridique";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"L'esprit-des-teufeurs.md": {
	id: "L'esprit-des-teufeurs.md";
  slug: "lesprit-des-teufeurs";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Lois-En-Cours.md": {
	id: "Lois-En-Cours.md";
  slug: "lois-en-cours";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Manifesto.md": {
	id: "Manifesto.md";
  slug: "manifesto";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Manque-de-Ressources.md": {
	id: "Manque-de-Ressources.md";
  slug: "manque-de-ressources";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Mobilisation.md": {
	id: "Mobilisation.md";
  slug: "mobilisation";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Modus-Operandi.md": {
	id: "Modus-Operandi.md";
  slug: "modus-operandi";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Organisationnel.md": {
	id: "Organisationnel.md";
  slug: "organisationnel";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Patrimoine-culturel.md": {
	id: "Patrimoine-culturel.md";
  slug: "patrimoine-culturel";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Politique.md": {
	id: "Politique.md";
  slug: "politique";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Prescription-et-Delais.md": {
	id: "Prescription-et-Delais.md";
  slug: "prescription-et-delais";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Propriete-Privee-Fermee.md": {
	id: "Propriete-Privee-Fermee.md";
  slug: "propriete-privee-fermee";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Rassemblement-vs-Manifestation.md": {
	id: "Rassemblement-vs-Manifestation.md";
  slug: "rassemblement-vs-manifestation";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Repression.md": {
	id: "Repression.md";
  slug: "repression";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Sanitaire.md": {
	id: "Sanitaire.md";
  slug: "sanitaire";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Seuil-250-500-Personnes.md": {
	id: "Seuil-250-500-Personnes.md";
  slug: "seuil-250-500-personnes";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Sound-System.md": {
	id: "Sound-System.md";
  slug: "sound-system";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Sources-Fiables.md": {
	id: "Sources-Fiables.md";
  slug: "sources-fiables";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Strategie-contre-ripost.md": {
	id: "Strategie-contre-ripost.md";
  slug: "strategie-contre-ripost";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Stratégie-résistance.md": {
	id: "Stratégie-résistance.md";
  slug: "stratégie-résistance";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Sécurite-Numerique.md": {
	id: "Sécurite-Numerique.md";
  slug: "sécurite-numerique";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Sécurité-des-communications.md": {
	id: "Sécurité-des-communications.md";
  slug: "sécurité-des-communications";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Templates-Recours.md": {
	id: "Templates-Recours.md";
  slug: "templates-recours";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Terrains-Abandonnes.md": {
	id: "Terrains-Abandonnes.md";
  slug: "terrains-abandonnes";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Urgence-immédiate.md": {
	id: "Urgence-immédiate.md";
  slug: "urgence-immédiate";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Vue-d'ensemble-veille.md": {
	id: "Vue-d'ensemble-veille.md";
  slug: "vue-densemble-veille";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"ZAD-Pourquoi-État-Evite.md": {
	id: "ZAD-Pourquoi-État-Evite.md";
  slug: "zad-pourquoi-état-evite";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
"Zones-Limitrophes.md": {
	id: "Zones-Limitrophes.md";
  slug: "zones-limitrophes";
  body: string;
  collection: "wiki";
  data: any
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = never;
}
