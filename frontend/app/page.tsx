'use client'

import { useState } from 'react'
import {
  Archive, ArrowRight, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, DoorOpen, LayoutDashboard, Menu, MoreHorizontal, Pencil, Plus,
  Search, Settings, SlidersHorizontal, Sparkles, Trash2, Users, X, XCircle, Loader2
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetcher, parseGraphQLError, GET_RESOURCES, GET_BOOKINGS, CREATE_RESOURCE, CREATE_BOOKING, CANCEL_BOOKING, DELETE_BOOKING, CHECK_AVAILABILITY } from '@/lib/api'

type Status = 'CONFIRMED' | 'CANCELLED'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard }, { label: 'Resources', icon: DoorOpen },
  { label: 'Bookings', icon: CalendarDays }, { label: 'Availability', icon: Clock3 },
]

function formatDateInfo(dateString: string) {
  const d = new Date(dateString)
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return { time, day, dateObj: d }
}

export default function Page() {
  const [active, setActive] = useState('Dashboard')
  const [showNew, setShowNew] = useState(false)
  const [showResource, setShowResource] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'All' | Status>('All')

  const queryClient = useQueryClient()

  const { data: resData, isLoading: resLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => fetcher(GET_RESOURCES)
  })

  const { data: bookData, isLoading: bookLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => fetcher(GET_BOOKINGS)
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => fetcher(CANCEL_BOOKING, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetcher(DELETE_BOOKING, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
    }
  })

  const resources = resData?.resources || []
  const rawBookings = bookData?.bookings?.edges?.map((e: any) => e.node) || []
  
  const bookings = rawBookings.map((b: any) => {
    const start = formatDateInfo(b.startTime)
    const end = formatDateInfo(b.endTime)
    return {
      id: b.id,
      title: b.title,
      resource: b.resource.name,
      start: start.time,
      end: end.time,
      day: start.day,
      status: b.status,
      dateObj: start.dateObj
    }
  }).sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime())

  const confirmed = bookings.filter((b: any) => b.status === 'CONFIRMED')
  const cancelled = bookings.filter((b: any) => b.status === 'CANCELLED')
  const filtered = bookings.filter((b: any) => (filter === 'All' || b.status === filter) && b.title.toLowerCase().includes(query.toLowerCase()))

  const cancel = (id: string) => cancelMutation.mutate(id)
  const remove = (id: string) => deleteMutation.mutate(id)

  const isLoading = resLoading || bookLoading

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-3 pb-10"><div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="size-4" /></div><span className="font-mono text-lg font-bold tracking-tight">roomly</span></div>
        <nav className="flex flex-col gap-1">{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setActive(label); setMobileNav(false) }} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active === label ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}><Icon className="size-4" />{label}{label === 'Bookings' && <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{confirmed.length}</span>}</button>)}</nav>
        <div className="mt-auto flex flex-col gap-1"><button className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent"><Settings className="size-4" />Settings</button><button className="flex items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-sidebar-accent"><div className="grid size-8 place-items-center rounded-full bg-muted text-xs font-bold text-foreground">JD</div><div><p className="text-sm font-medium">Jordan Davis</p><p className="text-xs text-muted-foreground">Workspace admin</p></div><ChevronDown className="ml-auto size-4 text-muted-foreground" /></button></div>
      </aside>
      {mobileNav && <button aria-label="Close menu" onClick={() => setMobileNav(false)} className="fixed inset-0 z-20 bg-foreground/20 lg:hidden" />}
      <main className="lg:pl-64"><header className="flex h-16 items-center justify-between border-b border-border bg-card px-5 md:px-10"><div className="flex items-center gap-3"><button className="lg:hidden" onClick={() => setMobileNav(true)}><Menu className="size-5" /></button><span className="text-sm text-muted-foreground">Workspace / <span className="text-foreground">{active}</span></span></div><div className="flex items-center gap-4"><button className="text-muted-foreground hover:text-foreground"><CircleHelp className="size-4" /></button><button className="relative text-muted-foreground hover:text-foreground"><Bell className="size-4" /><span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-primary" /></button></div></header>
        <div className="mx-auto max-w-[1440px] p-5 md:p-10"><div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-primary">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p><h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{active === 'Dashboard' ? 'Room Booking Overview' : active}</h1><p className="mt-2 text-sm text-muted-foreground">{active === 'Dashboard' ? 'Everything happening across your workspace.' : active === 'Resources' ? 'Manage shared spaces and bookable resources.' : active === 'Bookings' ? 'View and manage all resource reservations.' : 'Find a free space for your next meeting.'}</p></div><div className="flex gap-2"><button onClick={() => setShowResource(true)} className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted">Add resource</button><button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"><Plus className="size-4" />New booking</button></div></div>
          {isLoading ? (
            <div className="flex justify-center p-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              {active === 'Dashboard' && <Dashboard confirmed={confirmed} cancelled={cancelled} resources={resources} onCancel={cancel} onDelete={remove} rawBookings={rawBookings} />}
              {active === 'Resources' && <Resources resources={resources} onNew={() => setShowResource(true)} />}
              {active === 'Bookings' && <Bookings bookings={filtered} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} onCancel={cancel} onDelete={remove} />}
              {active === 'Availability' && <Availability resources={resources} onNew={() => setShowNew(true)} />}
            </>
          )}
        </div>
      </main>
      {showNew && <NewBooking resources={resources} onClose={() => setShowNew(false)} />}
      {showResource && <NewResource onClose={() => setShowResource(false)} />}
    </div>
  )
}

function Stat({ label, value, icon: Icon, note }: { label: string; value: string | number; icon: any; note: string }) { return <div className="rounded-xl border border-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><Icon className="size-4 text-muted-foreground" /></div><div className="flex items-end justify-between"><strong className="text-3xl font-semibold tracking-tight">{value}</strong><span className="text-xs text-muted-foreground">{note}</span></div></div> }

function Dashboard({ confirmed, cancelled, resources, onCancel, onDelete, rawBookings }: any) {
  const now = new Date()
  
  // Calculate resources currently in use (live calculation)
  const busyResourceIds = new Set(
    rawBookings
      .filter((b: any) => b.status === 'CONFIRMED' && new Date(b.startTime) <= now && new Date(b.endTime) > now)
      .map((b: any) => b.resourceId)
  )
  const availableCount = resources.length - busyResourceIds.size

  return <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total resources" value={resources.length} note="in workspace" icon={DoorOpen} /><Stat label="Confirmed bookings" value={confirmed.length} note="total" icon={CalendarDays} /><Stat label="Cancelled bookings" value={cancelled.length} note="total" icon={Archive} /><Stat label="Available right now" value={`${availableCount} / ${resources.length}`} note="resources free" icon={Check} /></div><div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]"><section className="rounded-xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-semibold">Upcoming bookings</h2><p className="mt-1 text-xs text-muted-foreground">Your next reservations across the workspace</p></div><button className="flex items-center gap-1 text-sm font-medium text-primary">View all <ArrowRight className="size-4" /></button></div><div className="divide-y divide-border">{confirmed.slice(0, 5).map((b: any) => <BookingRow key={b.id} booking={b} onCancel={onCancel} onDelete={onDelete} />)}{confirmed.length === 0 && <p className="p-5 text-sm text-muted-foreground">No upcoming bookings.</p>}</div></section><section className="rounded-xl border border-border bg-card"><div className="border-b border-border p-5"><h2 className="font-semibold">Resource availability</h2><p className="mt-1 text-xs text-muted-foreground">Live status for right now</p></div><div className="flex flex-col gap-1 p-3">{resources.map((r: any, i: number) => {
    const isBusy = busyResourceIds.has(r.id)
    return <div key={r.id} className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted"><div className={`size-2 rounded-full ${isBusy ? 'bg-primary' : 'bg-chart-2'}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.name}</p><p className="text-xs text-muted-foreground">Up to {r.capacity} people</p></div><span className="text-xs text-muted-foreground">{isBusy ? 'In use' : 'Available'}</span></div>
  })}</div></section></div></> }

function BookingRow({ booking, onCancel, onDelete }: any) { return <div className="flex items-center gap-4 p-4 md:px-5"><div className="hidden size-9 place-items-center rounded-lg bg-muted sm:grid"><CalendarDays className="size-4 text-muted-foreground" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{booking.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{booking.resource} · {booking.day}</p></div><div className="hidden text-right text-sm sm:block"><p>{booking.start} – {booking.end}</p><p className="mt-1 text-xs text-muted-foreground">{booking.day}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${booking.status === 'CONFIRMED' ? 'bg-chart-2/10 text-chart-2' : 'bg-muted text-muted-foreground'}`}>{booking.status}</span><button onClick={() => onCancel(booking.id)} className="hidden text-muted-foreground hover:text-foreground md:block" aria-label="Cancel"><MoreHorizontal className="size-4" /></button></div> }

function Resources({ resources, onNew }: any) { return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{resources.map((r: any) => {
  const confirmedCount = r.bookings.filter((b: any) => b.status === 'CONFIRMED').length
  return <div key={r.id} className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"><div className="mb-8 flex items-start justify-between"><div className={`grid size-11 place-items-center rounded-xl bg-primary/15 text-primary`}><DoorOpen className="size-5" /></div><button className="text-muted-foreground"><MoreHorizontal className="size-4" /></button></div><h3 className="font-semibold">{r.name}</h3><div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Users className="size-3.5" />{r.capacity} people</span><span>·</span><span>{confirmedCount} bookings</span></div><div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-chart-2" />Ready to use</span><ArrowRight className="size-4 text-muted-foreground" /></div></div>
})}<button onClick={onNew} className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"><Plus className="size-5" /><span className="text-sm font-medium">Add a resource</span></button></div> }

function Bookings({ bookings, query, setQuery, filter, setFilter, onCancel, onDelete }: any) { return <section className="rounded-xl border border-border bg-card"><div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search bookings..." className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring md:w-72" /></div><div className="flex items-center gap-1 rounded-lg bg-muted p-1">{(['All','CONFIRMED','CANCELLED'] as const).map((x)=><button key={x} onClick={()=>setFilter(x)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${filter===x?'bg-card shadow-sm':''}`}>{x[0]+x.slice(1).toLowerCase()}</button>)}</div></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Booking</th><th className="px-5 py-3 font-medium">Resource</th><th className="px-5 py-3 font-medium">Schedule</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-border">{bookings.map((b: any)=><tr key={b.id} className="hover:bg-muted/40"><td className="px-5 py-4 font-medium">{b.title}</td><td className="px-5 py-4 text-muted-foreground">{b.resource}</td><td className="px-5 py-4 text-muted-foreground">{b.day}, {b.start} – {b.end}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${b.status==='CONFIRMED'?'bg-chart-2/10 text-chart-2':'bg-muted text-muted-foreground'}`}>{b.status}</span></td><td className="px-5 py-4"><div className="flex justify-end gap-3 text-muted-foreground"><button onClick={()=>onCancel(b.id)} aria-label="Cancel"><XCircle className="size-4" /></button><button onClick={()=>onDelete(b.id)} aria-label="Delete"><Trash2 className="size-4" /></button></div></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-border p-4 text-xs text-muted-foreground"><span>Showing {bookings.length} bookings</span><div className="flex gap-2"><button className="rounded-md border border-border p-1.5"><ChevronLeft className="size-4" /></button><button className="rounded-md border border-border p-1.5"><ChevronRight className="size-4" /></button></div></div></section> }

function Availability({ resources, onNew }: any) {
  const [resourceId, setResourceId] = useState(resources[0]?.id || '')
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0])
  const [startStr, setStartStr] = useState('09:00')
  const [endStr, setEndStr] = useState('10:00')
  
  const queryClient = useQueryClient()
  
  const startTime = new Date(`${dateStr}T${startStr}:00Z`).toISOString()
  const endTime = new Date(`${dateStr}T${endStr}:00Z`).toISOString()

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['availability', resourceId, startTime, endTime],
    queryFn: () => fetcher(CHECK_AVAILABILITY, { resourceId, startTime, endTime }),
    enabled: false
  })

  return <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-6 md:p-10"><div className="mb-8 flex items-start gap-4"><div className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary"><SlidersHorizontal className="size-5" /></div><div><h2 className="text-xl font-semibold">Find a time that works</h2><p className="mt-1 text-sm text-muted-foreground">Check a resource before creating a reservation.</p></div></div><div className="grid gap-5 md:grid-cols-2"><label className="grid gap-2 text-sm font-medium md:col-span-2">Resource<select value={resourceId} onChange={e=>setResourceId(e.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 font-normal">{resources.map((r: any)=><option key={r.id} value={r.id}>{r.name} · up to {r.capacity} people</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Date<input type="date" value={dateStr} onChange={e=>setDateStr(e.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label><div></div><label className="grid gap-2 text-sm font-medium">Start time (UTC)<input type="time" value={startStr} onChange={e=>setStartStr(e.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label><label className="grid gap-2 text-sm font-medium">End time (UTC)<input type="time" value={endStr} onChange={e=>setEndStr(e.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label></div><button onClick={()=>refetch()} disabled={isFetching} className="mt-7 w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">{isFetching ? 'Checking...' : 'Check availability'}</button>
  
  {data && data.checkAvailability.available && <div className="mt-6 flex items-center gap-4 rounded-xl border border-chart-2/20 bg-chart-2/10 p-5"><div className="grid size-9 place-items-center rounded-full bg-chart-2 text-card"><Check className="size-5" /></div><div className="flex-1"><p className="font-semibold">Resource available</p><p className="mt-1 text-xs text-muted-foreground">The resource is free during this time.</p></div><button onClick={onNew} className="text-sm font-semibold text-chart-2">Create booking</button></div>}
  
  {data && !data.checkAvailability.available && <div className="mt-6 flex items-center gap-4 rounded-xl border border-destructive/20 bg-destructive/10 p-5"><div className="grid size-9 place-items-center rounded-full bg-destructive text-destructive-foreground"><X className="size-5" /></div><div className="flex-1"><p className="font-semibold text-destructive">Unavailable</p><p className="mt-1 text-xs text-destructive/80">There are {data.checkAvailability.conflictingBookings.length} conflicting bookings.</p></div></div>}
  </div> 
}

function Modal({ title, children, onClose }: { title:string; children:React.ReactNode; onClose:()=>void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4"><div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl"><div className="flex items-center justify-between border-b border-border p-5"><h2 className="font-semibold">{title}</h2><button onClick={onClose} aria-label="Close"><X className="size-5 text-muted-foreground" /></button></div>{children}</div></div> }

function NewBooking({ resources, onClose }: any) {
  const [title,setTitle]=useState('')
  const [resourceId,setResourceId]=useState(resources[0]?.id || '')
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0])
  const [startStr, setStartStr] = useState('09:00')
  const [endStr, setEndStr] = useState('10:00')
  const [error, setError] = useState('')

  const queryClient = useQueryClient()
  
  const createMutation = useMutation({
    mutationFn: (input: any) => fetcher(CREATE_BOOKING, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      onClose()
    },
    onError: (err: any) => setError(parseGraphQLError(err))
  })

  return <Modal title="Create a new booking" onClose={onClose}><div className="grid gap-5 p-5">
    {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    <label className="grid gap-2 text-sm font-medium">Booking title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Product sync" className="h-11 rounded-lg border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label><label className="grid gap-2 text-sm font-medium">Resource<select value={resourceId} onChange={e=>setResourceId(e.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 font-normal">{resources.map((r: any)=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Date<input type="date" value={dateStr} onChange={e=>setDateStr(e.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label><div></div><label className="grid gap-2 text-sm font-medium">Start time (UTC)<input type="time" value={startStr} onChange={e=>setStartStr(e.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label><label className="grid gap-2 text-sm font-medium">End time (UTC)<input type="time" value={endStr} onChange={e=>setEndStr(e.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label></div><div className="flex justify-end gap-2 border-t border-border pt-5"><button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted">Cancel</button><button disabled={!title || createMutation.isPending} onClick={()=>{
      const startTime = new Date(`${dateStr}T${startStr}:00Z`).toISOString()
      const endTime = new Date(`${dateStr}T${endStr}:00Z`).toISOString()
      createMutation.mutate({ title, resourceId, startTime, endTime })
    }} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">{createMutation.isPending ? 'Creating...' : 'Confirm booking'}</button></div></div></Modal>
}

function NewResource({ onClose }: any) {
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('10')
  const queryClient = useQueryClient()
  
  const createMutation = useMutation({
    mutationFn: (input: any) => fetcher(CREATE_RESOURCE, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      onClose()
    }
  })

  return <Modal title="Add a resource" onClose={onClose}><div className="grid gap-5 p-5"><label className="grid gap-2 text-sm font-medium">Resource name<input value={name} onChange={e=>setName(e.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label><label className="grid gap-2 text-sm font-medium">Capacity<input type="number" value={capacity} onChange={e=>setCapacity(e.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" /></label><div className="flex justify-end gap-2 border-t border-border pt-5"><button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-muted">Cancel</button><button disabled={!name || createMutation.isPending} onClick={()=>createMutation.mutate({ name, capacity: parseInt(capacity) })} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40">{createMutation.isPending ? 'Creating...' : 'Create resource'}</button></div></div></Modal>
}
