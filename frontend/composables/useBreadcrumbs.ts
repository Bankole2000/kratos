export interface Breadcrumb {
  title: string
  to?: string
  disabled?: boolean
}

const routeLabelMap: Record<string, string> = {
  '': 'Home',
  auth: 'Auth',
  login: 'Login',
  register: 'Register',
  'forgot-password': 'Forgot Password',
  'reset-password': 'Reset Password',
  profile: 'Profile',
  settings: 'Settings',
  catalogue: 'Catalogue',
  typography: 'Typography',
  components: 'Components',
  forms: 'Forms',
  feedback: 'Feedback',
  'data-display': 'Data Display',
  layouts: 'Layouts',
  'file-upload': 'File Upload',
  pagination: 'Pagination',
  websocket: 'WebSocket',
}

const toLabel = (segment: string) =>
  routeLabelMap[segment] ??
  segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

export const useBreadcrumbs = () => {
  const route = useRoute()

  const crumbs = computed<Breadcrumb[]>(() => {
    // Pages can override via definePageMeta({ breadcrumbs: [...] })
    const meta = route.meta.breadcrumbs as Breadcrumb[] | undefined
    if (meta) return meta

    const segments = route.path.split('/').filter(Boolean)
    const result: Breadcrumb[] = [{ title: 'Home', to: '/' }]

    segments.forEach((seg, i) => {
      const path = '/' + segments.slice(0, i + 1).join('/')
      const isLast = i === segments.length - 1
      result.push({
        title: toLabel(seg),
        to: isLast ? undefined : path,
        disabled: isLast,
      })
    })

    return result
  })

  return { crumbs }
}
