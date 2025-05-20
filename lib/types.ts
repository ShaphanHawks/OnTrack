export interface Instance {
  id: string
  friendlyName: string
  instanceId: string
  status: boolean
  createdAt: string
}

export interface InstanceInput {
  friendlyName: string
  instanceId: string
}

export interface TensorDockInstance {
  id: string
  status: string
  // Other TensorDock API fields would go here
}
