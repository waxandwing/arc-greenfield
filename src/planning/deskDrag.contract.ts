import {
  DESK_PRIORITY_DRAG_MIME,
  TRAY_CAPTURE_DRAG_MIME,
  encodeDeskPriorityDrag,
  encodeTrayCaptureDrag,
  readDeskPriorityDrag,
  readTrayCaptureDrag,
} from './deskDrag'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

class MockDataTransfer {
  types: string[] = []
  private store = new Map<string, string>()
  effectAllowed = 'none'
  dropEffect = 'none'
  setData(type: string, value: string) {
    this.store.set(type, value)
    if (!this.types.includes(type)) this.types.push(type)
  }
  getData(type: string) {
    return this.store.get(type) ?? ''
  }
}

const transfer = new MockDataTransfer()
transfer.setData(TRAY_CAPTURE_DRAG_MIME, encodeTrayCaptureDrag({ kind: 'capture', captureId: 'cap-1' }))
assert(readTrayCaptureDrag(transfer as unknown as DataTransfer)?.captureId === 'cap-1', 'Tray capture drag payload must round-trip.')

transfer.setData(DESK_PRIORITY_DRAG_MIME, encodeDeskPriorityDrag({ kind: 'task', taskId: 'task-1', fromPriority: 'must' }))
assert(readDeskPriorityDrag(transfer as unknown as DataTransfer)?.taskId === 'task-1', 'Priority drag payload must round-trip.')

console.log('Desk drag contract passed')
