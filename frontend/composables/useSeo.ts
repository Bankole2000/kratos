interface SeoOptions {
  title?: string
  description?: string
}

const SITE_NAME = 'Common Resources Admin'
const TITLE_TEMPLATE = (t: string) => `${t} · ${SITE_NAME}`

export const useSeo = (options: SeoOptions = {}) => {
  useSeoMeta({
    title: options.title ? TITLE_TEMPLATE(options.title) : SITE_NAME,
    description: options.description ?? 'Internal admin UI for the Common Resources Server.',
    robots: 'noindex, nofollow',
  })
}
