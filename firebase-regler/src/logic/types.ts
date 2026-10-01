export interface Membership {
  groupId: string
  pid: string
  role: 'leader' | 'deputy' | 'member'
}

export interface Task {
  id: string
  gatheringId: string
  groupId: string
  slots: number
  cancelled?: boolean
}

export interface Assignment {
  taskId: string
  pid: string
  status: 'pending' | 'confirmed' | 'declined' | 'withdrawn'
}

export interface Gathering {
  id: string
  startsAt: string // ISO format
  title: string
}
